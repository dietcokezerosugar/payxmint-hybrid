import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { GatewayRouter } from "../routing/GatewayRouter";
import { validateIpWhitelist } from "@/lib/security";

export interface PaymentIntentOptions {
  amount: number;
  orderId: string;     // referenceId from merchant
  customerMobile?: string;
  customerEmail?: string;
  apiKey: string;
  redirectUrl?: string;
  ip?: string;         // IP for whitelisting check
}

export class PaymentEngine {
  /**
   * Create a payment intent — ported from BloomXHub create_order.php
   */
  static async createIntent(options: PaymentIntentOptions) {
    const { amount, orderId, customerMobile, customerEmail, apiKey, redirectUrl, ip } = options;

    // ── 1. Validate API Key ──────────────────────────────────────────
    const keyData = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { merchant: { include: { gpayAccounts: true } } },
    });

    if (!keyData) {
      throw new Error("Invalid API Key");
    }

    if (keyData.isBlocked || keyData.merchant.status !== "ACTIVE") {
      throw new Error("API Key or Merchant account is blocked/suspended.");
    }

    // ── 1b. Validate IP Whitelist ────────────────────────────────────
    if (ip && !(await validateIpWhitelist(keyData.merchantId, ip))) {
      throw new Error(`SECURITY_ERROR: IP Address ${ip} is not authorized for this merchant.`);
    }

    // ── SaaS: Check Wallet Balance (Strict Fee Coverage) ────────────
    const isTrialActive = keyData.merchant.trialEndsAt && new Date(keyData.merchant.trialEndsAt) > new Date();

    if (!keyData.merchant.disableWallet && !isTrialActive) {
      const expectedFee = (amount * (keyData.merchant.commissionRate || 0)) / 100;
      if (keyData.merchant.walletBalance < expectedFee) {
        throw new Error(`INSUFFICIENT_FUNDS: Wallet balance (₹${keyData.merchant.walletBalance}) cannot cover the transaction fee (₹${expectedFee.toFixed(2)}). Please recharge.`);
      }
    }

    // ── 2. Enforce Monthly Limit (BEFORE creating intent) ────────────
    if (keyData.usedAmount >= keyData.monthlyLimit) {
      throw new Error("API Key monthly limit reached. Please upgrade or wait for reset.");
    }

    // ── 4. Select Merchant GPay Account (Smart SaaS Routing) ────────
    const account = await GatewayRouter.selectAccount(keyData.merchantId, amount);

    if (!account) {
      throw new Error("ROUTING_ERROR: No available gateway accounts fit this amount or limits are exceeded.");
    }

    // ── 5. Generate UPI Deep Link (exactly like BloomXHub) ───────────
    const merchantName = keyData.merchant.businessName || keyData.merchant.name;
    const upiParams = new URLSearchParams({
      pa: account.upiId,
      pn: merchantName,
      am: amount.toFixed(2),
      tid: orderId,
      tr: orderId,
      tn: `Pay ${orderId}`,
      cu: "INR",
    });
    const upiDeepLink = `upi://pay?${upiParams.toString()}`;

    // ── 6. Generate payment token (md5 of order_id + timestamp + random)
    const tokenString = orderId + Date.now().toString() + Math.floor(1000 + Math.random() * 9000).toString();
    const paymentToken = crypto.createHash("md5").update(tokenString).digest("hex");

    // ── 7. Create Intent in DB (atomic) ──────────────────────────────
    const expireAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    try {
      const intent = await prisma.paymentIntent.create({
        data: {
          merchantId: keyData.merchantId,
          apiKeyId: keyData.id,
          amount,
          referenceId: orderId,
          customerMobile: customerMobile || null,
          customerEmail: customerEmail || null,
          redirectUrl: redirectUrl || keyData.merchant.redirectUrl || null,
          upiDeepLink,
          paymentToken,
          expireAt,
        },
      });
      return intent;
    } catch (e: any) {
      if (e.code === 'P2002') throw new Error("Order ID already exists");
      throw e;
    }
  }

  /**
   * Create a special intent for Wallet Recharge (Billed to Admin Account)
   */
  static async createRechargeIntent(merchantId: string, amount: number) {
    const apiKey = await prisma.apiKey.findFirst({ where: { merchantId } });
    if (!apiKey) throw new Error("Merchant has no API keys.");

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new Error("Merchant not found");

    const account = await GatewayRouter.selectAccount(merchantId, amount, true);
    if (!account) throw new Error("No admin accounts available for recharge.");

    const orderId = `RCG_${Math.floor(Date.now() / 1000)}_${Math.floor(Math.random() * 1000)}`;
    const upiParams = new URLSearchParams({
      pa: account.upiId,
      pn: "WaveCollect SaaS",
      am: amount.toFixed(2),
      tid: orderId,
      tr: orderId,
      tn: `Wallet Recharge: ${merchant.name}`,
      cu: "INR",
    });
    const upiDeepLink = `upi://pay?${upiParams.toString()}`;

    const tokenString = orderId + Date.now().toString();
    const paymentToken = crypto.createHash("md5").update(tokenString).digest("hex");

    return await prisma.paymentIntent.create({
      data: {
        merchantId,
        apiKeyId: apiKey.id,
        amount,
        referenceId: orderId,
        upiDeepLink,
        paymentToken,
        isRecharge: true,
        expireAt: new Date(Date.now() + 30 * 60 * 1000),
      }
    });
  }
}

import axios from "axios";
import { prisma } from "@/lib/prisma";

export class NotificationService {
  private static BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  /**
   * Sends a raw message to a specific Telegram Chat ID
   */
  static async sendTelegram(chatId: string, message: string) {
    if (!this.BOT_TOKEN || !chatId) return;

    try {
      await axios.post(`https://api.telegram.org/bot${this.BOT_TOKEN}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      });
    } catch (error: any) {
      console.error("[NOTIFICATION_ERROR] Telegram Send Failed:", error.message);
    }
  }

  /**
   * Notifies a merchant about a successful transaction
   */
  static async notifyTransactionSuccess(merchantId: string, amount: number, referenceId: string, utr?: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true, phone: true } // Assuming phone might be used for chat_id or we add a specific telegram_id field
    });

    if (!merchant) return;

    const message = `
<b>🚀 Payment Received!</b>
────────────────────
<b>Merchant:</b> ${merchant.name}
<b>Amount:</b> ₹${amount.toLocaleString()}
<b>Order ID:</b> <code>${referenceId}</code>
<b>UTR:</b> <code>${utr || "N/A"}</code>
<b>Status:</b> SUCCESS ✅
────────────────────
<i>Wave Collect SaaS Engine</i>`;

    // In production, we'll fetch the merchant's specific chat_id from the DB
    // For now, we'll use a global admin log chat if available
    if (process.env.ADMIN_TELEGRAM_CHAT_ID) {
        await this.sendTelegram(process.env.ADMIN_TELEGRAM_CHAT_ID, message);
    }
  }

  /**
   * Notifies Admin when a gateway hits its limit
   */
  static async notifyLimitReached(gatewayName: string, merchantName: string, limitType: string) {
    const message = `
<b>🚨 LIMIT REACHED!</b>
────────────────────
<b>Gateway:</b> ${gatewayName}
<b>Merchant:</b> ${merchantName}
<b>Limit Type:</b> ${limitType.toUpperCase()}
<b>Action:</b> Gateway AUTO-DISABLED 🛡️
────────────────────
<i>Please check Global Fleet Monitor.</i>`;

    if (process.env.ADMIN_TELEGRAM_CHAT_ID) {
      await this.sendTelegram(process.env.ADMIN_TELEGRAM_CHAT_ID, message);
    }
  }

  /**
   * Low Wallet Balance Warning
   */
  static async notifyLowBalance(merchantName: string, balance: number) {
    const message = `
<b>⚠️ LOW WALLET BALANCE</b>
────────────────────
<b>Merchant:</b> ${merchantName}
<b>Balance:</b> ₹${balance.toLocaleString()}
<b>Threshold:</b> ₹500
────────────────────
<i>Please recharge to avoid transaction interruptions.</i>`;

    if (process.env.ADMIN_TELEGRAM_CHAT_ID) {
       await this.sendTelegram(process.env.ADMIN_TELEGRAM_CHAT_ID, message);
    }
  }
}

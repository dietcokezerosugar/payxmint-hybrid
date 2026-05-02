import { prisma } from "@/lib/prisma";
import { logApi } from "@/lib/log";
import axios from "axios";

export class MatchingEngine {
  /**
   * Called when the verification engine detects a new transaction.
   * Matches it to a pending PaymentIntent by amount + reference (note).
   * Must be idempotent — a transaction can match ONLY one intent.
   */
  static async onTransactionDetected(txn: {
    externalId: string;
    utr?: string;
    amount: number;
    payerName?: string;
    payerUpiId?: string;
    note?: string;
    timestamp?: string;
  }): Promise<boolean> {
    console.log(`[MatchingEngine] Processing txn: ${txn.externalId} amount=${txn.amount}`);

    // ── 1. Idempotency: skip if already saved ────────────────────────
    const existingTxn = await prisma.transaction.findUnique({
      where: { externalId: txn.externalId },
    });

    if (existingTxn) {
      return false; // Skip
    }

    // ── 2. Save the transaction ──────────────────────────────────────
    const newTxn = await prisma.transaction.create({
      data: {
        externalId: txn.externalId,
        utr: txn.utr || null,
        amount: txn.amount,
        payerName: txn.payerName || null,
        payerUpiId: txn.payerUpiId || null,
        note: txn.note || null,
        timestamp: txn.timestamp ? new Date(txn.timestamp) : new Date(),
      },
    });

    // ── 3. Find matching intent (STRICT NOTE MATCH) ──────────────────
    if (!txn.note) {
      // If there's no note, we cannot match it automatically in this strict design
      return true; // We saved it, but no match possible
    }

    const intent = await prisma.paymentIntent.findFirst({
      where: {
        status: "PENDING",
        referenceId: txn.note,
      },
      include: { merchant: true, apiKey: true },
    });

    if (!intent) {
      await logApi("WARN", "No matching intent for note", { txnId: txn.externalId, note: txn.note });
      return true;
    }

    console.log(`[MatchingEngine] MATCH! Intent ${intent.id} ← Txn ${txn.externalId}`);

    // ── 4. Atomic update: link intent ↔ transaction ──────────────────
    await prisma.$transaction(async (tx) => {
      // Re-check status inside transaction for concurrency safety
      const current = await tx.paymentIntent.findUnique({ where: { id: intent.id } });
      if (!current || current.status !== "PENDING") {
        throw new Error("Intent already processed (race condition prevented)");
      }

      // Mark SUCCESS
      await tx.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: "SUCCESS",
          transactionId: newTxn.id,
          payerName: txn.payerName || null,
          payerUpiId: txn.payerUpiId || null,
        },
      });

      // Update API key used amount (only on success)
      await tx.apiKey.update({
        where: { id: intent.apiKeyId },
        data: {
          usedAmount: { increment: txn.amount },
        },
      });
    });

    await logApi("INFO", "Payment matched and verified", {
      intentId: intent.id,
      txnId: newTxn.externalId,
      amount: txn.amount,
      payer: txn.payerName,
    });

    // ── 5. Trigger webhook (async, non-blocking) ─────────────────────
    if (intent.merchant.webhookUrl) {
      MatchingEngine.triggerWebhook(intent.merchant.webhookUrl, {
        event: "payment.success",
        status: "SUCCESS",
        amount: intent.amount,
        txn_id: newTxn.externalId,
        reference_id: intent.referenceId,
        utr: newTxn.utr,
        payer_name: txn.payerName,
        payer_upi: txn.payerUpiId,
        timestamp: new Date().toISOString(),
      }).catch((err) =>
        logApi("ERROR", "Webhook delivery failed", { intentId: intent.id, error: err.message })
      );
    }
    
    return true; // Newly processed
  }

  /**
   * Build the redirect URL with query params (GET).
   * Called after payment success, typically from the payment page polling.
   */
  static buildRedirectUrl(
    baseUrl: string,
    data: { status: string; amount: number; txn_id: string; reference_id: string }
  ): string {
    const url = new URL(baseUrl);
    url.searchParams.set("status", data.status);
    url.searchParams.set("amount", data.amount.toString());
    url.searchParams.set("txn_id", data.txn_id);
    url.searchParams.set("reference_id", data.reference_id);
    return url.toString();
  }

  private static async triggerWebhook(url: string, payload: Record<string, any>) {
    console.log(`[MatchingEngine] Webhook → ${url}`);
    await axios.post(url, payload, { timeout: 10000 });
    await logApi("INFO", "Webhook delivered", { url, referenceId: payload.reference_id });
  }
}

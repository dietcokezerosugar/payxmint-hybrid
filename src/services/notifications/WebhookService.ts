import axios from "axios";
import { logApi } from "@/lib/log";

export interface WebhookPayload {
  event: "payment.success" | "payment.failed" | "payment.test";
  status: string;
  amount: number;
  txn_id: string;
  reference_id: string;
  utr?: string | null;
  payer_name?: string | null;
  payer_upi?: string | null;
  timestamp: string;
}

export class WebhookService {
  /**
   * Dispatches a webhook payload to the merchant's endpoint.
   * This is intended to be non-blocking.
   */
  static async dispatch(url: string, payload: WebhookPayload) {
    console.log(`[WebhookService] Dispatching to ${url}...`);
    
    try {
      const response = await axios.post(url, payload, {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WaveCollect-Webhook-Dispatcher/1.0",
        },
      });

      await logApi("INFO", "Webhook delivered successfully", {
        url,
        referenceId: payload.reference_id,
        status: response.status,
      });

      return true;
    } catch (error: any) {
      const errorDetail = error.response?.data || error.message;
      
      await logApi("ERROR", "Webhook delivery failed", {
        url,
        referenceId: payload.reference_id,
        error: errorDetail,
      });

      console.error(`[WebhookService] Delivery failed to ${url}:`, errorDetail);
      
      // In a real production system, we would queue this for retry.
      // For now, we log it and move on to maintain throughput.
      return false;
    }
  }
}

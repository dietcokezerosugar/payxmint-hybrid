import { prisma } from "@/lib/prisma";

export async function logApi(
  level: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "CRITICAL",
  message: string,
  merchantId?: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.apiLog.create({
      data: {
        merchantId,
        level,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("[logApi] Failed to write log:", err);
  }
}

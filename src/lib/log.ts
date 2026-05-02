import { prisma } from "@/lib/prisma";

export async function logApi(
  level: "INFO" | "WARN" | "ERROR",
  message: string,
  metadata?: Record<string, any>
) {
  try {
    await prisma.apiLog.create({
      data: {
        level,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("[logApi] Failed to write log:", err);
  }
}

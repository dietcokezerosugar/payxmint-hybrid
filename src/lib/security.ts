import { prisma } from "./prisma";

/**
 * Checks if an IP address is whitelisted for a given merchant.
 * If ipWhitelist is null or empty, access is unrestricted.
 */
export async function validateIpWhitelist(merchantId: string, ip: string): Promise<boolean> {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: { ipWhitelist: true },
  });

  // No whitelist configured = unrestricted access
  if (!merchant || !merchant.ipWhitelist || merchant.ipWhitelist.trim() === "") return true;

  const allowedIps = merchant.ipWhitelist.split(",").map((i) => i.trim());
  
  // Basic exact match check
  // In production, you might want to support CIDR ranges
  return allowedIps.includes(ip);
}

import { prisma } from "@/lib/prisma";

export class WalletService {
  /**
   * Credits a merchant's wallet and creates a ledger entry.
   */
  static async credit(
    merchantId: string,
    amount: number,
    description: string,
    referenceType?: string,
    referenceId?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get current balance
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId },
        select: { walletBalance: true },
      });

      if (!merchant) throw new Error("Merchant not found");

      const newBalance = merchant.walletBalance + amount;

      // 2. Update merchant balance
      const updatedMerchant = await tx.merchant.update({
        where: { id: merchantId },
        data: { walletBalance: newBalance },
      });

      // 3. Create ledger entry
      const ledger = await tx.walletLedger.create({
        data: {
          merchantId,
          type: "CREDIT",
          amount,
          description,
          balanceAfter: newBalance,
          referenceType,
          referenceId,
        },
      });

      return { merchant: updatedMerchant, ledger };
    });
  }

  /**
   * Debits a merchant's wallet and creates a ledger entry.
   * Throws error if insufficient balance.
   */
  static async debit(
    merchantId: string,
    amount: number,
    description: string,
    referenceType?: string,
    referenceId?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get current balance
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId },
        select: { walletBalance: true },
      });

      if (!merchant) throw new Error("Merchant not found");

      if (merchant.walletBalance < amount) {
        throw new Error("Insufficient wallet balance");
      }

      const newBalance = merchant.walletBalance - amount;

      // 2. Update merchant balance
      const updatedMerchant = await tx.merchant.update({
        where: { id: merchantId },
        data: { walletBalance: newBalance },
      });

      // 3. Create ledger entry
      const ledger = await tx.walletLedger.create({
        data: {
          merchantId,
          type: "DEBIT",
          amount,
          description,
          balanceAfter: newBalance,
          referenceType,
          referenceId,
        },
      });

      return { merchant: updatedMerchant, ledger };
    });
  }
}

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
    referenceId?: string,
    externalTx?: any
  ) {
    const execute = async (tx: any) => {
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId },
        select: { walletBalance: true },
      });
      if (!merchant) throw new Error("Merchant not found");
      const newBalance = merchant.walletBalance + amount;
      await tx.merchant.update({
        where: { id: merchantId },
        data: { walletBalance: newBalance },
      });
      return await tx.walletLedger.create({
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
    };

    if (externalTx) return await execute(externalTx);
    return await prisma.$transaction(execute);
  }

  static async debit(
    merchantId: string,
    amount: number,
    description: string,
    referenceType?: string,
    referenceId?: string,
    externalTx?: any
  ) {
    const execute = async (tx: any) => {
      const merchant = await tx.merchant.findUnique({
        where: { id: merchantId },
        select: { walletBalance: true, agentId: true, agent: true },
      });
      if (!merchant) throw new Error("Merchant not found");
      if (merchant.walletBalance < amount) throw new Error("Insufficient wallet balance");
      
      const newBalance = merchant.walletBalance - amount;
      await tx.merchant.update({
        where: { id: merchantId },
        data: { walletBalance: newBalance },
      });

      // Handle Agent Referral Payouts
      if (merchant.agentId && merchant.agent) {
        const agentPayout = (amount * (merchant.agent.commissionRate || 0)) / 100;
        if (agentPayout > 0) {
          await tx.agent.update({
            where: { id: merchant.agentId },
            data: { walletBalance: { increment: agentPayout } }
          });
          await tx.agentCommissionLog.create({
            data: {
              agentId: merchant.agentId,
              merchantId: merchantId,
              amount: agentPayout,
              description: `Referral Comm: ${description}`,
              paymentIntentId: referenceId
            }
          });
        }
      }

      return await tx.walletLedger.create({
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
    };

    if (externalTx) return await execute(externalTx);
    return await prisma.$transaction(execute);
  }
}

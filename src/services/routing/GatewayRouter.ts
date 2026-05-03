import { prisma } from "@/lib/prisma";

export class GatewayRouter {
  /**
   * Selects an active GPay account that fits the transaction amount and limits.
   */
  static async selectAccount(merchantId: string, amount: number, forRecharge: boolean = false) {
    // 1. Fetch active accounts
    const accounts = await prisma.googlePayAccount.findMany({
      where: {
        isAdmin: forRecharge,
        merchantId: forRecharge ? undefined : merchantId, // For admin, merchantId doesn't matter
        status: "ACTIVE",
        minTicket: { lte: amount },
        maxTicket: { gte: amount },
      },
    });

    if (accounts.length === 0) {
      return null;
    }

    // 2. Filter by limits
    const validAccounts = accounts.filter((acc) => {
      const dailyOk = acc.dailyLimit === 0 || acc.currentDaily + amount <= acc.dailyLimit;
      const weeklyOk = acc.weeklyLimit === 0 || acc.currentWeekly + amount <= acc.weeklyLimit;
      const monthlyOk = acc.monthlyLimit === 0 || acc.currentMonthly + amount <= acc.monthlyLimit;
      
      return dailyOk && weeklyOk && monthlyOk;
    });

    if (validAccounts.length === 0) {
      return null;
    }

    // 3. Load Balancing: Round Robin (simplest: select one with lowest current daily usage)
    validAccounts.sort((a, b) => a.currentDaily - b.currentDaily);

    return validAccounts[0];
  }

  /**
   * Updates account usage after a successful transaction.
   */
  static async recordUsage(accountId: string, amount: number) {
    return await prisma.googlePayAccount.update({
      where: { id: accountId },
      data: {
        currentDaily: { increment: amount },
        currentWeekly: { increment: amount },
        currentMonthly: { increment: amount },
      },
    });
  }
}

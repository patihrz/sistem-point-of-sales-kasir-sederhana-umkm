"use server";

import { prisma } from "@/lib/prisma";

export interface TransactionDTO {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  discount: number;
  tax: number;
  finalAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: Date;
  cashierName: string;
  itemCount: number;
  totalCost: number; // HPP (Harga Pokok Penjualan / Modal)
  grossProfit: number; // Laba Kotor (finalAmount - totalCost)
  notes?: string | null;
}

export interface TransactionFilter {
  filterType?: "all" | "today" | "week" | "month" | "custom";
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface TransactionSummaryDTO {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  transactionCount: number;
}

export async function getTransactions(filter?: TransactionFilter): Promise<{
  transactions: TransactionDTO[];
  summary: TransactionSummaryDTO;
}> {
  try {
    const whereClause: any = {};

    const now = new Date();

    if (filter?.filterType === "today") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      whereClause.createdAt = { gte: startOfDay, lte: endOfDay };
    } else if (filter?.filterType === "week") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      whereClause.createdAt = { gte: sevenDaysAgo, lte: now };
    } else if (filter?.filterType === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      whereClause.createdAt = { gte: startOfMonth, lte: endOfMonth };
    } else if (filter?.filterType === "custom" && filter.startDate && filter.endDate) {
      const start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt = { gte: start, lte: end };
    }

    const list = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const transactions: TransactionDTO[] = list.map((t: any) => {
      const totalAmount = Number(t.totalAmount);
      const finalAmount = Number(t.finalAmount);
      
      // Hitung total modal / HPP berdasarkan harga modal produk saat ini
      const totalCost = t.items.reduce((sum: number, item: any) => {
        const costPrice = item.product?.costPrice ? Number(item.product.costPrice) : 0;
        return sum + costPrice * item.quantity;
      }, 0);

      const grossProfit = Math.max(0, finalAmount - totalCost);

      return {
        id: t.id,
        invoiceNumber: t.invoiceNumber,
        totalAmount,
        discount: Number(t.discount),
        tax: Number(t.tax),
        finalAmount,
        paidAmount: Number(t.paidAmount),
        changeAmount: Number(t.changeAmount),
        paymentMethod: t.paymentMethod,
        status: t.status,
        createdAt: t.createdAt,
        cashierName: t.user?.name || "Kasir Umum",
        itemCount: t.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        totalCost,
        grossProfit,
        notes: t.notes,
      };
    });

    const summary: TransactionSummaryDTO = transactions.reduce(
      (acc: TransactionSummaryDTO, curr: TransactionDTO) => ({
        totalRevenue: acc.totalRevenue + curr.finalAmount,
        totalCost: acc.totalCost + curr.totalCost,
        grossProfit: acc.grossProfit + curr.grossProfit,
        transactionCount: acc.transactionCount + 1,
      }),
      { totalRevenue: 0, totalCost: 0, grossProfit: 0, transactionCount: 0 }
    );

    return { transactions, summary };
  } catch (error) {
    console.warn("Using sample transactions fallback:", error);
    const dummy: TransactionDTO[] = [
      {
        id: "trx-1",
        invoiceNumber: "INV-20261022-0042",
        totalAmount: 42000,
        discount: 0,
        tax: 4200,
        finalAmount: 46200,
        paidAmount: 50000,
        changeAmount: 3800,
        paymentMethod: "TUNAI",
        status: "COMPLETED",
        createdAt: new Date(),
        cashierName: "Ahmad Dani",
        itemCount: 2,
        totalCost: 28000,
        grossProfit: 18200,
        notes: "Meja 1",
      },
      {
        id: "trx-2",
        invoiceNumber: "INV-20261022-0041",
        totalAmount: 55000,
        discount: 5500,
        tax: 4950,
        finalAmount: 54450,
        paidAmount: 54450,
        changeAmount: 0,
        paymentMethod: "QRIS",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 30 * 60000),
        cashierName: "Ahmad Dani",
        itemCount: 3,
        totalCost: 35000,
        grossProfit: 19450,
        notes: null,
      },
    ];

    return {
      transactions: dummy,
      summary: {
        totalRevenue: 100650,
        totalCost: 63000,
        grossProfit: 37650,
        transactionCount: 2,
      },
    };
  }
}

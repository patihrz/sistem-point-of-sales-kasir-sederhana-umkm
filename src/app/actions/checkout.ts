"use server";

import { prisma } from "@/lib/prisma";
import { PaymentMethod, TransactionStatus } from "@prisma/client";

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutItemInput[];
  paymentMethod: "TUNAI" | "QRIS" | "DEBIT" | "TRANSFER";
  paidAmount: number;
  discountPercent?: number;
  notes?: string;
  userId?: string;
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
  transaction?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    discount: number;
    tax: number;
    finalAmount: number;
    paidAmount: number;
    changeAmount: number;
    paymentMethod: string;
    createdAt: Date;
    items: {
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }[];
  };
}

export async function processCheckout(data: CheckoutRequest): Promise<CheckoutResponse> {
  try {
    if (!data.items || data.items.length === 0) {
      return { success: false, message: "Keranjang belanja kosong. Pilih produk terlebih dahulu." };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil data produk terbaru dari database untuk verifikasi harga dan stok
      const productIds = data.items.map((i) => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      let subtotal = 0;
      const orderItemsToCreate: {
        productId: string;
        productName: string;
        priceAtPurchase: number;
        quantity: number;
        subtotal: number;
      }[] = [];

      for (const item of data.items) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Stok untuk "${product.name}" tidak mencukupi. Sisa stok: ${product.stock} ${product.unit}.`
          );
        }

        const priceNumber = Number(product.price);
        const itemSubtotal = priceNumber * item.quantity;
        subtotal += itemSubtotal;

        orderItemsToCreate.push({
          productId: product.id,
          productName: product.name,
          priceAtPurchase: priceNumber,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });

        // 2. Kurangi stok produk secara langsung
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Kalkulasi Diskon, Pajak Resto (10%), Total Akhir, dan Kembalian
      const discountRate = data.discountPercent || 0;
      const discount = Math.round((subtotal * discountRate) / 100);
      const afterDiscount = subtotal - discount;
      const tax = Math.round(afterDiscount * 0.1); // Pajak Resto 10%
      const finalAmount = Math.max(0, afterDiscount + tax);

      let paidAmount = data.paidAmount;
      if (data.paymentMethod !== "TUNAI") {
        paidAmount = finalAmount; // Pembayaran non-tunai lunas pas
      }

      if (paidAmount < finalAmount) {
        throw new Error(
          `Uang pembayaran kurang. Total tagihan Rp ${finalAmount.toLocaleString("id-ID")}, dibayar Rp ${paidAmount.toLocaleString("id-ID")}`
        );
      }

      const changeAmount = paidAmount - finalAmount;

      // 4. Generate Nomor Invoice (Format: INV-YYYYMMDD-RANDOM)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

      // Mapping Enum PaymentMethod
      let mappedMethod: PaymentMethod = PaymentMethod.TUNAI;
      if (data.paymentMethod === "QRIS") mappedMethod = PaymentMethod.QRIS;
      if (data.paymentMethod === "DEBIT") mappedMethod = PaymentMethod.DEBIT;
      if (data.paymentMethod === "TRANSFER") mappedMethod = PaymentMethod.TRANSFER;

      // 5. Validasi userId terhadap database agar Foreign Key constraint tidak gagal
      let validUserId: string | null = null;
      if (data.userId) {
        const foundById = await tx.user.findUnique({ where: { id: data.userId } });
        if (foundById) {
          validUserId = foundById.id;
        } else {
          // Jika data.userId adalah email atau id demo lama, cari user di DB
          const foundByEmail = await tx.user.findFirst({
            where: {
              OR: [{ email: data.userId }, { email: "kasir@kasir.com" }, { email: "owner@kasir.com" }],
            },
          });
          if (foundByEmail) validUserId = foundByEmail.id;
        }
      }

      // Jika belum ditemukan, gunakan user aktif pertama di sistem
      if (!validUserId) {
        const fallbackUser = await tx.user.findFirst({ where: { isActive: true } });
        validUserId = fallbackUser ? fallbackUser.id : null;
      }

      // 6. Buat Record Transaksi Beserta Items
      const createdTransaction = await tx.transaction.create({
        data: {
          invoiceNumber,
          totalAmount: subtotal,
          discount,
          tax,
          finalAmount,
          paidAmount,
          changeAmount,
          paymentMethod: mappedMethod,
          status: TransactionStatus.COMPLETED,
          notes: data.notes || null,
          userId: validUserId,
          items: {
            create: orderItemsToCreate.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              priceAtPurchase: item.priceAtPurchase,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return {
        id: createdTransaction.id,
        invoiceNumber: createdTransaction.invoiceNumber,
        totalAmount: subtotal,
        discount,
        tax,
        finalAmount,
        paidAmount,
        changeAmount,
        paymentMethod: createdTransaction.paymentMethod,
        createdAt: createdTransaction.createdAt,
        items: createdTransaction.items.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          price: Number(i.priceAtPurchase),
          subtotal: Number(i.subtotal),
        })),
      };
    });

    return {
      success: true,
      message: "Transaksi berhasil diproses dan dicatat ke database.",
      transaction: result,
    };
  } catch (error: any) {
    console.error("Checkout transaction error:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat memproses transaksi.",
    };
  }
}

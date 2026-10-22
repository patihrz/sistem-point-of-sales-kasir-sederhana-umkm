"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ProductDTO {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  costPrice: number;
  stock: number;
  unit: string;
  category: string;
  categoryId: string | null;
  isActive: boolean;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

// 1. Ambil Semua Produk
export async function getProducts(): Promise<ProductDTO[]> {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      price: Number(p.price),
      costPrice: Number(p.costPrice),
      stock: p.stock,
      unit: p.unit,
      category: p.category?.name || "Umum",
      categoryId: p.categoryId,
      isActive: p.isActive,
    }));
  } catch (error) {
    console.warn("Database offline or fallback:", error);
    return [];
  }
}

// 2. Ambil Semua Kategori Beserta Jumlah Produk
export async function getCategories(): Promise<CategoryDTO[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
    }));
  } catch (error) {
    console.warn("Database offline, fallback categories:", error);
    return [
      { id: "c1", name: "Umum", slug: "umum", productCount: 0 },
      { id: "c2", name: "Makanan", slug: "makanan", productCount: 0 },
      { id: "c3", name: "Minuman", slug: "minuman", productCount: 0 },
      { id: "c4", name: "Retail", slug: "retail", productCount: 0 },
    ];
  }
}

// Helper untuk membuat slug unik
function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `kat-${Date.now()}`;
}

// 3. Tambah Kategori Baru
export async function createCategory(name: string): Promise<{ success: boolean; category?: CategoryDTO; message?: string }> {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, message: "Nama kategori tidak boleh kosong." };
    }

    let slug = makeSlug(trimmed);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const created = await prisma.category.create({
      data: {
        name: trimmed,
        slug,
      },
    });

    revalidatePath("/products");
    revalidatePath("/pos");

    return {
      success: true,
      category: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        productCount: 0,
      },
    };
  } catch (error: any) {
    return { success: false, message: error?.message || "Gagal membuat kategori baru." };
  }
}

// 4. Ubah / Edit Kategori
export async function updateCategory(id: string, name: string): Promise<{ success: boolean; message?: string }> {
  try {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, message: "Nama kategori tidak boleh kosong." };
    }

    let slug = makeSlug(trimmed);
    const existing = await prisma.category.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    await prisma.category.update({
      where: { id },
      data: { name: trimmed, slug },
    });

    revalidatePath("/products");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Gagal memperbarui kategori." };
  }
}

// 5. Hapus Kategori
export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Lepas relasi categoryId dari produk sebelum menghapus
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/products");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Gagal menghapus kategori." };
  }
}

// 6. Tambah Produk Baru
export interface ProductInput {
  name: string;
  sku?: string;
  barcode?: string | null;
  price: number;
  costPrice?: number;
  stock?: number;
  unit?: string;
  categoryId?: string | null;
}

export async function createProduct(input: ProductInput): Promise<{ success: boolean; message?: string; product?: ProductDTO }> {
  try {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      return { success: false, message: "Nama produk wajib diisi." };
    }

    if (input.price < 0) {
      return { success: false, message: "Harga jual tidak boleh negatif." };
    }

    // Buat SKU otomatis jika tidak diisi user
    let finalSku = input.sku?.trim() || "";
    if (!finalSku) {
      finalSku = `PRD-${Date.now().toString().slice(-6)}`;
    }

    // Cek apakah SKU sudah dipakai
    const existingSku = await prisma.product.findUnique({
      where: { sku: finalSku },
    });
    if (existingSku) {
      finalSku = `${finalSku}-${Math.floor(Math.random() * 900 + 100)}`;
    }

    // Cek barcode unik jika diisi
    let finalBarcode = input.barcode?.trim() || null;
    if (finalBarcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: { barcode: finalBarcode },
      });
      if (existingBarcode) {
        return { success: false, message: `Barcode "${finalBarcode}" sudah digunakan oleh produk lain.` };
      }
    }

    const created = await prisma.product.create({
      data: {
        name: trimmedName,
        sku: finalSku,
        barcode: finalBarcode,
        price: input.price,
        costPrice: input.costPrice || 0,
        stock: Math.max(0, input.stock ?? 0),
        unit: input.unit?.trim() || "pcs",
        categoryId: input.categoryId || null,
        isActive: true,
      },
      include: { category: true },
    });

    revalidatePath("/products");
    revalidatePath("/pos");

    return {
      success: true,
      product: {
        id: created.id,
        name: created.name,
        sku: created.sku,
        barcode: created.barcode,
        price: Number(created.price),
        costPrice: Number(created.costPrice),
        stock: created.stock,
        unit: created.unit,
        category: created.category?.name || "Umum",
        categoryId: created.categoryId,
        isActive: created.isActive,
      },
    };
  } catch (error: any) {
    return { success: false, message: error?.message || "Gagal menambahkan produk." };
  }
}

// 7. Update Produk
export async function updateProduct(id: string, input: ProductInput): Promise<{ success: boolean; message?: string }> {
  try {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      return { success: false, message: "Nama produk wajib diisi." };
    }

    let finalSku = input.sku?.trim() || `PRD-${Date.now().toString().slice(-6)}`;
    // Cek duplikasi SKU pada produk lain
    const existingSku = await prisma.product.findFirst({
      where: { sku: finalSku, NOT: { id } },
    });
    if (existingSku) {
      return { success: false, message: `SKU "${finalSku}" sudah digunakan produk lain.` };
    }

    let finalBarcode = input.barcode?.trim() || null;
    if (finalBarcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { barcode: finalBarcode, NOT: { id } },
      });
      if (existingBarcode) {
        return { success: false, message: `Barcode "${finalBarcode}" sudah digunakan produk lain.` };
      }
    }

    await prisma.product.update({
      where: { id },
      data: {
        name: trimmedName,
        sku: finalSku,
        barcode: finalBarcode,
        price: input.price,
        costPrice: input.costPrice || 0,
        stock: Math.max(0, input.stock ?? 0),
        unit: input.unit?.trim() || "pcs",
        categoryId: input.categoryId || null,
      },
    });

    revalidatePath("/products");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Gagal memperbarui produk." };
  }
}

// 8. Hapus Produk (Soft Delete jika ada transaksi, Hard Delete jika belum ada transaksi)
export async function deleteProduct(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const itemsCount = await prisma.transactionItem.count({
      where: { productId: id },
    });

    if (itemsCount > 0) {
      // Soft delete agar riwayat transaksi masa lalu tetap akurat
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete jika belum pernah ditransaksikan
      await prisma.product.delete({
        where: { id },
      });
    }

    revalidatePath("/products");
    revalidatePath("/pos");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Gagal menghapus produk." };
  }
}

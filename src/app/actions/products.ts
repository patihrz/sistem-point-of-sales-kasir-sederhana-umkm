"use server";

import { prisma } from "@/lib/prisma";

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

export async function getProducts(): Promise<ProductDTO[]> {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: "asc" },
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
    console.warn("Database not ready or unreachable, using default catalog cache.", error);
    // Fallback data jika docker/db belum menyala saat pertama dibuka
    return [
      { id: "fallback-1", name: "Kopi Susu Gula Aren", sku: "KOP-001", barcode: "8991001", price: 18000, costPrice: 8500, stock: 35, unit: "cup", category: "Minuman", categoryId: null, isActive: true },
      { id: "fallback-2", name: "Americano Ice Double Shot", sku: "KOP-002", barcode: "8991002", price: 15000, costPrice: 5000, stock: 40, unit: "cup", category: "Minuman", categoryId: null, isActive: true },
      { id: "fallback-3", name: "Matcha Latte Oatmilk", sku: "TEA-001", barcode: "8991003", price: 22000, costPrice: 11000, stock: 15, unit: "cup", category: "Minuman", categoryId: null, isActive: true },
      { id: "fallback-4", name: "Nasi Ayam Geprek Sambal Korek", sku: "FOD-001", barcode: "8992001", price: 24000, costPrice: 13000, stock: 12, unit: "porsi", category: "Makanan", categoryId: null, isActive: true },
      { id: "fallback-5", name: "Nasi Goreng Spesial Telur", sku: "FOD-002", barcode: "8992002", price: 22000, costPrice: 10000, stock: 18, unit: "porsi", category: "Makanan", categoryId: null, isActive: true },
      { id: "fallback-6", name: "Mie Goreng Nyemek Pedas", sku: "FOD-003", barcode: "8992003", price: 18000, costPrice: 8000, stock: 3, unit: "porsi", category: "Makanan", categoryId: null, isActive: true },
      { id: "fallback-7", name: "Croissant Butter Keju", sku: "BAK-001", barcode: "8993001", price: 16000, costPrice: 9000, stock: 8, unit: "pcs", category: "Bakery", categoryId: null, isActive: true },
      { id: "fallback-8", name: "Brownies Fudgy Almond", sku: "BAK-002", barcode: "8993002", price: 14000, costPrice: 7000, stock: 2, unit: "pcs", category: "Bakery", categoryId: null, isActive: true },
      { id: "fallback-9", name: "Air Mineral 600ml", sku: "MNR-001", barcode: "8991004", price: 5000, costPrice: 2800, stock: 50, unit: "botol", category: "Minuman", categoryId: null, isActive: true },
      { id: "fallback-10", name: "Keripik Singkong Balado", sku: "SNK-002", barcode: "8994002", price: 10000, costPrice: 5000, stock: 0, unit: "bks", category: "Snack", categoryId: null, isActive: true },
    ];
  }
}

export async function getCategories(): Promise<{ id: string; name: string }[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return categories;
  } catch {
    return [
      { id: "c1", name: "Semua" },
      { id: "c2", name: "Minuman" },
      { id: "c3", name: "Makanan" },
      { id: "c4", name: "Bakery" },
      { id: "c5", name: "Snack" },
    ];
  }
}

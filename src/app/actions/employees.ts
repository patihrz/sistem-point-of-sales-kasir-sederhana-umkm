"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface EmployeeDTO {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "KARYAWAN";
  isActive: boolean;
  createdAt: Date;
  transactionCount: number;
}

export async function getEmployees(): Promise<EmployeeDTO[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as "OWNER" | "ADMIN" | "KARYAWAN",
      isActive: u.isActive,
      createdAt: u.createdAt,
      transactionCount: u._count.transactions,
    }));
  } catch (error) {
    console.error("Failed to get employees:", error);
    return [];
  }
}

export async function createEmployee(data: {
  name: string;
  email: string;
  password: string;
  role?: "KARYAWAN" | "ADMIN";
}): Promise<{ success: boolean; message: string; employee?: EmployeeDTO }> {
  try {
    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPassword = data.password.trim();
    const role = data.role || "KARYAWAN";

    if (!cleanName) {
      return { success: false, message: "Nama lengkap kasir wajib diisi." };
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, message: "Email tidak valid. Pastikan format email benar." };
    }
    if (!cleanPassword || cleanPassword.length < 4) {
      return { success: false, message: "Kata sandi minimal 4 karakter." };
    }

    // Periksa apakah email sudah terdaftar
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return {
        success: false,
        message: `Email "${cleanEmail}" sudah digunakan oleh akun lain. Gunakan email berbeda.`,
      };
    }

    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: role,
        isActive: true,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/pos");

    return {
      success: true,
      message: `Akun kasir "${newUser.name}" berhasil dibuat! Kasir dapat langsung login.`,
      employee: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as "OWNER" | "ADMIN" | "KARYAWAN",
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        transactionCount: 0,
      },
    };
  } catch (error: any) {
    console.error("Create employee error:", error);
    return {
      success: false,
      message: error?.message || "Gagal menambahkan kasir baru.",
    };
  }
}

export async function toggleEmployeeStatus(
  id: string
): Promise<{ success: boolean; message: string; newStatus?: boolean }> {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return { success: false, message: "Data kasir tidak ditemukan." };
    }

    if (user.role === "OWNER") {
      return { success: false, message: "Akun pemilik toko (Owner) tidak bisa dinonaktifkan." };
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Status kasir "${updated.name}" berhasil diubah menjadi ${
        updated.isActive ? "Aktif" : "Nonaktif"
      }.`,
      newStatus: updated.isActive,
    };
  } catch (error: any) {
    console.error("Toggle employee status error:", error);
    return {
      success: false,
      message: error?.message || "Gagal mengubah status kasir.",
    };
  }
}

export async function deleteEmployee(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (!user) {
      return { success: false, message: "Data kasir tidak ditemukan." };
    }

    if (user.role === "OWNER") {
      return { success: false, message: "Akun pemilik toko (Owner) tidak dapat dihapus." };
    }

    // Jika sudah pernah memproses transaksi, jangan hapus permanen agar data audit transaksi aman
    if (user._count.transactions > 0) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      revalidatePath("/dashboard");
      return {
        success: true,
        message: `Kasir memiliki ${user._count.transactions} riwayat transaksi. Akun dinonaktifkan agar rekap data keuangan tetap aman.`,
      };
    }

    // Jika belum pernah ada transaksi, boleh dihapus permanen
    await prisma.user.delete({ where: { id } });
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Akun kasir "${user.name}" berhasil dihapus secara permanen.`,
    };
  } catch (error: any) {
    console.error("Delete employee error:", error);
    return {
      success: false,
      message: error?.message || "Gagal menghapus kasir.",
    };
  }
}

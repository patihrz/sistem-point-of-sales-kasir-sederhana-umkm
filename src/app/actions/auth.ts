"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "KARYAWAN";
}

export async function loginUser(email: string, password: string): Promise<{
  success: boolean;
  message: string;
  user?: SessionUser;
  redirectTo?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Cari user di database MySQL via Prisma
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return { success: false, message: "Email atau kata sandi tidak ditemukan." };
    }

    if (!user.isActive) {
      return { success: false, message: "Akun ini telah dinonaktifkan." };
    }

    // 2. Verifikasi kata sandi
    if (user.password !== cleanPassword) {
      return { success: false, message: "Kata sandi yang Anda masukkan salah." };
    }

    const sessionData: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "OWNER" | "ADMIN" | "KARYAWAN",
    };

    // 3. Simpan session di Cookie (berlaku 7 hari)
    const cookieStore = await cookies();
    cookieStore.set("kasir_session", JSON.stringify(sessionData), {
      httpOnly: false, // agar bisa dibaca juga oleh komponen UI client kasir
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    // 4. Arahkan berdasarkan Role (RBAC)
    const redirectTo = user.role === "KARYAWAN" ? "/pos" : "/dashboard";

    return {
      success: true,
      message: "Login berhasil!",
      user: sessionData,
      redirectTo,
    };
  } catch (error: any) {
    console.error("Login error:", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan pada server saat mencoba login.",
    };
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get("kasir_session");
    if (!cookie?.value) return null;
    return JSON.parse(cookie.value);
  } catch {
    return null;
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("kasir_session");
}

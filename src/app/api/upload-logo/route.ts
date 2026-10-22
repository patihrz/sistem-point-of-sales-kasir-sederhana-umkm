import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "File logo tidak ditemukan." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Format file tidak didukung. Gunakan PNG, JPG, atau WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Ukuran file terlalu besar. Maksimum 2 MB." },
        { status: 400 }
      );
    }

    // Buat direktori uploads jika belum ada
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Nama file unik berdasar timestamp + ekstensi asli
    const ext = file.name.split(".").pop() || "png";
    const fileName = `store-logo-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Simpan URL ke database (singleton StoreSetting)
    const logoUrl = `/uploads/${fileName}`;
    await (prisma as any).storeSetting.upsert({
      where: { id: "default" },
      update: { logoUrl },
      create: { id: "default", logoUrl },
    });

    return NextResponse.json({ success: true, logoUrl }, { status: 200 });
  } catch (error: any) {
    console.error("Upload logo error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal mengupload logo." },
      { status: 500 }
    );
  }
}

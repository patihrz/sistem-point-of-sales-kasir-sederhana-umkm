import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
const ALLOWED_EXTS = ["png", "jpg", "jpeg", "webp", "gif", "svg"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "File logo tidak ditemukan." }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const isValidType = ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTS.includes(ext);

    if (!isValidType) {
      return NextResponse.json(
        { success: false, message: "Format file tidak didukung. Gunakan PNG, JPG, JPEG, WebP, atau SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Ukuran file terlalu besar. Maksimum 5 MB." },
        { status: 400 }
      );
    }

    // Buat direktori uploads jika belum ada
    const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // Nama file unik berdasar timestamp + ekstensi asli yang sudah dibersihkan
    const sanitizedExt = ALLOWED_EXTS.includes(ext) ? ext : "png";
    const fileName = `store-logo-${Date.now()}.${sanitizedExt}`;
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

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/pos");

    return NextResponse.json({ 
      success: true, 
      logoUrl, 
      message: "Logo toko berhasil disimpan!" 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Upload logo error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal mengupload logo." },
      { status: 500 }
    );
  }
}

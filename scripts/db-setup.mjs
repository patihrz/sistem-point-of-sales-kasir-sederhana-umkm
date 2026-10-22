import { execSync } from "child_process";

console.log("\n==========================================");
console.log("🚀 Menjalankan Setup Otomatis Database KasirSimpel");
console.log("==========================================\n");

function runCommand(command, description) {
  console.log(`▶ ${description}...`);
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`❌ Gagal pada tahap: ${description}`);
    process.exit(1);
  }
}

// 1. Jalankan Docker Compose
runCommand("docker compose up -d", "1. Menjalankan Docker Container (MySQL 8.0 & Adminer)");

// 2. Beri jeda singkat agar container MySQL siap menerima query
console.log("▶ 2. Memastikan koneksi MySQL stabil...");
await new Promise((resolve) => setTimeout(resolve, 3000));

// 3. Sinkronisasi Skema Prisma ke MySQL (dengan --skip-generate agar aman saat dev server aktif)
runCommand("npx prisma db push --skip-generate", "3. Menerapkan Skema Prisma ke Database MySQL");

// 4. Jalankan Seeding Data Dummy
runCommand("npx prisma db seed", "4. Mengisi data awal dummy (User, Kategori, Produk)");

console.log("\n==========================================");
console.log("✅ Setup Database KasirSimpel Berhasil 100%!");
console.log("👉 Akun Owner   : owner@kasir.com (pass: owner123)");
console.log("👉 Akun Karyawan: kasir@kasir.com (pass: kasir123)");
console.log("👉 Adminer GUI  : http://localhost:8080");
console.log("👉 Buka Kasir   : http://localhost:3000");
console.log("==========================================\n");

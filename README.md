# KasirKITA — Sistem Point of Sales untuk UMKM

Aplikasi kasir berbasis web yang dibuat untuk memudahkan toko dan warung kecil dalam mencatat penjualan, mengelola stok barang, dan mencetak struk. Dibangun dengan **Next.js 15**, **MySQL**, **Prisma ORM**, dan **Tailwind CSS**.

---

## Yang Dibutuhkan

Sebelum mulai, pastikan sudah terinstal di komputer kamu:

- [Node.js](https://nodejs.org/) versi 20 ke atas
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (pastikan sudah dibuka dan berjalan)
- [Git](https://git-scm.com/)

---

## Cara Instalasi

### 1. Clone dan masuk ke folder proyek

```bash
git clone https://github.com/patihrz/sistem-point-of-sales-kasir-sederhana-umkm.git
cd sistem-point-of-sales-kasir-sederhana-umkm
```

### 2. Instal dependensi

```bash
npm install
```

### 3. Buat file environment

Salin file `.env.example` jadi `.env`:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

Isi default dari `.env`:
```env
DATABASE_URL="mysql://root:rootpassword@localhost:3306/kasir_simpel"
NEXTAUTH_SECRET="ganti_dengan_secret_kalian"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Siapkan database

Cukup jalankan satu perintah ini:

```bash
npm run db:setup
```

Perintah di atas akan otomatis:
1. Menjalankan MySQL dan Adminer lewat Docker.
2. Menunggu sampai MySQL siap dipakai.
3. Membuat tabel-tabel yang diperlukan.
4. Mengisi data contoh (produk, kategori, dan akun demo).

### 5. Jalankan aplikasi

```bash
npm run dev
```

Buka browser dan akses **http://localhost:3000** — kamu akan langsung masuk ke halaman login.

---

## Akun Demo

Setelah setup selesai, kamu bisa langsung login pakai akun di bawah ini:

| Peran | Email | Password | Bisa akses apa? |
|---|---|---|---|
| **Pemilik Toko** | `owner@kasir.com` | `owner123` | Semua fitur: dashboard, produk, riwayat penjualan, pengaturan toko |
| **Kasir** | `kasir@kasir.com` | `kasir123` | Halaman kasir untuk melayani transaksi dan cetak struk |

Di halaman login juga ada tombol cepat untuk langsung masuk tanpa perlu ketik manual.

---

## Perintah yang Tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan aplikasi di mode development |
| `npm run db:setup` | Setup lengkap: Docker + tabel + data contoh |
| `npm run db:up` | Nyalakan container Docker (MySQL dan Adminer) |
| `npm run db:down` | Matikan container Docker |
| `npm run db:seed` | Isi ulang data contoh |

---

## Melihat Isi Database (Adminer)

Kalau mau lihat langsung isi tabel di MySQL:

- Buka **http://localhost:8080**
- Sistem: MySQL
- Server: `mysql`
- Username: `root`
- Password: `rootpassword`
- Database: `kasir_simpel`

---

## Shortcut Keyboard di Halaman Kasir

| Tombol | Fungsi |
|---|---|
| **F2** | Fokus ke kolom pencarian produk |
| **F9** | Proses pembayaran |
| **Esc** | Tutup pop-up / batal |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript, React 19)
- **Database:** MySQL 8.0 (via Docker)
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **Ikon:** Lucide React

---

## Lisensi

Proyek ini open-source di bawah lisensi **MIT**. Bebas dipakai, dimodifikasi, dan dikembangkan.

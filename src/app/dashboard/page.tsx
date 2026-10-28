import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getDashboardStats } from "@/app/actions/dashboard";
import { getStoreSetting } from "@/app/actions/settings";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  AlertTriangle,
  Store,
  ArrowRight,
  Receipt,
  Plus,
  Settings,
  MapPin,
  Phone,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, storeSetting] = await Promise.all([
    getDashboardStats(),
    getStoreSetting(),
  ]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <AppShell pageTitle="Ringkasan Toko Hari Ini">
      <div className="space-y-6">
        {/* Banner Aksi Cepat Buka Kasir */}
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Kasir siap digunakan
            </div>
            <h2 className="text-lg font-bold">Mau mulai jualan sekarang?</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik tombol di samping atau tekan <strong className="text-white">F2</strong> untuk langsung buka kasir.
            </p>
          </div>

          <Link
            href="/pos"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors shrink-0"
          >
            <Store className="w-4 h-4" />
            <span>Buka Kasir Sekarang</span>
          </Link>
        </div>

        {/* 4 Kartu Statistik Metrik Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Penjualan Hari Ini */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Penjualan Hari Ini</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-tight">
              {formatRupiah(stats.todaySales)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Omset masuk hari ini</p>
          </div>

          {/* Jumlah Transaksi */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Transaksi Hari Ini</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-tight">
              {stats.todayTransactions} <span className="text-sm font-normal text-slate-500">transaksi</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Pelanggan yang sudah dilayani</p>
          </div>

          {/* Estimasi Laba Kotor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Perkiraan Untung</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-tight">
              {formatRupiah(stats.estimatedProfit)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Penjualan dikurangi modal hari ini</p>
          </div>

          {/* Total Produk */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Produk Aktif</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 leading-tight">
              {stats.totalProducts} <span className="text-sm font-normal text-slate-500">item</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Produk yang bisa dijual sekarang</p>
          </div>
        </div>

        {/* Card: Identitas Toko & Informasi Struk */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Identitas Toko & Informasi Struk</h3>
                <p className="text-xs text-slate-500">
                  Data profil usaha yang dicetak otomatis pada header & footer struk kasir
                </p>
              </div>
            </div>

            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Kelola Profil & Struk</span>
            </Link>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Logo Preview & Badge */}
            <div className="md:col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left gap-3 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4">
              <div className="w-20 h-20 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {storeSetting.logoUrl ? (
                  <img
                    src={storeSetting.logoUrl}
                    alt={storeSetting.storeName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Store className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div>
                {storeSetting.logoUrl ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Logo Aktif di Struk
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    Belum Ada Logo
                  </span>
                )}
                <Link
                  href="/settings"
                  className="block text-[11px] text-emerald-600 hover:underline font-semibold mt-1"
                >
                  {storeSetting.logoUrl ? "Ganti Logo Toko" : "+ Upload Logo Toko"}
                </Link>
              </div>
            </div>

            {/* Detail Identitas */}
            <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nama Toko</span>
                <p className="font-bold text-slate-900 text-sm">{storeSetting.storeName || "Belum diatur"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kontak / Telepon</span>
                <p className="text-slate-700 font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{storeSetting.phoneNumber || "-"}</span>
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Catatan Kaki Struk</span>
                <p className="text-slate-700 italic flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-2">{storeSetting.receiptFooter || "Terima kasih atas kunjungan Anda!"}</span>
                </p>
              </div>

              <div className="space-y-1 sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Usaha</span>
                <p className="text-slate-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{storeSetting.address || "Alamat belum diisi"}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Section: Peringatan Stok & Transaksi Terakhir */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kolom Kiri: Peringatan Stok Menipis */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Stok hampir habis</h3>
              </div>
              <Link
                href="/products"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Kelola Stok</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4 flex-1">
              {stats.lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Semua stok produk masih aman. 👍
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.lowStockProducts.map((p) => {
                    const isZero = p.stock === 0;
                    return (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-800">{p.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{formatRupiah(p.price)}</p>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                            isZero
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {isZero ? "Habis" : `Sisa ${p.stock} ${p.unit}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Transaksi Terakhir Hari Ini */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Penjualan terbaru hari ini</h3>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4 flex-1">
              {stats.recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada penjualan hari ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recentTransactions.map((trx) => (
                    <div key={trx.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{trx.invoiceNumber}</span>
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {trx.paymentMethod}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Kasir: {trx.cashierName} &bull;{" "}
                          {new Date(trx.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-emerald-700">
                        {formatRupiah(trx.finalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

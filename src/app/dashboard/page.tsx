import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getDashboardStats } from "@/app/actions/dashboard";
import { getStoreSetting } from "@/app/actions/settings";
import { getEmployees } from "@/app/actions/employees";
import EmployeeManagementSection from "@/components/dashboard/EmployeeManagementSection";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Package,
  AlertTriangle,
  Store,
  ArrowRight,
  Receipt,
  Settings,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [stats, storeSetting, employees] = await Promise.all([
    getDashboardStats(),
    getStoreSetting(),
    getEmployees(),
  ]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <AppShell pageTitle="Ringkasan Toko">
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Minimalist Top Welcome & Action Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Performa Penjualan Hari Ini
            </h2>
            <p className="text-xs text-slate-400">
              Pantau arus transaksi kasir, laba kotor, dan ketersediaan stok
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Pengaturan</span>
            </Link>

            <Link
              href="/pos"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Buka Kasir</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-emerald-700 text-emerald-100 rounded text-[10px] font-mono">
                F2
              </kbd>
            </Link>
          </div>
        </div>

        {/* 4 Minimalist Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Penjualan Hari Ini */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Penjualan Hari Ini
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {formatRupiah(stats.todaySales)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Total omset masuk</p>
            </div>
          </div>

          {/* Transaksi Hari Ini */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Transaksi
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {stats.todayTransactions}{" "}
                <span className="text-xs font-normal text-slate-400">struk</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pelanggan terlayani</p>
            </div>
          </div>

          {/* Perkiraan Laba Kotor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Estimasi Laba
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {formatRupiah(stats.estimatedProfit)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Omset dikurangi modal</p>
            </div>
          </div>

          {/* Total Produk */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Produk Aktif
              </span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {stats.totalProducts}{" "}
                <span className="text-xs font-normal text-slate-400">item</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Siap dijual di POS</p>
            </div>
          </div>
        </div>

        {/* Minimalist 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Kolom Kiri (7 Kolom): Penjualan Terbaru & Manajemen Staf */}
          <div className="lg:col-span-7 space-y-5">
            {/* Card: Penjualan Terbaru */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Penjualan Terbaru
                  </h3>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>Semua Transaksi</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100/70">
                {stats.recentTransactions.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Belum ada transaksi yang tercatat hari ini.
                  </div>
                ) : (
                  stats.recentTransactions.map((trx) => (
                    <div
                      key={trx.id}
                      className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 font-mono text-[11px]">
                            {trx.invoiceNumber}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {trx.paymentMethod}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {trx.cashierName} &bull;{" "}
                          {new Date(trx.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <span className="font-bold text-emerald-700 font-mono text-sm">
                        {formatRupiah(trx.finalAmount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Card: Manajemen Staf Kasir */}
            <EmployeeManagementSection initialEmployees={employees} />
          </div>

          {/* Kolom Kanan (5 Kolom): Stok Menipis & Profil Toko Minimalis */}
          <div className="lg:col-span-5 space-y-5">
            {/* Card: Stok Menipis */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Perhatian Stok
                  </h3>
                </div>
                <Link
                  href="/products"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>Kelola</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100/70">
                {stats.lowStockProducts.length === 0 ? (
                  <div className="py-7 text-center text-slate-400 text-xs">
                    Semua stok produk saat ini aman. 👍
                  </div>
                ) : (
                  stats.lowStockProducts.map((p) => {
                    const isZero = p.stock === 0;
                    return (
                      <div
                        key={p.id}
                        className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors text-xs"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="font-semibold text-slate-800 truncate">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {p.sku} &bull; {formatRupiah(p.price)}
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isZero
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isZero ? "Habis" : `Sisa ${p.stock}`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Card: Profil & Identitas Toko (Minimalist Widget) */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Identitas Toko
                  </h3>
                </div>
                <Link
                  href="/settings"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Ubah
                </Link>
              </div>

              <div className="p-5 space-y-3.5 text-xs">
                {/* Logo & Nama */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                    {storeSetting.logoUrl ? (
                      <img
                        src={storeSetting.logoUrl}
                        alt={storeSetting.storeName}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Store className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">
                      {storeSetting.storeName}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>{storeSetting.phoneNumber || "Belum ada telepon"}</span>
                    </p>
                  </div>
                </div>

                {/* Alamat & Pesan Kaki Struk */}
                <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                  {storeSetting.address && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">
                        {storeSetting.address}
                      </span>
                    </div>
                  )}

                  {storeSetting.receiptFooter && (
                    <div className="flex items-start gap-1.5 text-slate-400 italic">
                      <Receipt className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        &ldquo;{storeSetting.receiptFooter}&rdquo;
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

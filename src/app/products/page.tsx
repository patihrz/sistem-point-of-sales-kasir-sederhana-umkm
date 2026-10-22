import AppShell from "@/components/AppShell";
import { getProducts } from "@/app/actions/products";
import { Package, Plus, Search, AlertCircle, ArrowUpDown } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProducts();

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <AppShell pageTitle="Daftar Produk">
      <div className="space-y-4">
        {/* Top Controls & Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Semua produk tokomu</h2>
            <p className="text-xs text-slate-500">
              {products.length} produk terdaftar
            </p>
          </div>

          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>TAMBAH PRODUK BARU</span>
          </button>
        </div>

        {/* Tabel Data Klasik Padat & Bersih (Spreadsheet style) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">SKU / Kode</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Harga Modal</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-right">Margin Laba</th>
                  <th className="py-3 px-4 text-center">Stok</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Belum ada produk. Tambah produk dulu yuk.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const margin = p.price - p.costPrice;
                    const marginPercent = p.price > 0 ? Math.round((margin / p.price) * 100) : 0;
                    const isLowStock = p.stock <= 5 && p.stock > 0;
                    const isOutOfStock = p.stock <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {p.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600 font-mono">
                          {formatRupiah(p.costPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                          {formatRupiah(p.price)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-600 font-mono">
                          {formatRupiah(margin)}{" "}
                          <span className="text-[10px] text-emerald-600">({marginPercent}%)</span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                              isOutOfStock
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : isLowStock
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "text-slate-800"
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOutOfStock
                                ? "bg-rose-100 text-rose-800"
                                : isLowStock
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isOutOfStock ? "Habis" : isLowStock ? "Hampir habis" : "Tersedia"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

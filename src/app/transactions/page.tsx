import AppShell from "@/components/AppShell";
import { getTransactions } from "@/app/actions/transactions";
import { Receipt, CheckCircle2, Search, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const transactions = await getTransactions();

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <AppShell pageTitle="Riwayat Penjualan">
      <div className="space-y-4">
        {/* Top Header Information */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Semua penjualan</h2>
            <p className="text-xs text-slate-500">
              Menampilkan {transactions.length} transaksi terakhir
            </p>
          </div>
        </div>

        {/* Tabel Riwayat Transaksi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Waktu Transaksi</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4 text-center">Item</th>
                  <th className="py-3 px-4 text-center">Metode</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Total Akhir</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Belum ada penjualan yang tercatat.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {t.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(t.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        &bull;{" "}
                        {new Date(t.createdAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{t.cashierName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                          {t.itemCount} item
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            t.paymentMethod === "TUNAI"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 font-mono">
                        {formatRupiah(t.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono text-sm">
                        {formatRupiah(t.finalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Lunas</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

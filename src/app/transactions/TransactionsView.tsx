"use client";

import React, { useState, useTransition } from "react";
import {
  Receipt,
  CheckCircle2,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Search,
  Filter,
} from "lucide-react";
import { TransactionDTO, TransactionSummaryDTO, getTransactions } from "@/app/actions/transactions";

interface TransactionsViewProps {
  initialTransactions: TransactionDTO[];
  initialSummary: TransactionSummaryDTO;
}

export default function TransactionsView({
  initialTransactions,
  initialSummary,
}: TransactionsViewProps) {
  const [transactions, setTransactions] = useState<TransactionDTO[]>(initialTransactions);
  const [summary, setSummary] = useState<TransactionSummaryDTO>(initialSummary);
  const [filterType, setFilterType] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleFilterChange = (type: "all" | "today" | "week" | "month" | "custom") => {
    setFilterType(type);
    if (type !== "custom") {
      startTransition(async () => {
        const res = await getTransactions({ filterType: type });
        setTransactions(res.transactions);
        setSummary(res.summary);
      });
    }
  };

  const handleApplyCustomDate = () => {
    if (!startDate || !endDate) return;
    startTransition(async () => {
      const res = await getTransactions({
        filterType: "custom",
        startDate,
        endDate,
      });
      setTransactions(res.transactions);
      setSummary(res.summary);
    });
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    let exportUrl = `/api/transactions/export?filterType=${filterType}`;
    if (filterType === "custom" && startDate && endDate) {
      exportUrl += `&startDate=${startDate}&endDate=${endDate}`;
    }

    // Trigger download
    const link = document.createElement("a");
    link.href = exportUrl;
    link.setAttribute("download", "");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
    }, 1500);
  };

  // Filter pencarian berdasarkan invoice atau nama kasir
  const filteredList = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.invoiceNumber.toLowerCase().includes(q) ||
      t.cashierName.toLowerCase().includes(q) ||
      (t.notes && t.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Kartu Ringkasan Pembukuan UMKM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Omzet Penjualan</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {formatRupiah(summary.totalRevenue)}
          </p>
          <span className="text-[11px] text-slate-400">Total penerimaan kotor</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Modal (HPP)</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {formatRupiah(summary.totalCost)}
          </p>
          <span className="text-[11px] text-slate-400">Harga pokok barang terjual</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Laba Kotor Toko</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-emerald-700 font-mono">
            {formatRupiah(summary.grossProfit)}
          </p>
          <span className="text-[11px] text-slate-400">Omzet dikurangi modal</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Transaksi</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 font-mono">
            {summary.transactionCount} <span className="text-xs font-normal text-slate-500">struk</span>
          </p>
          <span className="text-[11px] text-slate-400">Transaksi selesai</span>
        </div>
      </div>

      {/* Bar Filter Rentang Tanggal & Tombol Export CSV */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "Semua" },
              { id: "today", label: "Hari Ini" },
              { id: "week", label: "7 Hari Terakhir" },
              { id: "month", label: "Bulan Ini" },
              { id: "custom", label: "Kustom Tanggal" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => handleFilterChange(f.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  filterType === f.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Action Tombol Export CSV */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={isExporting || transactions.length === 0}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? "Menyiapkan File..." : "Export CSV / Excel"}</span>
            </button>
          </div>
        </div>

        {/* Input Kustom Tanggal (Muncul bila tab Kustom Tanggal dipilih) */}
        {filterType === "custom" && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Dari Tanggal:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
            <span className="text-slate-500 font-medium">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
            <button
              onClick={handleApplyCustomDate}
              disabled={!startDate || !endDate}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        )}

        {/* Search Bar Transaksi */}
        <div className="relative pt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 mt-0.5" />
          <input
            type="text"
            placeholder="Cari nomor invoice, nama kasir, atau catatan pembeli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
          />
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
                <th className="py-3 px-4 text-right">Modal (HPP)</th>
                <th className="py-3 px-4 text-right">Total Omzet</th>
                <th className="py-3 px-4 text-right">Laba Kotor</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {isPending ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada penjualan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div>{t.invoiceNumber}</div>
                      {t.notes && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          Ket: {t.notes}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
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
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {t.cashierName}
                    </td>
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
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">
                      {formatRupiah(t.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatRupiah(t.finalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 font-mono">
                      +{formatRupiah(t.grossProfit)}
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
  );
}

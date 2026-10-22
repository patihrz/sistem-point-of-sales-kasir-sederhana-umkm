import { NextRequest, NextResponse } from "next/server";
import { getTransactions, TransactionFilter } from "@/app/actions/transactions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get("filterType") as TransactionFilter["filterType"] || "all";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const { transactions, summary } = await getTransactions({
      filterType,
      startDate,
      endDate,
    });

    // Helper untuk escape CSV field
    const escapeCsv = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    // Header Kolom CSV
    const headers = [
      "No Invoice",
      "Tanggal",
      "Waktu",
      "Kasir",
      "Jumlah Item",
      "Total Penjualan (Rp)",
      "Total Modal / HPP (Rp)",
      "Laba Kotor (Rp)",
      "Metode Bayar",
      "Status",
      "Catatan",
    ];

    let csvContent = "\uFEFF"; // UTF-8 BOM agar rapi saat dibuka di Microsoft Excel
    csvContent += headers.map((h) => `"${h}"`).join(",") + "\r\n";

    let totalItems = 0;

    for (const t of transactions) {
      const dateObj = new Date(t.createdAt);
      const dateStr = dateObj.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const timeStr = dateObj.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      totalItems += t.itemCount;

      const row = [
        escapeCsv(t.invoiceNumber),
        escapeCsv(dateStr),
        escapeCsv(timeStr),
        escapeCsv(t.cashierName),
        t.itemCount,
        t.finalAmount,
        t.totalCost,
        t.grossProfit,
        escapeCsv(t.paymentMethod),
        escapeCsv(t.status === "COMPLETED" ? "Lunas" : t.status),
        escapeCsv(t.notes || "-"),
      ];

      csvContent += row.join(",") + "\r\n";
    }

    // Baris Total Ringkasan Pembukuan
    csvContent += "\r\n";
    const summaryRow = [
      escapeCsv("TOTAL RINGKASAN"),
      '""',
      '""',
      '""',
      totalItems,
      summary.totalRevenue,
      summary.totalCost,
      summary.grossProfit,
      '""',
      '""',
      '""',
    ];
    csvContent += summaryRow.join(",") + "\r\n";

    const fileNameDate = new Date().toISOString().slice(0, 10);
    const fileName = `rekap-penjualan-kasirkita-${filterType}-${fileNameDate}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    console.error("Gagal export CSV:", error);
    return NextResponse.json(
      { error: "Gagal membuat file export: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}

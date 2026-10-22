import AppShell from "@/components/AppShell";
import { getTransactions } from "@/app/actions/transactions";
import TransactionsView from "./TransactionsView";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const { transactions, summary } = await getTransactions({ filterType: "all" });

  return (
    <AppShell pageTitle="Riwayat Penjualan">
      <TransactionsView
        initialTransactions={transactions}
        initialSummary={summary}
      />
    </AppShell>
  );
}

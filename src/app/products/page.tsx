import AppShell from "@/components/AppShell";
import { getProducts, getCategories } from "@/app/actions/products";
import ProductsView from "./ProductsView";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <AppShell pageTitle="Daftar Produk">
      <ProductsView
        initialProducts={products}
        initialCategories={categories}
      />
    </AppShell>
  );
}

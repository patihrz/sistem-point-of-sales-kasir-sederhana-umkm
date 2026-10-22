"use client";

import React, { useState, useTransition } from "react";
import {
  Package,
  Plus,
  Search,
  AlertCircle,
  Pencil,
  Trash2,
  FolderTree,
  X,
  CheckCircle2,
  Barcode,
  Layers,
  ArrowUpDown,
  TrendingUp,
  Tag,
  Boxes
} from "lucide-react";
import {
  ProductDTO,
  CategoryDTO,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getCategories,
  ProductInput,
} from "@/app/actions/products";

interface ProductsViewProps {
  initialProducts: ProductDTO[];
  initialCategories: CategoryDTO[];
}

export default function ProductsView({
  initialProducts,
  initialCategories,
}: ProductsViewProps) {
  const [products, setProducts] = useState<ProductDTO[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryDTO[]>(initialCategories);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [stockFilter, setStockFilter] = useState<"all" | "available" | "low" | "out">("all");

  // Modal State Produk (Tambah / Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);

  // Form State Produk
  const [formName, setFormName] = useState<string>("");
  const [formSku, setFormSku] = useState<string>("");
  const [formBarcode, setFormBarcode] = useState<string>("");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formUnit, setFormUnit] = useState<string>("pcs");
  const [formCategoryId, setFormCategoryId] = useState<string>("");

  // Modal State Hapus Produk
  const [deletingProduct, setDeletingProduct] = useState<ProductDTO | null>(null);

  // Modal State Kelola Kategori
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState<string>("");

  // Notification / Feedback Toast
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showFeedback = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const refreshData = async () => {
    try {
      const [prods, cats] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filter List Produk
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q));

    const matchCategory =
      selectedCategory === "Semua" ||
      p.category === selectedCategory ||
      p.categoryId === selectedCategory;

    let matchStock = true;
    if (stockFilter === "available") matchStock = p.stock > 5;
    if (stockFilter === "low") matchStock = p.stock > 0 && p.stock <= 5;
    if (stockFilter === "out") matchStock = p.stock <= 0;

    return matchSearch && matchCategory && matchStock;
  });

  // Buka Modal Tambah Produk
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSku(`PRD-${Date.now().toString().slice(-5)}`);
    setFormBarcode("");
    setFormPrice(0);
    setFormCostPrice(0);
    setFormStock(10);
    setFormUnit("pcs");
    setFormCategoryId(categories[0]?.id || "");
    setIsProductModalOpen(true);
  };

  // Buka Modal Edit Produk
  const handleOpenEditModal = (p: ProductDTO) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode || "");
    setFormPrice(p.price);
    setFormCostPrice(p.costPrice);
    setFormStock(p.stock);
    setFormUnit(p.unit);
    setFormCategoryId(p.categoryId || "");
    setIsProductModalOpen(true);
  };

  // Simpan Produk (Tambah atau Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showFeedback("Nama produk tidak boleh kosong.", "error");
      return;
    }

    if (formPrice < 0) {
      showFeedback("Harga jual tidak boleh kurang dari 0.", "error");
      return;
    }

    const payload: ProductInput = {
      name: formName.trim(),
      sku: formSku.trim(),
      barcode: formBarcode.trim() || null,
      price: formPrice,
      costPrice: formCostPrice,
      stock: formStock,
      unit: formUnit.trim() || "pcs",
      categoryId: formCategoryId || null,
    };

    startTransition(async () => {
      if (editingProduct) {
        const res = await updateProduct(editingProduct.id, payload);
        if (res.success) {
          showFeedback(`Produk "${formName}" berhasil diperbarui.`);
          setIsProductModalOpen(false);
          await refreshData();
        } else {
          showFeedback(res.message || "Gagal memperbarui produk.", "error");
        }
      } else {
        const res = await createProduct(payload);
        if (res.success) {
          showFeedback(`Produk "${formName}" berhasil ditambahkan.`);
          setIsProductModalOpen(false);
          await refreshData();
        } else {
          showFeedback(res.message || "Gagal menambahkan produk.", "error");
        }
      }
    });
  };

  // Eksekusi Hapus Produk
  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    startTransition(async () => {
      const res = await deleteProduct(deletingProduct.id);
      if (res.success) {
        showFeedback(`Produk "${deletingProduct.name}" berhasil dihapus.`);
        setDeletingProduct(null);
        await refreshData();
      } else {
        showFeedback(res.message || "Gagal menghapus produk.", "error");
      }
    });
  };

  // --- KELOLA KATEGORI ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    startTransition(async () => {
      const res = await createCategory(newCatName.trim());
      if (res.success) {
        showFeedback(`Kategori "${newCatName}" berhasil dibuat.`);
        setNewCatName("");
        await refreshData();
      } else {
        showFeedback(res.message || "Gagal membuat kategori.", "error");
      }
    });
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCatName.trim()) return;
    startTransition(async () => {
      const res = await updateCategory(id, editCatName.trim());
      if (res.success) {
        showFeedback("Nama kategori berhasil diperbarui.");
        setEditingCatId(null);
        setEditCatName("");
        await refreshData();
      } else {
        showFeedback(res.message || "Gagal mengedit kategori.", "error");
      }
    });
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Produk dalam kategori ini akan otomatis dialihkan ke kategori Umum.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteCategory(id);
      if (res.success) {
        showFeedback(`Kategori "${name}" berhasil dihapus.`);
        await refreshData();
      } else {
        showFeedback(res.message || "Gagal menghapus kategori.", "error");
      }
    });
  };

  // Hitung live profit margin form
  const formMargin = formPrice - formCostPrice;
  const formMarginPercent = formPrice > 0 ? Math.round((formMargin / formPrice) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in slide-in-from-top-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-0.5 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Controls & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Katalog Produk & Kategori</h2>
          <p className="text-xs text-slate-500">
            {products.length} produk terdaftar &bull; {categories.length} kategori usaha
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Kelola Kategori */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderTree className="w-4 h-4 text-slate-600" />
            <span>Kelola Kategori</span>
          </button>

          {/* Tombol Tambah Produk */}
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>TAMBAH PRODUK BARU</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama produk, SKU, atau scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-medium"
            />
          </div>

          {/* Stock Filter Selector */}
          <div className="flex items-center gap-1">
            {[
              { id: "all", label: "Semua Stok" },
              { id: "available", label: "Tersedia" },
              { id: "low", label: "Menipis" },
              { id: "out", label: "Habis" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStockFilter(f.id as any)}
                className={`px-2.5 py-1.5 text-xs rounded-md font-semibold transition-colors cursor-pointer ${
                  stockFilter === f.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          <button
            onClick={() => setSelectedCategory("Semua")}
            className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === "Semua"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.name
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Data Produk */}
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
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mb-2 mx-auto text-slate-300 stroke-1" />
                    <p className="font-semibold text-slate-700">Tidak ada produk ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Klik tombol "Tambah Produk Baru" untuk mendaftarkan barang dagangan tokomu.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const margin = p.price - p.costPrice;
                  const marginPercent = p.price > 0 ? Math.round((margin / p.price) * 100) : 0;
                  const isLowStock = p.stock <= 5 && p.stock > 0;
                  const isOutOfStock = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        <div>{p.sku}</div>
                        {p.barcode && (
                          <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                            <Barcode className="w-3 h-3" /> {p.barcode}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
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
                        <span className="text-[10px] text-emerald-600 font-bold">({marginPercent}%)</span>
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
                          {isOutOfStock ? "Habis" : isLowStock ? "Menipis" : "Tersedia"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Produk"
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            title="Hapus Produk"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TAMBAH / EDIT PRODUK */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    {editingProduct ? "Edit Data Produk" : "Tambah Produk Baru"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingProduct ? "Perbarui informasi dan harga produk" : "Isi rincian produk yang akan dijual"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Nama Produk */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Produk <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kemeja Linen Putih, Nasi Goreng, Buku Tulis, Jasa Cuci..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Kategori & SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kategori Usaha
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  >
                    <option value="">Pilih Kategori...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    SKU / Kode Barang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: KOP-001"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Barcode Scanner Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kode Barcode (Opsional / Bisa Di-scan)
                </label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Scan atau ketik nomor barcode (misal: 89912345678)"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Harga Jual & Harga Modal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Harga Modal / HPP (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formCostPrice || ""}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Harga Jual (Rp) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formPrice || ""}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Margin Card */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-lg flex items-center justify-between text-xs">
                <span className="text-emerald-950 font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  Estimasi Margin Laba:
                </span>
                <span className="font-bold text-emerald-800 font-mono">
                  {formatRupiah(formMargin)} ({formMarginPercent}%)
                </span>
              </div>

              {/* Stok & Satuan Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Satuan Unit
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="pcs, botol, porsi..."
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : editingProduct ? "Simpan Perubahan" : "Tambahkan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI HAPUS PRODUK */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-rose-950 uppercase">Hapus Produk</h3>
                <p className="text-[11px] text-rose-800">Konfirmasi penghapusan produk</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Yakin ingin menghapus produk <strong className="text-slate-900 font-bold">"{deletingProduct.name}"</strong>?
              </p>
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Riwayat transaksi masa lalu yang pernah mencatat produk ini tetap tersimpan dengan aman untuk pembukuan tokomu.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingProduct(null)}
                  className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmDeleteProduct}
                  className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: KELOLA KATEGORI USAHA (Bisa kuliner, retail, fashion, jasa, dll) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase">Kelola Kategori Usaha</h3>
                  <p className="text-[11px] text-slate-500">
                    Bebas atur kategori toko (kuliner, retail, fashion, jasa, atk, dll)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Tambah Kategori Baru */}
            <form onSubmit={handleCreateCategory} className="p-4 border-b border-slate-200 bg-slate-50/60 flex gap-2">
              <input
                type="text"
                placeholder="Tambah kategori baru (contoh: Fashion, Jasa, ATK)..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newCatName.trim() || isPending}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                + Tambah
              </button>
            </form>

            {/* List Kategori */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Daftar Kategori Saat Ini ({categories.length})
              </p>

              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between gap-2"
                >
                  {editingCatId === c.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        autoFocus
                        className="flex-1 px-2.5 py-1 bg-white border border-emerald-500 rounded text-xs font-medium focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdateCategory(c.id)}
                        disabled={isPending}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setEditingCatId(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-900">{c.name}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                          {c.productCount ?? 0} produk
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCatId(c.id);
                            setEditCatName(c.name);
                          }}
                          title="Ganti nama kategori"
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          title="Hapus kategori"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

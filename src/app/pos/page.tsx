"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Receipt,
  UserCheck,
  AlertCircle,
  LayoutDashboard,
  RefreshCw,
  LogOut,
  Building2,
  PauseCircle,
  FolderArchive,
  X,
  Clock,
  Tag,
  Barcode
} from "lucide-react";
import { getProducts, getCategories, ProductDTO } from "@/app/actions/products";
import { processCheckout, CheckoutResponse } from "@/app/actions/checkout";
import { getStoreSetting, StoreSettingDTO } from "@/app/actions/settings";
import { SessionUser, DEMO_ACCOUNTS } from "@/lib/auth";

interface CartItem extends ProductDTO {
  quantity: number;
}

interface HeldTransaction {
  id: string;
  label: string;
  createdAt: string;
  cart: CartItem[];
  discountPercent: number;
  paymentMethod: "TUNAI" | "QRIS" | "DEBIT" | "TRANSFER";
  cashGiven: number;
  totalAmount: number;
}

export default function PosPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [storeSetting, setStoreSetting] = useState<StoreSettingDTO>({
    id: "default",
    storeName: "KasirKITA",
    address: "Jl. Gatot Subroto No. 42, Jakarta",
    phoneNumber: "0812-3456-7890",
    logoUrl: "",
    receiptFooter: "Terima kasih atas kunjungan Anda!",
  });
  const [paymentMethod, setPaymentMethod] = useState<"TUNAI" | "QRIS" | "DEBIT" | "TRANSFER">("TUNAI");
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<SessionUser>(DEMO_ACCOUNTS[1] || DEMO_ACCOUNTS[0]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [completedTransaction, setCompletedTransaction] = useState<CheckoutResponse["transaction"] | null>(null);

  // Fitur Hold & Recall
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState<boolean>(false);
  const [holdLabel, setHoldLabel] = useState<string>("");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch data dari database (Produk & Kategori Dinamis)
  const loadCatalog = async () => {
    try {
      const [data, cats] = await Promise.all([getProducts(), getCategories()]);
      setProducts(data);

      const uniqueCats = [
        "Semua",
        ...Array.from(new Set([...cats.map((c) => c.name), ...data.map((p) => p.category)])),
      ];
      setCategories(uniqueCats);
    } catch (e) {
      console.error("Gagal memuat katalog:", e);
    }
  };

  // Muat daftar transaksi tertahan dari localStorage
  const loadHeldTransactions = () => {
    try {
      const saved = localStorage.getItem("kasir_held_transactions");
      if (saved) {
        setHeldTransactions(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Gagal membaca draft transaksi:", e);
    }
  };

  useEffect(() => {
    loadCatalog();
    loadHeldTransactions();
    getStoreSetting().then(setStoreSetting).catch(console.error);

    // Baca session user login
    const saved = localStorage.getItem("kasir_session");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    // Auto-focus search input saat pertama kali halaman dimuat
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === "Semua" || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);

  // Pajak Resto 10%
  const taxAmount = useMemo(() => {
    const afterDiscount = subtotal - discountAmount;
    return Math.round(afterDiscount * 0.1);
  }, [subtotal, discountAmount]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== "TUNAI") return 0;
    return Math.max(0, cashGiven - finalTotal);
  }, [cashGiven, finalTotal, paymentMethod]);

  const isPaymentValid = useMemo(() => {
    if (cart.length === 0) return false;
    if (paymentMethod === "TUNAI") {
      return cashGiven >= finalTotal;
    }
    return true; // Non-tunai langsung valid
  }, [cart, paymentMethod, cashGiven, finalTotal]);

  // Add to cart
  const addToCart = (product: ProductDTO) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven(0);
    setDiscountPercent(0);
    setErrorMessage("");
  };

  // Checkout Handler
  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;

    // Jika tunai tapi belum diinput, otomatis pasang uang pas
    let currentCash = cashGiven;
    if (paymentMethod === "TUNAI" && cashGiven < finalTotal) {
      currentCash = finalTotal;
      setCashGiven(finalTotal);
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await processCheckout({
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
        paymentMethod,
        paidAmount: paymentMethod === "TUNAI" ? currentCash : finalTotal,
        discountPercent,
        userId: currentUser.id,
      });

      if (!res.success || !res.transaction) {
        setErrorMessage(res.message || "Gagal memproses transaksi.");
        setIsSubmitting(false);
        return;
      }

      setCompletedTransaction(res.transaction);
      setIsReceiptModalOpen(true);
      clearCart();

      // Refresh data stok terbaru
      await loadCatalog();
    } catch (err: any) {
      setErrorMessage(err?.message || "Terjadi kendala saat menghubungkan ke database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard Shortcuts Handler (F2: Cari, F9: Bayar Cepat, Esc: Tutup / Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Fokus ke search bar & block text
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // F9: Buka bayar / Checkout
      if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0 && !isSubmitting) {
          handleCheckout();
        }
        return;
      }

      // Esc: Tutup modal atau konfirmasi reset keranjang
      if (e.key === "Escape") {
        e.preventDefault();
        if (isReceiptModalOpen) {
          setIsReceiptModalOpen(false);
          searchInputRef.current?.focus();
          return;
        }
        if (isHoldModalOpen) {
          setIsHoldModalOpen(false);
          searchInputRef.current?.focus();
          return;
        }
        if (isRecallModalOpen) {
          setIsRecallModalOpen(false);
          searchInputRef.current?.focus();
          return;
        }
        if (cart.length > 0) {
          if (confirm("Kosongkan keranjang belanja yang sedang aktif?")) {
            clearCart();
            searchInputRef.current?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cart,
    paymentMethod,
    cashGiven,
    finalTotal,
    isSubmitting,
    isReceiptModalOpen,
    isHoldModalOpen,
    isRecallModalOpen,
  ]);

  // Auto-scanner barcode support: Tekan enter pada search bar
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim().toLowerCase();
      if (!query) return;

      // Cari exact barcode atau SKU lebih dulu
      const exactMatch = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === query) ||
          p.sku.toLowerCase() === query
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery("");
        return;
      }

      // Jika hanya ada 1 produk di filter hasil pencarian
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery("");
      }
    }
  };

  // --- LOGIKA HOLD TRANSAKSI ---
  const handleOpenHoldModal = () => {
    if (cart.length === 0) {
      setErrorMessage("Keranjang masih kosong. Pilih produk terlebih dahulu sebelum menahan transaksi.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setHoldLabel("");
    setIsHoldModalOpen(true);
  };

  const handleConfirmHold = (customLabel?: string) => {
    const defaultLabel = `Pesanan #${heldTransactions.length + 1} (${new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })})`;
    const finalLabel = (customLabel || holdLabel).trim() || defaultLabel;

    const newHeld: HeldTransaction = {
      id: "held-" + Date.now(),
      label: finalLabel,
      createdAt: new Date().toISOString(),
      cart: [...cart],
      discountPercent,
      paymentMethod,
      cashGiven,
      totalAmount: finalTotal,
    };

    const updated = [newHeld, ...heldTransactions];
    setHeldTransactions(updated);
    localStorage.setItem("kasir_held_transactions", JSON.stringify(updated));

    clearCart();
    setIsHoldModalOpen(false);
    setHoldLabel("");
    searchInputRef.current?.focus();
  };

  // --- LOGIKA RECALL TRANSAKSI ---
  const handleRecallTransaction = (held: HeldTransaction) => {
    // Jika keranjang aktif ada isinya, tahan otomatis keranjang aktif
    if (cart.length > 0) {
      const autoSaveLabel = `Tahan Otomatis (${new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })})`;

      const autoHeld: HeldTransaction = {
        id: "held-" + Date.now(),
        label: autoSaveLabel,
        createdAt: new Date().toISOString(),
        cart: [...cart],
        discountPercent,
        paymentMethod,
        cashGiven,
        totalAmount: finalTotal,
      };

      const updatedHeld = [autoHeld, ...heldTransactions.filter((h) => h.id !== held.id)];
      setHeldTransactions(updatedHeld);
      localStorage.setItem("kasir_held_transactions", JSON.stringify(updatedHeld));
    } else {
      const updatedHeld = heldTransactions.filter((h) => h.id !== held.id);
      setHeldTransactions(updatedHeld);
      localStorage.setItem("kasir_held_transactions", JSON.stringify(updatedHeld));
    }

    // Pasang transaksi yang direcall ke keranjang
    setCart(held.cart);
    setDiscountPercent(held.discountPercent);
    setPaymentMethod(held.paymentMethod);
    setCashGiven(held.cashGiven);

    setIsRecallModalOpen(false);
    searchInputRef.current?.focus();
  };

  const handleDeleteHeld = (id: string) => {
    const updated = heldTransactions.filter((h) => h.id !== id);
    setHeldTransactions(updated);
    localStorage.setItem("kasir_held_transactions", JSON.stringify(updated));
  };

  const handleLogout = async () => {
    localStorage.removeItem("kasir_session");
    try {
      const { logoutUser } = await import("@/app/actions/auth");
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/login";
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 text-slate-800 antialiased overflow-hidden font-sans">
      {/* Top Bar Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm tracking-wider">
            KK
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">KasirKITA POS</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Terminal Kasir &bull; {storeSetting.storeName}</p>
          </div>
        </div>

        {/* Shortcut Quick Hints di Header */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
          <span className="flex items-center gap-1 font-medium">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-700">F2</kbd>
            <span>Cari Produk</span>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="flex items-center gap-1 font-medium">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-700">F9</kbd>
            <span>Bayar Cepat</span>
          </span>
          <span className="text-slate-300">&bull;</span>
          <span className="flex items-center gap-1 font-medium">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono font-bold text-slate-700">Esc</kbd>
            <span>Batal / Tutup</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Tombol Daftar Transaksi Tertahan */}
          <button
            onClick={() => setIsRecallModalOpen(true)}
            title="Lihat Daftar Transaksi yang Sedang Ditahan"
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
              heldTransactions.length > 0
                ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5 text-amber-700" />
            <span>Tertahan</span>
            {heldTransactions.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-bold">
                {heldTransactions.length}
              </span>
            )}
          </button>

          {/* Tombol kembali ke Dashboard (jika OWNER atau ADMIN) */}
          {(currentUser?.role === "OWNER" || currentUser?.role === "ADMIN") && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Ke Dashboard</span>
            </Link>
          )}

          <button
            onClick={loadCatalog}
            title="Muat Ulang Katalog dari Database"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sinkron DB</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Kasir: <strong className="text-slate-900 font-semibold">{currentUser?.name || "Kasir"}</strong>
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Keluar / Ganti Akun"
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden print:hidden">
        {/* Left Section: Catalog & Filter */}
        <section className="flex-1 flex flex-col min-w-0 bg-slate-50 border-r border-slate-200">
          {/* Search & Categories Bar */}
          <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari nama produk, SKU, barcode scanner (Tekan F2)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                F2
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <AlertCircle className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">Produk Tidak Ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">
                  Coba kata kunci lain atau scan barcode produk langsung.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const inCartItem = cart.find((i) => i.id === product.id);

                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className={`relative flex flex-col justify-between text-left p-3.5 rounded-lg border bg-white transition-all duration-150 cursor-pointer ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-100"
                          : inCartItem
                          ? "border-emerald-600 shadow-xs ring-1 ring-emerald-600/20"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-xs active:scale-[0.99]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            {product.sku}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              product.stock <= 5 && !isOutOfStock
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : isOutOfStock
                                ? "bg-rose-50 text-rose-800 border border-rose-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isOutOfStock ? "HABIS" : `${product.stock} ${product.unit}`}
                          </span>
                        </div>
                        <h3 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                          {product.name}
                        </h3>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700">
                          {formatRupiah(product.price)}
                        </span>
                        {inCartItem && (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                            {inCartItem.quantity}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Section: Struk / Cart & Payment */}
        <section className="w-96 xl:w-[420px] flex flex-col bg-white border-l border-slate-200 shrink-0">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-800" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Pesanan Aktif
              </h2>
              <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Tombol Tahan Transaksi */}
              {cart.length > 0 && (
                <button
                  onClick={handleOpenHoldModal}
                  title="Tahan transaksi ini untuk melayani pembeli lain"
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors cursor-pointer"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Tahan</span>
                </button>
              )}

              {/* Tombol Reset Cart */}
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  title="Kosongkan keranjang (Esc)"
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {errorMessage && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Receipt className="w-10 h-10 mb-2 text-slate-300 stroke-1" />
                <p className="text-xs font-bold text-slate-700 uppercase">Keranjang Kosong</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                  Klik produk di sebelah kiri atau scan barcode barang untuk memulai penjualan.
                </p>
                {heldTransactions.length > 0 && (
                  <button
                    onClick={() => setIsRecallModalOpen(true)}
                    className="mt-3 text-xs font-semibold text-amber-700 hover:text-amber-800 underline flex items-center gap-1"
                  >
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>Ada {heldTransactions.length} transaksi tertahan</span>
                  </button>
                )}
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatRupiah(item.price)} &times; {item.quantity}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Hapus produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= item.stock}
                        className="w-5 h-5 flex items-center justify-center rounded text-slate-700 hover:bg-slate-100 disabled:opacity-30 font-bold cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing & Checkout Panel */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
            {/* Calculation Lines */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
              </div>

              {/* Diskon Selector */}
              <div className="flex items-center justify-between pt-1">
                <span>Diskon</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 10].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setDiscountPercent(rate)}
                      className={`px-1.5 py-0.5 text-[10px] rounded font-bold cursor-pointer ${
                        discountPercent === rate
                          ? "bg-slate-800 text-white"
                          : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                  {discountPercent > 0 && (
                    <span className="font-bold text-rose-600 ml-1">
                      -{formatRupiah(discountAmount)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <span>Pajak Resto (10%)</span>
                <span className="font-semibold text-slate-800">{formatRupiah(taxAmount)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Total Tagihan
                </span>
                <span className="text-xl font-bold text-emerald-700">{formatRupiah(finalTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "TUNAI", label: "Tunai", icon: Banknote },
                  { id: "QRIS", label: "QRIS", icon: QrCode },
                  { id: "DEBIT", label: "Debit", icon: CreditCard },
                  { id: "TRANSFER", label: "Transfer", icon: Building2 },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id as any)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border text-center transition-all cursor-pointer ${
                      paymentMethod === id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mb-1" />
                    <span className="text-[10px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Input & Quick Cash Buttons */}
            {paymentMethod === "TUNAI" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Uang Diterima:</span>
                  <input
                    type="number"
                    value={cashGiven || ""}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    placeholder="0"
                    className="w-32 text-right px-2.5 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCashGiven(finalTotal)}
                    className="flex-1 py-1 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setCashGiven(amt)}
                      className="flex-1 py-1 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold cursor-pointer"
                    >
                      {amt / 1000}k
                    </button>
                  ))}
                </div>

                {cashGiven > 0 && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200">
                    <span className="font-semibold text-slate-600">Kembalian:</span>
                    <span
                      className={`font-mono font-bold ${
                        cashGiven < finalTotal ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {cashGiven < finalTotal
                        ? `Kurang ${formatRupiah(finalTotal - cashGiven)}`
                        : formatRupiah(changeAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Main Action Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
              className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all ${
                cart.length > 0 && !isSubmitting
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer active:scale-[0.99]"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>{isSubmitting ? "MEMPROSES TRANSAKSI..." : "PROSES BAYAR"}</span>
              <kbd className="px-1.5 py-0.5 bg-emerald-800/60 text-white rounded text-[10px] font-mono font-bold">
                F9
              </kbd>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </section>
      </div>

      {/* MODAL 1: TAHAN TRANSAKSI */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-amber-950 uppercase">Tahan Transaksi</h3>
                  <p className="text-[11px] text-amber-800">Pause keranjang untuk melayani pembeli lain</p>
                </div>
              </div>
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="text-amber-800 hover:text-amber-950 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama / Label Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Meja 3, Mas Kemeja Kotak, Bu Ani..."
                  value={holdLabel}
                  onChange={(e) => setHoldLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmHold();
                  }}
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Quick suggestion chips */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Pilihan Cepat:</span>
                <div className="flex flex-wrap gap-1">
                  {["Meja 1", "Meja 2", "Meja 3", "Bungkus / Take Away", "Pelanggan Antre"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleConfirmHold(chip)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
                <span>Total Belanja:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatRupiah(finalTotal)} ({cart.reduce((s, i) => s + i.quantity, 0)} item)
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHoldModalOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmHold()}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Simpan & Kosongkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DAFTAR TRANSAKSI TERTAHAN (RECALL) */}
      {isRecallModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase">Daftar Transaksi Tertahan</h3>
                  <p className="text-[11px] text-slate-500">Pilih transaksi untuk dimuat kembali ke kasir</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecallModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {heldTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <PauseCircle className="w-10 h-10 mb-2 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-bold text-slate-700 uppercase">Tidak Ada Transaksi Tertahan</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Gunakan tombol "Tahan" di keranjang belanja saat pembeli ingin menambah pesanan atau mengambil barang lain.
                  </p>
                </div>
              ) : (
                heldTransactions.map((held) => (
                  <div
                    key={held.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 transition-all shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{held.label}</span>
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                            {held.cart.reduce((s, i) => s + i.quantity, 0)} item
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            Ditahan {new Date(held.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} &bull; {new Date(held.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </p>
                      </div>

                      <span className="text-sm font-bold text-emerald-700 font-mono">
                        {formatRupiah(held.totalAmount)}
                      </span>
                    </div>

                    {/* Ringkasan item kecil */}
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-wrap gap-1.5">
                      {held.cart.map((i, idx) => (
                        <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                          {i.name} &times; {i.quantity}
                        </span>
                      ))}
                    </div>

                    {/* Tombol Tindakan */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => handleDeleteHeld(held.id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Draft</span>
                      </button>

                      <button
                        onClick={() => handleRecallTransaction(held)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Lanjutkan (Recall)</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsRecallModalOpen(false)}
                className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CETAK STRUK THERMAL 58mm / 80mm */}
      {isReceiptModalOpen && completedTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:m-0 print:p-0">
            {/* Modal Header */}
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 uppercase">Transaksi Berhasil</h3>
                  <p className="text-[11px] text-emerald-700 font-mono">{completedTransaction.invoiceNumber}</p>
                </div>
              </div>
            </div>

            {/* Thermal Receipt Paper (58mm/80mm Compatible Print Area) */}
            <div id="receipt-paper" className="p-5 font-mono text-xs text-slate-900 space-y-3 bg-white print:p-0 print:text-black">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <p className="font-bold text-sm tracking-tight uppercase text-slate-950">
                  {storeSetting.storeName}
                </p>
                {storeSetting.address && (
                  <p className="text-[10px] text-slate-600 leading-tight whitespace-pre-line">
                    {storeSetting.address}
                  </p>
                )}
                {storeSetting.phoneNumber && (
                  <p className="text-[10px] text-slate-600 font-semibold">
                    Telp/WA: {storeSetting.phoneNumber}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(completedTransaction.createdAt).toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] text-slate-600 font-semibold">{completedTransaction.invoiceNumber}</p>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
                {completedTransaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div>
                      <p className="font-semibold text-slate-800 leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {item.quantity} &times; {formatRupiah(item.price)}
                      </p>
                    </div>
                    <span className="font-bold">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupiah(completedTransaction.totalAmount)}</span>
                </div>
                {completedTransaction.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Diskon</span>
                    <span>-{formatRupiah(completedTransaction.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pajak (10%)</span>
                  <span>{formatRupiah(completedTransaction.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                  <span>TOTAL</span>
                  <span>{formatRupiah(completedTransaction.finalAmount)}</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-bold">{completedTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar:</span>
                  <span>{formatRupiah(completedTransaction.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-800">
                  <span>Kembalian:</span>
                  <span>{formatRupiah(completedTransaction.changeAmount)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-200">
                {storeSetting.receiptFooter || "Terima kasih atas kunjungan Anda!"}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk
              </button>
              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  searchInputRef.current?.focus();
                }}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

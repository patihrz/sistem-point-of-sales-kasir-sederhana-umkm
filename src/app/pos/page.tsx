"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Barcode,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  HelpCircle,
  LayoutGrid,
  List,
  Percent,
  Check,
  Share2,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { getProducts, getCategories, ProductDTO } from "@/app/actions/products";
import { processCheckout, CheckoutResponse } from "@/app/actions/checkout";
import { getStoreSetting, StoreSettingDTO } from "@/app/actions/settings";
import { SessionUser, DEMO_ACCOUNTS } from "@/lib/auth";

interface CartItem extends ProductDTO {
  quantity: number;
  itemNote?: string;
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Cart & Order State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerOrderNote, setCustomerOrderNote] = useState<string>("Pelanggan Umum");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountRp, setCustomDiscountRp] = useState<number>(0);
  const [enableTax, setEnableTax] = useState<boolean>(true); // Pajak 10% toggle

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

  // Live Digital Clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  // Fitur Hold & Recall
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState<boolean>(false);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [holdLabel, setHoldLabel] = useState<string>("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  // Synthesized Web Audio Beep (Ringan, bebas file eksternal)
  const playBeepSound = (freq = 900, duration = 0.07) => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

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

  // Jam Realtime
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }) + " • " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Jumlah produk per kategori untuk badge informatif
  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = { Semua: products.length };
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [products]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (customDiscountRp > 0) return Math.min(subtotal, customDiscountRp);
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent, customDiscountRp]);

  // Pajak Resto / PB1 10%
  const taxAmount = useMemo(() => {
    if (!enableTax) return 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    return Math.round(afterDiscount * 0.1);
  }, [subtotal, discountAmount, enableTax]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  const changeAmount = useMemo(() => {
    return Math.max(0, cashGiven - finalTotal);
  }, [cashGiven, finalTotal]);

  const isPaymentValid = useMemo(() => {
    if (cart.length === 0) return false;
    if (!paymentMethod) return false;
    if (!cashGiven || cashGiven <= 0) return false;
    return cashGiven >= finalTotal;
  }, [cart, paymentMethod, cashGiven, finalTotal]);

  // Add to cart with audio beep
  const addToCart = (product: ProductDTO) => {
    if (product.stock <= 0) return;
    playBeepSound(980, 0.06);

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
    playBeepSound(820, 0.05);
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

  const updateItemNote = (id: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, itemNote: note } : item))
    );
  };

  const removeFromCart = (id: string) => {
    playBeepSound(520, 0.08);
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven(0);
    setDiscountPercent(0);
    setCustomDiscountRp(0);
    setCustomerOrderNote("Pelanggan Umum");
    setErrorMessage("");
  };

  // Checkout Handler: Wajib Memasukkan Jenis Pembayaran dan Nominal Uang Diterima
  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;

    if (!paymentMethod) {
      setErrorMessage("Pilih salah satu metode pembayaran (Tunai, QRIS, Debit, atau Transfer).");
      return;
    }

    if (!cashGiven || cashGiven <= 0) {
      setErrorMessage("Wajib mengisi nominal uang yang diterima dari pembeli.");
      cashInputRef.current?.focus();
      return;
    }

    if (cashGiven < finalTotal) {
      setErrorMessage(`Uang pembayaran kurang ${formatRupiah(finalTotal - cashGiven)}.`);
      cashInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await processCheckout({
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity })),
        paymentMethod,
        paidAmount: cashGiven,
        discountPercent,
        notes: customerOrderNote,
        userId: currentUser.id,
      });

      if (!res.success || !res.transaction) {
        setErrorMessage(res.message || "Gagal memproses transaksi.");
        setIsSubmitting(false);
        return;
      }

      playBeepSound(1200, 0.15); // Sukses bayar sound
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

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Jangan trigger shortcut jika kasir sedang mengetik di input teks biasa
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused = activeTag === "input" || activeTag === "textarea";

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
        if (cart.length === 0) return;

        // Jika uang belum diisi, otomatis pasang uang pas dan fokus
        if (!cashGiven || cashGiven < finalTotal) {
          setCashGiven(finalTotal);
          cashInputRef.current?.focus();
          return;
        }

        if (isPaymentValid && !isSubmitting) {
          handleCheckout();
        }
        return;
      }

      // Space: Jika di luar input, isi uang pas
      if (e.code === "Space" && !isInputFocused && cart.length > 0) {
        e.preventDefault();
        setCashGiven(finalTotal);
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
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
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
    isPaymentValid,
    isReceiptModalOpen,
    isHoldModalOpen,
    isRecallModalOpen,
    isShortcutsModalOpen,
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
    setHoldLabel(customerOrderNote !== "Pelanggan Umum" ? customerOrderNote : "");
    setIsHoldModalOpen(true);
  };

  const handleConfirmHold = (customLabel?: string) => {
    const defaultLabel = customerOrderNote !== "Pelanggan Umum"
      ? customerOrderNote
      : `Pesanan #${heldTransactions.length + 1} (${new Date().toLocaleTimeString("id-ID", {
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
    setCustomerOrderNote(held.label);
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
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

  // Generate WhatsApp Share Message
  const getWhatsAppShareUrl = () => {
    if (!completedTransaction) return "#";
    const storeHeader = `*${storeSetting.storeName.toUpperCase()}*\n${storeSetting.address || ""}\nTelp: ${storeSetting.phoneNumber || "-"}\n--------------------------------`;
    const invoiceInfo = `No: ${completedTransaction.invoiceNumber}\nTanggal: ${new Date(completedTransaction.createdAt).toLocaleString("id-ID")}\nKasir: ${currentUser?.name || "Kasir"}`;
    const itemsList = completedTransaction.items
      .map((i) => `${i.name} x${i.quantity} = Rp ${i.subtotal.toLocaleString("id-ID")}`)
      .join("\n");
    const summary = `--------------------------------\nTotal: Rp ${completedTransaction.finalAmount.toLocaleString("id-ID")}\nMetode: ${completedTransaction.paymentMethod}\nBayar: Rp ${completedTransaction.paidAmount.toLocaleString("id-ID")}\nKembali: Rp ${completedTransaction.changeAmount.toLocaleString("id-ID")}\n--------------------------------\n${storeSetting.receiptFooter || "Terima kasih!"}`;
    const fullText = `${storeHeader}\n${invoiceInfo}\n--------------------------------\n${itemsList}\n${summary}`;
    return `https://wa.me/?text=${encodeURIComponent(fullText)}`;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-800 antialiased overflow-hidden font-sans select-none">
      {/* Top Header Bar: Rich, Real-time & Informative */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 print:hidden text-white">
        {/* Left: Brand & Store Identity */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-700">
            <Image
              src="/KasirKITA.png"
              alt="KasirKITA"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight text-white leading-none">
                {storeSetting.storeName}
              </h1>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Kasir Aktif</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1.5">
              <span>{currentTimeStr || "Memuat waktu..."}</span>
            </p>
          </div>
        </div>

        {/* Center: Live Terminal Shortcuts Pill */}
        <div className="hidden xl:flex items-center gap-3 text-xs bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full text-slate-300 shadow-inner">
          <span className="flex items-center gap-1.5 font-medium">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono font-bold text-amber-400">F2</kbd>
            <span className="text-[11px]">Cari / Scan</span>
          </span>
          <span className="text-slate-700">&bull;</span>
          <span className="flex items-center gap-1.5 font-medium">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono font-bold text-emerald-400">F9</kbd>
            <span className="text-[11px]">Bayar Cepat</span>
          </span>
          <span className="text-slate-700">&bull;</span>
          <span className="flex items-center gap-1.5 font-medium">
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono font-bold text-rose-400">Esc</kbd>
            <span className="text-[11px]">Reset / Tutup</span>
          </span>
        </div>

        {/* Right Controls: Actions & Cashier Profile */}
        <div className="flex items-center gap-2">
          {/* Tombol Draft Tertahan */}
          <button
            onClick={() => setIsRecallModalOpen(true)}
            title="Daftar Transaksi Tertahan"
            className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              heldTransactions.length > 0
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30 shadow-xs ring-1 ring-amber-500/30"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tertahan</span>
            {heldTransactions.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                {heldTransactions.length}
              </span>
            )}
          </button>

          {/* Audio Beep Feedback Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Suara Beep Kasir Aktif" : "Suara Beep Kasir Dimatikan"}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              soundEnabled
                ? "bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800"
                : "bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Kiosk)"}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden md:flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Panduan Shortcut Modal */}
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            title="Bantuan & Tombol Cepat"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Tombol kembali ke Dashboard */}
          {(currentUser?.role === "OWNER" || currentUser?.role === "ADMIN") && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
          )}

          {/* Kasir Profile Pill */}
          <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white font-bold text-[11px]">
              {currentUser?.name?.charAt(0).toUpperCase() || "K"}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="text-white font-bold block text-[11px] truncate max-w-[100px]">
                {currentUser?.name || "Kasir"}
              </span>
              <span className="text-[10px] text-slate-400 block">{currentUser?.role || "KARYAWAN"}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Keluar / Ganti Akun"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden bg-slate-100 print:hidden">
        {/* Left Column: Catalog, Categories & Barcode Bar */}
        <section className="flex-1 flex flex-col min-w-0 bg-slate-50 border-r border-slate-200">
          {/* Top Search & Filter Control Center */}
          <div className="p-3.5 bg-white border-b border-slate-200 space-y-3 shrink-0 shadow-2xs">
            <div className="flex items-center gap-2">
              {/* Search Bar with Barcode Scanner Indicator */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Ketik nama, SKU, atau scan barcode barang langsung (Tekan F2)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium shadow-inner"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                    <Barcode className="w-3 h-3" />
                    <span>Auto-Scan</span>
                  </span>
                  <kbd className="hidden sm:inline-block text-[10px] font-mono font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                    F2
                  </kbd>
                </div>
              </div>

              {/* View Mode Toggle (Grid vs Compact List) */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Tampilan Grid Kartu"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="Tampilan List Padat"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === "list" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh DB button */}
              <button
                type="button"
                onClick={loadCatalog}
                title="Sinkronkan Ulang Katalog dari Database"
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Category Pills Bar with Count Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = categoryCountMap[cat] ?? 0;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-xs scale-102"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid / List Display */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <AlertCircle className="w-12 h-12 mb-3 stroke-1 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">Produk Tidak Ditemukan</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Tidak ada barang yang cocok dengan kata kunci "{searchQuery}" pada kategori {selectedCategory}.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("Semua");
                  }}
                  className="mt-3 text-xs text-emerald-600 font-bold hover:underline"
                >
                  Tampilkan Semua Produk
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock <= 5 && !isOutOfStock;
                  const inCartItem = cart.find((i) => i.id === product.id);

                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className={`group relative flex flex-col justify-between text-left p-3.5 rounded-xl border bg-white transition-all duration-150 cursor-pointer ${
                        isOutOfStock
                          ? "opacity-50 cursor-not-allowed border-slate-200 bg-slate-100/70"
                          : inCartItem
                          ? "border-emerald-600 shadow-sm ring-2 ring-emerald-600/30 bg-emerald-50/10"
                          : "border-slate-200 hover:border-emerald-400 hover:shadow-xs active:scale-[0.98]"
                      }`}
                    >
                      {/* Top Meta: SKU & Stock Badge */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tight truncate">
                            {product.sku}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isOutOfStock
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : isLowStock
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isOutOfStock ? "Habis" : `${product.stock} ${product.unit}`}
                          </span>
                        </div>

                        {/* Nama Produk */}
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                          {product.name}
                        </h3>

                        {/* Kategori Tag */}
                        <div className="mt-1">
                          <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            {product.category}
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Price & In-Cart Floating Counter */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono">
                            {formatRupiah(product.price)}
                          </span>
                        </div>

                        {inCartItem ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black shadow-xs flex items-center gap-1 animate-in zoom-in-75">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{inCartItem.quantity}</span>
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* COMPACT LIST VIEW (Untuk minimarket / kasir cepat) */
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const inCartItem = cart.find((i) => i.id === product.id);

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      className={`flex items-center justify-between p-3 transition-colors cursor-pointer ${
                        isOutOfStock
                          ? "opacity-40 cursor-not-allowed bg-slate-50"
                          : inCartItem
                          ? "bg-emerald-50/40 hover:bg-emerald-50/70"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 font-mono">
                          {product.sku.slice(-3)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-mono">{product.sku}</span>
                            <span>&bull;</span>
                            <span>{product.category}</span>
                            <span>&bull;</span>
                            <span className={product.stock <= 5 ? "text-amber-600 font-bold" : ""}>
                              Stok: {product.stock} {product.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono">
                          {formatRupiah(product.price)}
                        </span>
                        {inCartItem && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black">
                            {inCartItem.quantity} di keranjang
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Interactive Order Cart & Payment Breakdown */}
        <section className="w-96 xl:w-[440px] flex flex-col bg-white border-l border-slate-200 shrink-0 shadow-lg z-10">
          {/* Cart Header with Customer / Order Tag Info */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Keranjang Penjualan
                </h2>
                <span className="text-xs bg-emerald-600 text-white px-2 py-0.2 rounded-full font-black">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Tombol Tahan Transaksi */}
                {cart.length > 0 && (
                  <button
                    onClick={handleOpenHoldModal}
                    title="Tahan transaksi saat ini"
                    className="text-xs text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors cursor-pointer"
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
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Customer / Order Note Editable Bar */}
            <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
              <span className="text-[11px] text-slate-400 font-semibold uppercase shrink-0">Untuk:</span>
              <input
                type="text"
                value={customerOrderNote}
                onChange={(e) => setCustomerOrderNote(e.target.value)}
                placeholder="Contoh: Meja 3, Take Away, Pelanggan Umum..."
                className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none placeholder-slate-400"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
            {errorMessage && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Receipt className="w-8 h-8 text-slate-300 stroke-1" />
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Keranjang Masih Kosong
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                  Pilih produk dari katalog di sebelah kiri atau scan barcode untuk memulai transaksi.
                </p>
                {heldTransactions.length > 0 && (
                  <button
                    onClick={() => setIsRecallModalOpen(true)}
                    className="mt-4 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                  >
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>Muat {heldTransactions.length} Pesanan Tertahan</span>
                  </button>
                )}
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug truncate">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {formatRupiah(item.price)} &times; {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-black text-slate-900 font-mono shrink-0">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>

                  {/* Catatan Per Item Opsional (Misal: Tanpa Es, Ekstra Pedas) */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <input
                      type="text"
                      placeholder="Catatan pesanan item ini (opsional)..."
                      value={item.itemNote || ""}
                      onChange={(e) => updateItemNote(item.id, e.target.value)}
                      className="flex-1 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />

                    <div className="flex items-center gap-1.5">
                      {/* Tombol Hapus Item */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded"
                        title="Hapus produk dari keranjang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Stepper Quantity */}
                      <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-700 hover:bg-white font-bold cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-slate-900 w-6 text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          className="w-5 h-5 flex items-center justify-center rounded text-slate-700 hover:bg-white disabled:opacity-30 font-bold cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing, Discount, Payment & Checkout Panel */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
            {/* Rincian Perhitungan Tagihan */}
            <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex justify-between items-center">
                <span>Subtotal Barang</span>
                <span className="font-bold text-slate-800 font-mono">{formatRupiah(subtotal)}</span>
              </div>

              {/* Selector Diskon */}
              <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100">
                <div className="flex items-center gap-1 text-slate-700">
                  <Percent className="w-3 h-3 text-emerald-600" />
                  <span className="font-semibold text-[11px]">Diskon</span>
                </div>

                <div className="flex items-center gap-1">
                  {[0, 5, 10, 15, 20].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setDiscountPercent(rate);
                        setCustomDiscountRp(0);
                      }}
                      className={`px-1.5 py-0.5 text-[10px] rounded font-bold cursor-pointer transition-colors ${
                        discountPercent === rate && customDiscountRp === 0
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                  {discountAmount > 0 && (
                    <span className="font-bold text-rose-600 ml-1 font-mono">
                      -{formatRupiah(discountAmount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle Pajak PB1/PPN 10% */}
              <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100">
                <div className="flex items-center gap-1 text-slate-700">
                  <span className="text-[11px] font-semibold">Pajak Toko (10%)</span>
                  <button
                    type="button"
                    onClick={() => setEnableTax(!enableTax)}
                    className={`ml-1 text-[9px] font-bold px-1.5 py-0.2 rounded cursor-pointer ${
                      enableTax ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {enableTax ? "AKTIF" : "NONAKTIF"}
                  </button>
                </div>
                <span className="font-bold text-slate-800 font-mono">
                  {enableTax ? formatRupiah(taxAmount) : "Rp 0"}
                </span>
              </div>

              {/* Giant Grand Total */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide block">
                    TOTAL TAGIHAN
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cart.reduce((s, i) => s + i.quantity, 0)} item pesanan
                  </span>
                </div>
                <span className="text-2xl font-black text-emerald-700 font-mono">
                  {formatRupiah(finalTotal)}
                </span>
              </div>
            </div>

            {/* 1. Pilih Jenis Pembayaran (Wajib) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <span>1. Metode Pembayaran</span>
                  <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded">
                  {paymentMethod}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "TUNAI", label: "Tunai", icon: Banknote },
                  { id: "QRIS", label: "QRIS", icon: QrCode },
                  { id: "DEBIT", label: "Debit EDC", icon: CreditCard },
                  { id: "TRANSFER", label: "Transfer", icon: Building2 },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id as any)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      paymentMethod === id
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-black shadow-xs ring-2 ring-emerald-600/30"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1 text-emerald-700" />
                    <span className="text-[10px] leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Input Uang Diterima & Quick Chips (Wajib Untuk Semua Metode) */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                  <span>2. Uang Diterima dari Pembeli</span>
                  <span className="text-rose-600">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  Metode: <strong className="text-slate-800">{paymentMethod}</strong>
                </span>
              </div>

              <div className="flex items-center bg-white border-2 border-slate-300 rounded-xl px-3 py-1.5 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 shadow-2xs">
                <span className="text-slate-400 font-mono font-bold text-sm mr-2">Rp</span>
                <input
                  ref={cashInputRef}
                  type="number"
                  value={cashGiven || ""}
                  onChange={(e) => setCashGiven(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full text-right font-mono text-lg font-black text-slate-900 bg-transparent focus:outline-none"
                />
              </div>

              {/* Quick Numpad Helper Chips */}
              <div className="grid grid-cols-5 gap-1">
                <button
                  type="button"
                  onClick={() => setCashGiven(finalTotal)}
                  className="col-span-2 py-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black cursor-pointer transition-colors shadow-2xs flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Uang Pas</span>
                </button>
                {[20000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashGiven(amt >= finalTotal ? amt : finalTotal + amt)}
                    className="py-1.5 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold cursor-pointer transition-colors font-mono"
                  >
                    {amt / 1000}k
                  </button>
                ))}
              </div>

              {/* Status Kembalian / Status Pembayaran Realtime */}
              <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-600 text-[11px]">Kembalian:</span>
                {!cashGiven || cashGiven === 0 ? (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Ketik uang diterima
                  </span>
                ) : cashGiven < finalTotal ? (
                  <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Kurang {formatRupiah(finalTotal - cashGiven)}
                  </span>
                ) : (
                  <span className="font-mono font-black text-sm text-emerald-700">
                    {cashGiven === finalTotal
                      ? "Rp 0 (Uang Pas)"
                      : formatRupiah(changeAmount)}
                  </span>
                )}
              </div>
            </div>

            {/* Tombol Utama: Proses Bayar (F9) */}
            <button
              onClick={handleCheckout}
              disabled={!isPaymentValid || isSubmitting}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                isPaymentValid && !isSubmitting
                  ? "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] cursor-pointer"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
              }`}
            >
              <span>
                {isSubmitting
                  ? "MEMPROSES TRANSAKSI..."
                  : cart.length === 0
                  ? "KERANJANG KOSONG"
                  : !cashGiven || cashGiven === 0
                  ? "MASUKKAN NOMINAL UANG"
                  : cashGiven < finalTotal
                  ? `UANG KURANG (${formatRupiah(finalTotal - cashGiven)})`
                  : `PROSES BAYAR (${paymentMethod})`}
              </span>
              <kbd className="px-1.5 py-0.5 bg-black/25 text-white rounded text-[10px] font-mono font-bold">
                F9
              </kbd>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </section>
      </div>

      {/* MODAL 1: TAHAN TRANSAKSI (HOLD) */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

            <div className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pilihan Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["Meja 1", "Meja 2", "Meja 3", "Meja 4", "Bungkus / Take Away", "Pelanggan Antre"].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleConfirmHold(chip)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
                <span>Total Belanja:</span>
                <span className="font-black text-slate-900 font-mono">
                  {formatRupiah(finalTotal)} ({cart.reduce((s, i) => s + i.quantity, 0)} item)
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHoldModalOpen(false)}
                  className="flex-1 py-2 px-3 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmHold()}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
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
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
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

                      <span className="text-sm font-black text-emerald-700 font-mono">
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
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
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
                className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PANDUAN KEYBOARD SHORTCUT */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3 className="text-xs font-black uppercase tracking-wide">Panduan Tombol Cepat (Shortcuts)</h3>
              </div>
              <button onClick={() => setIsShortcutsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-medium text-slate-700">Fokus ke Pencarian / Scan Barcode</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-black text-slate-800">F2</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-medium text-slate-700">Proses Bayar Cepat</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-black text-slate-800">F9</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-medium text-slate-700">Tutup Pop-up / Batalkan Transaksi</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-black text-slate-800">Esc</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-medium text-slate-700">Otomatis Masukkan Uang Pas</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded font-mono font-black text-slate-800">Space</kbd>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-medium text-slate-700">Input Barcode Scanner</span>
                <span className="text-[11px] font-bold text-emerald-700">Otomatis Deteksi Enter</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="py-1.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CETAK STRUK THERMAL REALISTIK & SHARE WHATSAPP */}
      {isReceiptModalOpen && completedTransaction && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:m-0 print:p-0">
            {/* Modal Header */}
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide">Transaksi Selesai</h3>
                  <p className="text-[11px] text-emerald-100 font-mono">{completedTransaction.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  searchInputRef.current?.focus();
                }}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Receipt Paper (58mm/80mm Style) */}
            <div id="receipt-paper" className="p-6 font-mono text-xs text-slate-900 space-y-3 bg-white print:p-0 print:text-black">
              {/* Toko Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-3">
                <p className="font-black text-sm tracking-tight uppercase text-slate-950">
                  {storeSetting.storeName}
                </p>
                {storeSetting.address && (
                  <p className="text-[10px] text-slate-600 leading-tight whitespace-pre-line">
                    {storeSetting.address}
                  </p>
                )}
                {storeSetting.phoneNumber && (
                  <p className="text-[10px] text-slate-600 font-bold">
                    Telp/WA: {storeSetting.phoneNumber}
                  </p>
                )}
                <div className="pt-1.5 flex justify-between text-[10px] text-slate-500">
                  <span>{new Date(completedTransaction.createdAt).toLocaleDateString("id-ID")}</span>
                  <span>{new Date(completedTransaction.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-700 font-bold">
                  <span>No: {completedTransaction.invoiceNumber}</span>
                  <span>Kasir: {currentUser?.name || "Kasir"}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-3">
                {completedTransaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {item.quantity} &times; {formatRupiah(item.price)}
                      </p>
                    </div>
                    <span className="font-bold font-mono shrink-0">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Calculation Lines */}
              <div className="space-y-1 border-b border-dashed border-slate-400 pb-3 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatRupiah(completedTransaction.totalAmount)}</span>
                </div>
                {completedTransaction.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Diskon:</span>
                    <span className="font-mono">-{formatRupiah(completedTransaction.discount)}</span>
                  </div>
                )}
                {completedTransaction.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak Resto:</span>
                    <span className="font-mono">{formatRupiah(completedTransaction.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL TAGIHAN:</span>
                  <span className="font-mono text-sm">{formatRupiah(completedTransaction.finalAmount)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Jenis Pembayaran:</span>
                  <span className="font-bold">{completedTransaction.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nominal Diterima:</span>
                  <span className="font-bold font-mono">{formatRupiah(completedTransaction.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-black text-emerald-800 text-xs">
                  <span>Kembalian:</span>
                  <span className="font-mono">{formatRupiah(completedTransaction.changeAmount)}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-300 leading-tight">
                {storeSetting.receiptFooter || "Terima kasih atas kunjungan Anda!"}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2 print:hidden">
              <div className="flex gap-2">
                {/* Print Button */}
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Struk</span>
                </button>

                {/* WhatsApp Share Direct Button */}
                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </a>
              </div>

              <button
                onClick={() => {
                  setIsReceiptModalOpen(false);
                  searchInputRef.current?.focus();
                }}
                className="w-full py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Transaksi Baru (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Package,
  Receipt,
  LogOut,
  Users,
  Shield,
  Clock,
  Settings,
} from "lucide-react";
import { DEMO_ACCOUNTS, SessionUser } from "@/lib/auth";
import { getStoreSetting } from "@/app/actions/settings";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle: string;
}

export default function AppShell({ children, pageTitle }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser>(DEMO_ACCOUNTS[0]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [storeName, setStoreName] = useState<string>("Toko Saya");
  const [storeLogoUrl, setStoreLogoUrl] = useState<string>("");

  useEffect(() => {
    // Baca session
    const saved = localStorage.getItem("kasir_session");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    // Jam lokal
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "short",
          day: "numeric",
        }) + " • " + now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);

    // Ambil nama toko & logo dari DB
    getStoreSetting().then((s) => {
      setStoreName(s.storeName);
      setStoreLogoUrl(s.logoUrl || "");
    }).catch(() => {});

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("kasir_session");
    try {
      const { logoutUser } = await import("@/app/actions/auth");
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  const navLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["OWNER", "ADMIN"],
    },
    {
      label: "Kasir",
      href: "/pos",
      icon: Store,
      roles: ["OWNER", "ADMIN", "KARYAWAN"],
      badge: "F2",
    },
    {
      label: "Produk",
      href: "/products",
      icon: Package,
      roles: ["OWNER", "ADMIN"],
    },
    {
      label: "Riwayat Penjualan",
      href: "/transactions",
      icon: Receipt,
      roles: ["OWNER", "ADMIN"],
    },
    {
      label: "Pengaturan",
      href: "/settings",
      icon: Settings,
      roles: ["OWNER"],
    },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 antialiased overflow-hidden font-sans">
      {/* Sidebar Klasik di Kiri */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 select-none">
        {/* Platform Brand: KasirKITA */}
        <div className="px-4 pt-3 pb-3 border-b border-slate-800">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-xl px-3 py-1.5 inline-flex items-center">
              <Image
                src="/KasirKITA.png"
                alt="KasirKITA"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
              <span className="ml-2 font-black text-slate-900 text-sm tracking-tight">KasirKITA</span>
            </div>
          </div>
        </div>

        {/* Store Identity: Logo & Nama Toko */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3">
          {storeLogoUrl ? (
            <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-800">
              <Image
                src={storeLogoUrl}
                alt={storeName}
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <span className="font-bold text-sm tracking-tight text-white block truncate">{storeName}</span>
            <span className="text-[10px] text-slate-400 block leading-none">Toko kamu</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>

          {navLinks.map((item) => {
            const hasAccess = item.roles.includes(currentUser.role);
            if (!hasAccess) return null;

            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                      isActive ? "bg-emerald-700 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Role Panel di Bawah */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-medium text-slate-300">Masuk sebagai:</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                currentUser.role === "OWNER"
                  ? "bg-amber-900/60 text-amber-300 border border-amber-700/60"
                  : currentUser.role === "ADMIN"
                  ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/60"
                  : "bg-blue-900/60 text-blue-300 border border-blue-700/60"
              }`}
            >
              {currentUser.role === "OWNER" ? "Pemilik" : currentUser.role === "ADMIN" ? "Admin" : "Kasir"}
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <div className="truncate mr-2">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar Akun"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">{pageTitle}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{currentTime}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Store className="w-4 h-4" />
              <span>Buka Kasir</span>
            </Link>
          </div>
        </header>

        {/* Children Page Body */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, Store, Shield, ArrowRight, UserCheck, AlertCircle } from "lucide-react";
import { loginUser } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("owner@kasir.com");
  const [password, setPassword] = useState("owner123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (targetEmail = email, targetPass = password) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await loginUser(targetEmail, targetPass);

      if (!res.success || !res.user) {
        setError(res.message || "Email atau kata sandi tidak sesuai.");
        setIsLoading(false);
        return;
      }

      // Sinkronkan session ke localStorage agar UI kasir & sidebar langsung membaca data terverifikasi
      if (typeof window !== "undefined") {
        localStorage.setItem("kasir_session", JSON.stringify(res.user));
      }

      // Redirect ke rute berbasis role (KARYAWAN -> /pos, OWNER/ADMIN -> /dashboard)
      router.push(res.redirectTo || "/dashboard");
    } catch (err: any) {
      setError(err?.message || "Terjadi kendala saat menghubungi server database.");
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleSubmit(demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center items-center p-4 antialiased text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Header Brand KasirKITA (Platform) */}
        <div className="bg-slate-900 p-6 text-white text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-white rounded-2xl px-4 py-2 inline-flex items-center shadow-sm">
              <Image
                src="/KasirKITA.png"
                alt="KasirKITA"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-sm font-semibold tracking-wide text-slate-200">Aplikasi Kasir untuk Toko & Warung</h1>
          <p className="text-xs text-slate-400 mt-0.5">Masuk untuk mulai berjualan hari ini</p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login Manual */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@kasir.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span>{isLoading ? "Sedang masuk..." : "Masuk"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Tombol Akses Demo Cepat (1-Click Login) */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Coba dulu pakai akun demo
            </p>

            <div className="space-y-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemo("owner@kasir.com", "owner123")}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                    O
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Budi Gunawan (Owner)
                    </p>
                    <p className="text-[11px] text-slate-500">owner@kasir.com &bull; pass: owner123</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-700 uppercase tracking-wider">
                  Pemilik Toko
                </span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemo("kasir@kasir.com", "kasir123")}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
                    K
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Ahmad Kasir (Karyawan)
                    </p>
                    <p className="text-[11px] text-slate-500">kasir@kasir.com &bull; pass: kasir123</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-800 uppercase tracking-wider">
                  Kasir / Karyawan
                </span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3 leading-relaxed">
              Akun di atas bisa langsung dipakai untuk mencoba aplikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

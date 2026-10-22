"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { getStoreSetting, updateStoreSetting, StoreSettingDTO } from "@/app/actions/settings";
import {
  Store,
  MapPin,
  Phone,
  Receipt,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Printer,
  ImagePlus,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react";
import { SessionUser } from "@/lib/auth";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<StoreSettingDTO>({
    id: "default",
    storeName: "Toko Berkah UMKM",
    address: "Jl. Gatot Subroto No. 42, Jakarta",
    phoneNumber: "0812-3456-7890",
    logoUrl: "",
    receiptFooter: "Terima kasih atas kunjungan Anda!",
  });

  useEffect(() => {
    const saved = localStorage.getItem("kasir_session");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    const loadSettings = async () => {
      try {
        const data = await getStoreSetting();
        setFormData(data);
        setLogoPreview(data.logoUrl || "");
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi sisi client
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setStatusMessage({ type: "error", text: "Format tidak didukung. Gunakan PNG, JPG, atau WebP." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatusMessage({ type: "error", text: "Ukuran file terlalu besar. Maksimum 2 MB." });
      return;
    }

    // Preview lokal dulu
    const localUrl = URL.createObjectURL(file);
    setLogoPreview(localUrl);
    setIsUploadingLogo(true);
    setStatusMessage(null);

    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/upload-logo", { method: "POST", body: fd });
      const json = await res.json();

      if (json.success) {
        setFormData((prev) => ({ ...prev, logoUrl: json.logoUrl }));
        setLogoPreview(json.logoUrl);
        setStatusMessage({ type: "success", text: "Logo toko berhasil diupload!" });
      } else {
        setStatusMessage({ type: "error", text: json.message || "Gagal mengupload logo." });
        setLogoPreview(formData.logoUrl || "");
      }
    } catch {
      setStatusMessage({ type: "error", text: "Koneksi gagal saat mengupload logo." });
      setLogoPreview(formData.logoUrl || "");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoPreview("");
    setFormData((prev) => ({ ...prev, logoUrl: "" }));
    await updateStoreSetting({ ...formData, logoUrl: "" });
    setStatusMessage({ type: "success", text: "Logo toko berhasil dihapus." });
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await updateStoreSetting(formData);
      if (res.success && res.setting) {
        setFormData(res.setting);
        setStatusMessage({ type: "success", text: res.message });
      } else {
        setStatusMessage({ type: "error", text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Gagal menyimpan pengaturan." });
    } finally {
      setIsSaving(false);
    }
  };

  const isOwner = currentUser?.role === "OWNER";

  return (
    <AppShell pageTitle="Pengaturan Profil Toko & Struk">
      <div className="max-w-5xl mx-auto space-y-6">
        {!isOwner && !isLoading && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">Halaman ini khusus untuk pemilik toko</h3>
              <p className="text-xs text-amber-700 mt-1">
                Kamu masuk sebagai <strong>{currentUser?.name || "Pengguna"}</strong>. Hanya pemilik toko yang bisa mengubah profil dan pengaturan ini.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Form Pengaturan */}
          <div className="lg:col-span-7 space-y-5">
            {/* Card: Logo Toko */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-slate-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Logo Toko</h2>
                  <p className="text-xs text-slate-500">Tampil di sidebar, struk, dan header aplikasi.</p>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-5">
                  {/* Preview Logo */}
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {isUploadingLogo ? (
                      <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                    ) : logoPreview ? (
                      <Image src={logoPreview} alt="Logo Toko" fill className="object-contain p-1" unoptimized={logoPreview.startsWith("blob:")} />
                    ) : (
                      <Store className="w-8 h-8 text-slate-300" />
                    )}
                  </div>

                  {/* Upload Actions */}
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-slate-600 font-medium">
                      Format: PNG, JPG, atau WebP • Maks. 2 MB
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Logo ini akan muncul di sidebar dan di bagian atas struk belanja toko kamu.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        ref={logoInputRef}
                        id="logo-upload-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleLogoFileChange}
                        disabled={!isOwner || isUploadingLogo}
                      />
                      <label
                        htmlFor="logo-upload-input"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isOwner && !isUploadingLogo
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                            : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingLogo ? "Sedang upload..." : "Pilih Foto Logo"}
                      </label>
                      {logoPreview && isOwner && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          disabled={isUploadingLogo}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Identitas Toko */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-bold text-slate-900">Identitas Toko & Informasi Struk</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Informasi ini akan tercetak otomatis pada header & footer struk kasir.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {statusMessage && (
                  <div
                    className={`p-3 text-xs rounded-lg flex items-center gap-2 ${
                      statusMessage.type === "success"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border border-rose-200 text-rose-700"
                    }`}
                  >
                    {statusMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                {/* Nama Toko */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Toko / Usaha <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      disabled={!isOwner || isSaving}
                      value={formData.storeName}
                      onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                      placeholder="Contoh: Toko Berkah UMKM"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap Toko</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <textarea
                      rows={3}
                      disabled={!isOwner || isSaving}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Jl. Gatot Subroto No. 42, RT 01/RW 02, Jakarta Selatan"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Telepon */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={!isOwner || isSaving}
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="Contoh: 0812-3456-7890"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Receipt Footer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pesan Catatan Kaki Struk</label>
                  <div className="relative">
                    <Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={!isOwner || isSaving}
                      value={formData.receiptFooter}
                      onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                      placeholder="Contoh: Terima kasih atas kunjungan Anda!"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pesan ucapan penutup yang tercetak di bagian paling bawah struk.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={!isOwner || isSaving}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Kolom Kanan: Live Preview Struk */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase">Live Preview Struk Kasir</h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                58mm / 80mm
              </span>
            </div>

            <div className="p-6 bg-slate-100 flex items-center justify-center flex-1">
              <div className="w-full max-w-[280px] bg-white border border-slate-300 rounded shadow-sm p-4 font-mono text-[11px] text-slate-900 space-y-3">
                {/* Header Struk Dinamis */}
                <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-2.5">
                  {/* Logo Toko di Struk */}
                  {logoPreview && (
                    <div className="flex justify-center mb-2">
                      <div className="w-14 h-14 relative">
                        <Image
                          src={logoPreview}
                          alt="Logo"
                          fill
                          className="object-contain"
                          unoptimized={logoPreview.startsWith("blob:")}
                        />
                      </div>
                    </div>
                  )}
                  <p className="font-bold text-sm tracking-tight text-slate-950 uppercase leading-snug">
                    {formData.storeName || "NAMA TOKO"}
                  </p>
                  {formData.address && (
                    <p className="text-[10px] text-slate-600 leading-tight whitespace-pre-line">{formData.address}</p>
                  )}
                  {formData.phoneNumber && (
                    <p className="text-[10px] text-slate-600 font-semibold">Telp/WA: {formData.phoneNumber}</p>
                  )}
                  <p className="text-[9px] text-slate-400 mt-1">22/10/2026 18:05 • INV-20261022-0042</p>
                </div>

                {/* Items Dummy */}
                <div className="space-y-1 border-b border-dashed border-slate-300 pb-2 text-[10px]">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">Kopi Susu Gula Aren</p>
                      <p className="text-slate-400">2 &times; Rp 18.000</p>
                    </div>
                    <span className="font-bold">Rp 36.000</span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">Roti Bakar Keju</p>
                      <p className="text-slate-400">1 &times; Rp 20.000</p>
                    </div>
                    <span className="font-bold">Rp 20.000</span>
                  </div>
                </div>

                {/* Total */}
                <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rp 56.000</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                    <span>TOTAL</span>
                    <span>Rp 56.000</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-[10px] text-slate-600 pt-1 leading-snug space-y-1">
                  <p className="font-medium">{formData.receiptFooter || "Terima kasih atas kunjungan Anda!"}</p>
                  <p className="text-[9px] text-slate-400">Powered by KasirKITA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

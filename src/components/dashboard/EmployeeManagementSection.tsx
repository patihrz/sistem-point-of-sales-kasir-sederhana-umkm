"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Power,
  ShoppingBag,
} from "lucide-react";
import {
  EmployeeDTO,
  createEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
} from "@/app/actions/employees";

interface EmployeeManagementSectionProps {
  initialEmployees: EmployeeDTO[];
}

export default function EmployeeManagementSection({
  initialEmployees,
}: EmployeeManagementSectionProps) {
  const [employees, setEmployees] = useState<EmployeeDTO[]>(initialEmployees);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "KARYAWAN" as "KARYAWAN" | "ADMIN",
  });
  const [formError, setFormError] = useState<string>("");

  const handleOpenModal = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "KARYAWAN",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setFormError("");
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await createEmployee(formData);
      if (res.success && res.employee) {
        setEmployees((prev) => [...prev, res.employee!]);
        setIsModalOpen(false);
        setNotification({
          type: "success",
          message: res.message,
        });
        setTimeout(() => setNotification(null), 5000);
      } else {
        setFormError(res.message);
      }
    } catch (err: any) {
      setFormError(err?.message || "Terjadi kesalahan saat menambahkan kasir.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (employee: EmployeeDTO) => {
    if (employee.role === "OWNER") return;

    setActionLoadingId(employee.id);
    try {
      const res = await toggleEmployeeStatus(employee.id);
      if (res.success) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === employee.id
              ? { ...emp, isActive: res.newStatus ?? !emp.isActive }
              : emp
          )
        );
        setNotification({
          type: "success",
          message: res.message,
        });
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification({ type: "error", message: res.message });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err?.message || "Gagal mengubah status kasir.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (employee: EmployeeDTO) => {
    if (employee.role === "OWNER") return;

    const confirmMsg =
      employee.transactionCount > 0
        ? `Kasir "${employee.name}" sudah memiliki riwayat ${employee.transactionCount} transaksi. Akun akan dinonaktifkan agar data keuangan tetap aman. Lanjutkan?`
        : `Apakah kamu yakin ingin menghapus akun kasir "${employee.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(employee.id);
    try {
      const res = await deleteEmployee(employee.id);
      if (res.success) {
        if (employee.transactionCount > 0) {
          setEmployees((prev) =>
            prev.map((emp) =>
              emp.id === employee.id ? { ...emp, isActive: false } : emp
            )
          );
        } else {
          setEmployees((prev) => prev.filter((emp) => emp.id !== employee.id));
        }
        setNotification({ type: "success", message: res.message });
        setTimeout(() => setNotification(null), 5000);
      } else {
        setNotification({ type: "error", message: res.message });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err?.message || "Gagal menghapus kasir.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeCashiersCount = employees.filter(
    (e) => e.role === "KARYAWAN" && e.isActive
  ).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Header Card */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Staf Kasir
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {activeCashiersCount} Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Akun kasir untuk transaksi POS
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Tambah Kasir</span>
        </button>
      </div>

      {/* Global Notification */}
      {notification && (
        <div
          className={`px-4 py-2.5 text-xs flex items-center justify-between border-b ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
              : "bg-rose-50 text-rose-800 border-rose-100"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Table / List of Employees */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-4 font-semibold">Nama</th>
              <th className="py-2.5 px-3 font-semibold">Peran</th>
              <th className="py-2.5 px-3 font-semibold text-center">Transaksi</th>
              <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              <th className="py-2.5 px-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70 text-xs">
            {employees.map((emp) => {
              const isOwner = emp.role === "OWNER";
              const isLoading = actionLoadingId === emp.id;

              return (
                <tr
                  key={emp.id}
                  className={`hover:bg-slate-50/50 transition-colors ${
                    !emp.isActive ? "opacity-50" : ""
                  }`}
                >
                  {/* Nama & Email */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] uppercase shrink-0 ${
                          isOwner
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : emp.role === "ADMIN"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {emp.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 leading-tight truncate">
                          {emp.name}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">
                          {emp.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role Badge */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        isOwner
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : emp.role === "ADMIN"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {isOwner
                        ? "Owner"
                        : emp.role === "ADMIN"
                        ? "Admin"
                        : "Kasir"}
                    </span>
                  </td>

                  {/* Transaksi */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className="text-[11px] font-mono text-slate-600">
                      {emp.transactionCount}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        emp.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          emp.isActive ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      ></span>
                      {emp.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    {isOwner ? (
                      <span className="text-[10px] text-slate-400">Utama</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          disabled={isLoading}
                          title={
                            emp.isActive
                              ? "Nonaktifkan kasir"
                              : "Aktifkan kasir"
                          }
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Power className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          disabled={isLoading}
                          title="Hapus kasir"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Staf kasir dapat login langsung di kasir POS</span>
        <span>{employees.length} staf terdaftar</span>
      </div>

      {/* MODAL: TAMBAH KASIR BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Tambah Kasir Baru</h3>
                  <p className="text-[11px] text-slate-400">
                    Buat akun staf kasir untuk melayani transaksi
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-white cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateEmployee} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Kasir <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Contoh: Rina Amalia (Kasir Pagi)"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              {/* Email Login */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Login Kasir <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Contoh: rina@kasir.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Email ini digunakan kasir saat masuk di halaman login.
                </p>
              </div>

              {/* Kata Sandi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi (Password) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={4}
                    disabled={isSubmitting}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimal 4 karakter (misal: kasir123)"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran / Wewenang Staf
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, role: "KARYAWAN" })
                    }
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      formData.role === "KARYAWAN"
                        ? "bg-blue-50 border-blue-500 text-blue-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold">Kasir Reguler</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Khusus melayani penjualan di POS kasir.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "ADMIN" })}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      formData.role === "ADMIN"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-xs font-bold">Admin Toko</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Akses kasir + kelola katalog produk & rekap.
                    </p>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Simpan Kasir</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

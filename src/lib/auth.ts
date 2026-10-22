export type UserRole = "OWNER" | "ADMIN" | "KARYAWAN";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export const DEMO_ACCOUNTS: SessionUser[] = [
  {
    id: "usr-owner",
    name: "Budi Gunawan (Owner)",
    email: "owner@kasir.com",
    role: "OWNER",
  },
  {
    id: "usr-kasir",
    name: "Ahmad Kasir (Karyawan)",
    email: "kasir@kasir.com",
    role: "KARYAWAN",
  },
];

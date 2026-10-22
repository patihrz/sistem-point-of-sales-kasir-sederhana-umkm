import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/actions/auth";

export default async function Home() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "KARYAWAN") {
    redirect("/pos");
  }

  redirect("/dashboard");
}

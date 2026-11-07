import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return <LoginForm />;
}

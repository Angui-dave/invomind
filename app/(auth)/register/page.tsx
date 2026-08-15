import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Créer mon compte",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}

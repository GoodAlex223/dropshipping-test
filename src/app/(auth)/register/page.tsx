import type { Metadata } from "next";
import { getAuthMetadata } from "@/lib/seo";
import RegisterForm from "./register-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getAuthMetadata("register");

export default function RegisterPage() {
  return <RegisterForm />;
}

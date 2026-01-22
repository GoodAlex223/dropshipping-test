import type { Metadata } from "next";
import { getAuthMetadata } from "@/lib/seo";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = getAuthMetadata("login");

export default function LoginPage() {
  return <LoginForm />;
}

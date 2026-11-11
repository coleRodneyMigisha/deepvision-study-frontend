import type { Metadata } from "next";
import { EmailLink } from "@/components/auth/EmailLink";

export const metadata: Metadata = { title: "Signing you in", robots: { index: false } };

export default function AuthLinkPage() {
  return <EmailLink />;
}

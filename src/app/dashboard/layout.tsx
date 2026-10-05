import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — ReadmeForge AI",
  description: "Generate, edit, and export professional README files.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

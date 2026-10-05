import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "ReadmeForge AI — AI GitHub README Generator",
  description:
    "Analyze your GitHub project and generate accurate, professional README documentation with AI-assisted editing and verification.",
  keywords: [
    "github",
    "readme",
    "documentation",
    "ai",
    "markdown",
    "developer-tools",
    "open-source",
  ],
  openGraph: {
    title: "ReadmeForge AI — AI GitHub README Generator",
    description:
      "Analyze your GitHub project and generate accurate, professional README documentation with AI-assisted editing and verification.",
    type: "website",
    siteName: "ReadmeForge AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReadmeForge AI — AI GitHub README Generator",
    description:
      "Analyze your GitHub project and generate accurate, professional README documentation.",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          theme="dark"
          toastOptions={{
            style: {
              background: "#161625",
              border: "1px solid #2a2a42",
              color: "#d4d4e8",
            },
          }}
        />
      </body>
    </html>
  );
}

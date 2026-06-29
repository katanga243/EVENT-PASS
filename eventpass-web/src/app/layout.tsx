import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/frontend/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventPass — Tickets for Milano & Torino",
  description: "Access to unforgettable moments. Buy and manage event tickets across Milano and Torino.",
  icons: { icon: "/logo-badge.png" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("eventpass_theme")?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang="en"
      data-theme={theme}
      className="h-full"
    >
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}

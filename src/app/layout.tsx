import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { DataStoreProvider } from "@/hooks/useDataStore";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notifyy — Smart Meetings, Calls & Follow-Up Management",
  description: "Never Miss a Follow-Up. Professional personal business assistant for client meetings, phone calls, quick notes, and scheduled follow-ups.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DataStoreProvider>
            <AppShell>{children}</AppShell>
          </DataStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

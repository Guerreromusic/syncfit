import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SyncFit by Synclat";

export const metadata: Metadata = {
  title: `${APP_NAME} — Score, explain, and pitch Latin tracks for global sync`,
  description:
    "SyncFit helps music supervisors instantly understand whether a Latin track fits a creative brief for film, TV, ads, games, and branded content.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-ink-950 bg-purple-glow font-sans text-white">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <Topbar />
            <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-12">
              <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

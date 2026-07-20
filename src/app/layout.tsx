import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Orbit",
  description: "Orbit financial orchestration platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-graphite-950 text-paper min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

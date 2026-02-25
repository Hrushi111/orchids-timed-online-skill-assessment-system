import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import IronManBackground from "@/components/IronManBackground";

export const metadata: Metadata = {
  title: "ThorPrep – Interview Questions & Skill Assessment",
  description: "Thor themed online exam platform for interview preparation with timed tests, skill assessment, lightning-fast analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ position: "relative" }}>
        {/* Thor storm background — temporarily disabled for debugging */}
        {/* <IronManBackground /> */}
        {/* All page content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}

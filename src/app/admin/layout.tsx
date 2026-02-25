"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push("/");
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) return null;

  const navItems = [
    { href: "/admin", label: "📊 Overview", exact: true },
    { href: "/admin/subjects", label: "📚 Subjects & Topics" },
    { href: "/admin/questions", label: "❓ Questions" },
    { href: "/admin/users", label: "👥 Users & Analytics" },
  ];

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", paddingTop: "var(--navbar-h)", minHeight: "100vh" }}>
        <aside className="sidebar" style={{ height: "calc(100vh - var(--navbar-h))", top: "var(--navbar-h)" }}>
          <div className="sidebar-section">Admin Panel</div>
          {navItems.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`sidebar-item ${active ? "active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 12 }}>
            <Link href="/dashboard" className="sidebar-item">⬅ User Dashboard</Link>
          </div>
        </aside>
        <main style={{ flex: 1, padding: 28, height: "calc(100vh - var(--navbar-h))", overflow: "auto" }}>
          {children}
        </main>
      </div>
    </>
  );
}

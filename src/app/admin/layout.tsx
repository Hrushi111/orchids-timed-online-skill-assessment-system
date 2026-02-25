"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", paddingTop: "var(--navbar-h)", minHeight: "100vh" }}>
        {/* Backdrop */}
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`} style={{ height: "calc(100vh - var(--navbar-h))", top: "var(--navbar-h)" }}>
          <div style={{ padding: "8px 22px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="sidebar-section" style={{ padding: 0 }}>Admin Panel</div>
            <button className="mobile-only-flex" onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 20 }}>✕</button>
          </div>
          {navItems.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`sidebar-item ${active ? "active" : ""}`}>
                {item.label}
              </Link>
            );
          })}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 12 }}>
            <Link href="/dashboard" className="sidebar-item">⬅ User Dashboard</Link>
          </div>
        </aside>

        {/* Mobile Toggle Button */}
        <button
          className="mobile-only-flex"
          onClick={() => setSidebarOpen(true)}
          style={{
            position: "fixed", bottom: 20, right: 20, zIndex: 900,
            width: 50, height: 50, borderRadius: "50%",
            background: "var(--primary)", color: "white",
            border: "none", boxShadow: "var(--shadow-lg)",
            alignItems: "center", justifyContent: "center", fontSize: 24
          }}
        >
          ⚙️
        </button>

        <main style={{ flex: 1, padding: 28, height: "calc(100vh - var(--navbar-h))", overflow: "auto" }}>
          {children}
        </main>
      </div>
    </>
  );
}

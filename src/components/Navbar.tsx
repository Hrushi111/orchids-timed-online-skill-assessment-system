"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const navLinks = user ? [
    { href: "/dashboard", label: "Dashboard", icon: "⚡" },
    { href: "/history", label: "History", icon: "📊" },
    { href: "/questions/submit", label: "Dump Questions", icon: "📤" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: "🛠" }] : []),
  ] : [];

  return (
    <nav className="navbar" style={{
      background: "var(--bg)",
      transition: "box-shadow 0.3s ease, border-bottom 0.3s ease",
      borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      boxShadow: scrolled ? "var(--shadow-sm)" : "none",
      height: "var(--navbar-h)",
      display: "flex",
      alignItems: "center",
      padding: "0 var(--container-px)",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
    }}>
      {/* Logo */}
      <Link href="/" style={{
        fontSize: 20,
        fontWeight: 900,
        color: "var(--primary)",
        textDecoration: "none",
        fontFamily: "Poppins",
        letterSpacing: "-0.02em"
      }}>
        ⚡ ThorPrep
      </Link>

      {/* Center Nav Links (Hidden on Mobile) */}
      {user && (
        <div className="mobile-hide" style={{ display: "flex", gap: 8, alignItems: "center", margin: "0 auto" }}>
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  color: active ? "white" : "var(--text-secondary)",
                  background: active ? "var(--primary)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: user ? "0" : "auto" }}>
        {user ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 14px 6px 6px",
                borderRadius: 40,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "all 0.2s",
                color: "var(--primary)",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "var(--primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 900, fontSize: 14,
              }}>
                {profile?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="mobile-hide" style={{ fontSize: 14, fontWeight: 700 }}>
                {profile?.name?.split(" ")[0] ?? "User"}
              </span>
            </button>

            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 10px)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                boxShadow: "var(--shadow-lg)",
                minWidth: 220, zIndex: 9999,
                overflow: "hidden",
              }}>
                <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border-light)", background: "#F9F7E8" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{profile?.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{profile?.email}</div>
                </div>
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 18px", fontSize: 14,
                      color: "var(--text-secondary)", textDecoration: "none",
                    }}
                  >
                    {item.icon} {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    textAlign: "left", padding: "12px 18px", fontSize: 14,
                    color: "var(--danger)", background: "none", border: "none", borderTop: "1px solid var(--border-light)",
                    cursor: "pointer",
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/auth/login" className="btn btn-outline btn-sm">Log In</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">Join Now</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

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

  const CRIMSON = "#671722";
  const CYAN = "#83e2f6";

  return (
    <nav className="navbar" style={{
      background: scrolled
        ? "rgba(17,24,38,0.98)"
        : "rgba(22,31,46,0.92)",
      transition: "background 0.3s ease, box-shadow 0.3s ease",
      boxShadow: scrolled
        ? `0 4px 30px rgba(0,0,0,0.7), 0 1px 0 rgba(131,226,246,0.15)`
        : `0 1px 0 rgba(131,226,246,0.1)`,
    }}>
      {/* Logo */}
      <Link href="/" className="nav-logo">
        ⚡ ThorPrep
      </Link>

      {/* Center Nav Links (Hidden on Mobile) */}
      {user && (
        <div className="mobile-hide" style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            const isDump = link.href === "/questions/submit";
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: isDump ? 700 : 500,
                  textDecoration: "none",
                  transition: "all 0.2s",
                  color: active
                    ? (isDump ? CYAN : "#a8ecf9")
                    : isDump ? "rgba(131,226,246,0.7)" : "rgba(162,186,190,0.85)",
                  background: active
                    ? (isDump ? "rgba(131,226,246,0.12)" : "rgba(103,23,34,0.15)")
                    : isDump ? "rgba(131,226,246,0.06)" : "transparent",
                  border: `1px solid ${active
                    ? (isDump ? "rgba(131,226,246,0.35)" : "rgba(103,23,34,0.35)")
                    : isDump ? "rgba(251,183,36,0.2)" : "transparent"}`,
                  letterSpacing: isDump ? "0.02em" : "normal",
                }}
              >
                <span style={{ fontSize: 15 }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Right Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {user ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            {/* Profile button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 14px 6px 6px",
                borderRadius: 40,
                background: menuOpen ? "rgba(103,23,34,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${menuOpen ? "rgba(131,226,246,0.4)" : "rgba(131,226,246,0.15)"}`,
                cursor: "pointer",
                transition: "all 0.2s",
                color: "white",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #671722, #83e2f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#e8eac7", fontWeight: 900, fontSize: 14,
                fontFamily: "Poppins",
                boxShadow: "0 2px 8px rgba(103,23,34,0.5)",
                flexShrink: 0,
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}>
                {profile?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#e8eac7" }}>
                {profile?.name?.split(" ")[0] ?? "User"}
              </span>
              <svg width="12" height="8" viewBox="0 0 12 8" style={{
                opacity: 0.6,
                transform: menuOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}>
                <path d="M1 1l5 5 5-5" stroke="#83e2f6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>

            {/* Dropdown — Iron Man control panel */}
            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 10px)",
                background: "#111826",
                border: "1px solid rgba(131,226,246,0.18)",
                borderRadius: 14,
                boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                minWidth: 220, zIndex: 9999,
                animation: "fadeInUp 0.15s ease",
                overflow: "hidden",
              }}>
                {/* Profile Header */}
                <div style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid rgba(59,130,246,0.15)",
                  background: "rgba(29,98,211,0.08)",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#f5e6e6" }}>{profile?.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{profile?.email}</div>
                  {isAdmin && (
                    <span className="badge badge-primary" style={{ marginTop: 8, fontSize: 10 }}>⚙ Admin</span>
                  )}
                </div>

                {/* Links */}
                {[
                  { href: "/dashboard", label: "My Dashboard", icon: "⚡" },
                  { href: "/history", label: "Test History", icon: "📊" },
                  { href: "/questions/submit", label: "Dump Questions", icon: "📤" },
                  ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: "🛠" }] : []),
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "11px 18px", fontSize: 14,
                      color: item.href === "/questions/submit" ? "var(--gold-light)" : "var(--text-secondary)",
                      textDecoration: "none", transition: "background 0.15s",
                      fontWeight: item.href === "/questions/submit" ? 600 : 400,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(29,98,211,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{item.icon}</span> {item.label}
                  </Link>
                ))}

                <div style={{ borderTop: "1px solid rgba(59,130,246,0.15)" }}>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      textAlign: "left", padding: "11px 18px", fontSize: 14,
                      color: "#93C5FD", background: "none", border: "none",
                      cursor: "pointer", transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(29,98,211,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>🚪</span> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/auth/login" className="btn btn-secondary btn-sm">Log In</Link>
            <Link href="/auth/register" className="btn btn-primary btn-sm">⚡ Prove Worthy →</Link>
          </>
        )}
      </div>
    </nav>
  );
}

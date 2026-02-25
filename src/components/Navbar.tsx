"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link href="/" className="nav-logo">⚡ PrepMaster</Link>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {user ? (
          <>
            {isAdmin && (
              <Link href="/admin" className="btn btn-sm btn-secondary">
                🛠 Admin
              </Link>
            )}
            <Link href="/dashboard" className="btn btn-sm btn-secondary">
              Dashboard
            </Link>
            <div style={{ position: "relative" }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ gap: "8px" }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: 13
                }}>
                  {profile?.name?.[0]?.toUpperCase() ?? "U"}
                </span>
                {profile?.name?.split(" ")[0] ?? "User"}
                <span style={{ fontSize: 10 }}>▼</span>
              </button>
              {menuOpen && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "white", border: "1px solid #e2e8f0",
                  borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  minWidth: 180, zIndex: 200
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{profile?.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{profile?.email}</div>
                    {isAdmin && <span className="badge badge-primary" style={{ marginTop: 4, fontSize: 11 }}>Admin</span>}
                  </div>
                  <Link href="/dashboard" style={{ display: "block", padding: "10px 16px", fontSize: 14, color: "#1e293b", textDecoration: "none" }} onClick={() => setMenuOpen(false)}>
                    📊 My Dashboard
                  </Link>
                  <Link href="/history" style={{ display: "block", padding: "10px 16px", fontSize: 14, color: "#1e293b", textDecoration: "none" }} onClick={() => setMenuOpen(false)}>
                    📜 Test History
                  </Link>
                  <button
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 14, color: "#ef4444", background: "none", border: "none", cursor: "pointer", borderTop: "1px solid #e2e8f0" }}
                    onClick={() => { signOut(); setMenuOpen(false); }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="btn btn-sm btn-secondary">Log In</Link>
            <Link href="/auth/register" className="btn btn-sm btn-primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}

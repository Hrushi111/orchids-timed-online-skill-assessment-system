"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) { setError(error); setLoading(false); return; }
    router.push("/dashboard");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      position: "relative",
      background: "var(--bg)",
    }}>
      {/* Decorative orbs */}
      <div style={{
        position: "fixed", top: "15%", left: "10%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "15%", right: "10%",
        width: 250, height: 250, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="fade-in-up" style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link href="/" className="nav-logo" style={{ fontSize: 26, display: "inline-block" }}>
            ⚡ PrepMaster
          </Link>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 8 }}>
            Your interview preparation platform
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "40px 36px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, fontFamily: "Poppins" }}>
            Welcome back 👋
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 30 }}>
            Sign in to continue your practice
          </p>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label className="label">Email Address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>
                  📧
                </span>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="label">Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>
                  🔒
                </span>
                <input
                  className="input"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: 44, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.6,
                  }}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: 8, fontSize: 15 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Signing in…
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{ textAlign: "center", fontSize: 14 }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" style={{ color: "var(--primary-light)", fontWeight: 600, textDecoration: "none" }}>
              Create one free →
            </Link>
          </div>

          {/* Demo Credentials */}
          <div className="alert alert-info" style={{ marginTop: 20, marginBottom: 0, fontSize: 13 }}>
            <span>💡</span>
            <div>
              <strong>Admin:</strong> admin@prepmaster.com / admin123<br />
              <strong>User:</strong> Register any account
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

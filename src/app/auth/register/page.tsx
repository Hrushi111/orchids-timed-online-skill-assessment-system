"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await signUp(name, email, password);
    if (error) { setError(error); setLoading(false); return; }
    router.push("/dashboard");
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["transparent", "#ef4444", "#f59e0b", "#10b981"];
  const strengthLabels = ["", "Weak", "Medium", "Strong"];

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
        position: "fixed", top: "10%", right: "10%",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.12), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "10%", left: "8%",
        width: 240, height: 240, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="fade-in-up" style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link href="/" className="nav-logo" style={{ fontSize: 26, display: "inline-block" }}>
            ⚡ PrepMaster
          </Link>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 8 }}>
            Join thousands preparing for interviews
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 28, flexWrap: "wrap" }}>
          {["✅ Free forever", "⏱ Timed tests", "📊 Analytics"].map(f => (
            <span key={f} style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: "rgba(99,102,241,0.12)", color: "var(--primary-light)",
              border: "1px solid rgba(99,102,241,0.2)",
            }}>{f}</span>
          ))}
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "40px 36px" }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, fontFamily: "Poppins" }}>
            Create account 🚀
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 30 }}>
            Start your interview preparation journey today
          </p>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label className="label">Full Name</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>
                  👤
                </span>
                <input
                  className="input"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  style={{ paddingLeft: 44 }}
                />
              </div>
            </div>

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
                  placeholder="Min 6 characters"
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
              {/* Password strength */}
              {password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: strength >= i ? strengthColors[strength] : "rgba(255,255,255,0.1)",
                        transition: "background 0.3s",
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4, color: strengthColors[strength] }}>
                    {strengthLabels[strength]} password
                  </div>
                </div>
              )}
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
                  Creating account…
                </>
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>ALREADY HAVE AN ACCOUNT?</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{ textAlign: "center" }}>
            <Link href="/auth/login" className="btn btn-secondary" style={{ width: "100%" }}>
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

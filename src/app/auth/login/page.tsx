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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc,#ede9fe)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card fade-in" style={{ width: "100%", maxWidth: 420, padding: 36 }}>
        <Link href="/" className="nav-logo" style={{ display: "block", marginBottom: 28, fontSize: 22 }}>⚡ PrepMaster</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Welcome back</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>Sign in to continue your practice</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>
          Don't have an account?{" "}
          <Link href="/auth/register" style={{ color: "#4f46e5", fontWeight: 600 }}>Create one free</Link>
        </div>

        <div style={{ marginTop: 20, padding: 14, background: "#f0f9ff", borderRadius: 8, fontSize: 13, color: "#0369a1" }}>
          <strong>Admin demo:</strong> admin@prepmaster.com / admin123<br />
          <strong>User demo:</strong> Register any account
        </div>
      </div>
    </div>
  );
}

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

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc,#ede9fe)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card fade-in" style={{ width: "100%", maxWidth: 420, padding: 36 }}>
        <Link href="/" className="nav-logo" style={{ display: "block", marginBottom: 28, fontSize: 22 }}>⚡ PrepMaster</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Create account</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 28 }}>Start your interview preparation journey</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input className="input" type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "#4f46e5", fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

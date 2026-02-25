"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const SUBJECT_ICONS: Record<string, string> = {
  Java: "☕", SQL: "🗄️", Angular: "🔺", Aptitude: "🧠",
  "Web Development": "🌐", Python: "🐍", default: "📚"
};
const SUBJECT_COLORS: Record<string, string> = {
  Java: "linear-gradient(135deg,#f97316,#fb923c)",
  SQL: "linear-gradient(135deg,#3b82f6,#60a5fa)",
  Angular: "linear-gradient(135deg,#ef4444,#f87171)",
  Aptitude: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  "Web Development": "linear-gradient(135deg,#06b6d4,#22d3ee)",
  Python: "linear-gradient(135deg,#10b981,#34d399)",
  default: "linear-gradient(135deg,#4f46e5,#818cf8)"
};

export default function Home() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<{ name: string; id: string; duration_minutes: number; description: string }[]>([]);

  useEffect(() => {
    supabase.from("subjects").select("*").then(({ data }) => {
      if (data) setSubjects(data);
    });
  }, []);

  return (
    <>
      <Navbar />
      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)",
        color: "white",
        padding: "80px 24px 100px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.05,
          backgroundImage: "radial-gradient(circle at 25% 25%, #818cf8 0%, transparent 50%), radial-gradient(circle at 75% 75%, #06b6d4 0%, transparent 50%)"
        }} />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div className="badge badge-primary" style={{ marginBottom: 16, fontSize: 13, padding: "6px 14px" }}>
            🎯 Interview Preparation Platform
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            Ace Your Next<br />
            <span style={{ background: "linear-gradient(90deg,#818cf8,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Technical Interview
            </span>
          </h1>
          <p style={{ fontSize: 18, opacity: 0.8, marginBottom: 36, lineHeight: 1.6 }}>
            Practice with timed tests across Java, SQL, Angular, Aptitude and more.
            Get instant feedback, track weak areas, and improve your skills systematically.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/auth/register" className="btn btn-primary btn-lg">Start Free Practice</Link>
                <Link href="/auth/login" className="btn btn-outline btn-lg" style={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}>Log In</Link>
              </>
            )}
          </div>

          <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 52, flexWrap: "wrap" }}>
            {[["100+", "Questions"], ["6", "Subjects"], ["Timed", "Tests"], ["Instant", "Results"]].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{val}</div>
                <div style={{ fontSize: 13, opacity: 0.6 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section style={{ padding: "64px 24px" }}>
        <div className="container">
          <div className="page-header" style={{ textAlign: "center" }}>
            <h2 className="page-title" style={{ fontSize: 32 }}>Available Subjects</h2>
            <p className="page-subtitle" style={{ fontSize: 16 }}>Choose a subject and start a timed test right away</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 20 }}>
            {subjects.map(s => (
              <div key={s.id} className="card card-hover" style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                  <div className="subject-icon" style={{ background: SUBJECT_COLORS[s.name] ?? SUBJECT_COLORS.default }}>
                    {SUBJECT_ICONS[s.name] ?? SUBJECT_ICONS.default}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>⏱ {s.duration_minutes} min test</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>{s.description}</p>
                <Link href={user ? `/test/start?subject=${s.id}` : "/auth/login"} className="btn btn-primary" style={{ width: "100%" }}>
                  Take Test Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: "white", padding: "64px 24px", borderTop: "1px solid #e2e8f0" }}>
        <div className="container">
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 40 }}>Why PrepMaster?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 24 }}>
            {[
              { icon: "⏱", title: "Timed Tests", desc: "Simulate real interview conditions with countdown timers and auto-submit." },
              { icon: "📊", title: "Instant Analytics", desc: "See your score, accuracy, and topic-wise breakdown immediately after submission." },
              { icon: "🎯", title: "Weak Area Detection", desc: "Identify which topics need more attention with personalized feedback." },
              { icon: "📤", title: "Bulk Question Upload", desc: "Admins can upload questions via CSV/Excel for rapid question bank growth." },
              { icon: "🔀", title: "Smart Question Mix", desc: "Tests are dynamically generated with balanced easy, medium, and hard questions." },
              { icon: "📜", title: "Score History", desc: "Track your progress over time and see improvement trends." },
            ].map(f => (
              <div key={f.title} style={{ padding: 24, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{
          background: "linear-gradient(135deg,#4f46e5,#06b6d4)",
          padding: "64px 24px",
          textAlign: "center",
          color: "white"
        }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Ready to start preparing?</h2>
          <p style={{ opacity: 0.85, marginBottom: 28, fontSize: 16 }}>Join thousands of candidates acing their technical interviews</p>
          <Link href="/auth/register" className="btn btn-lg" style={{ background: "white", color: "#4f46e5" }}>
            Get Started Free →
          </Link>
        </section>
      )}

      <footer style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: 13, borderTop: "1px solid #e2e8f0" }}>
        © 2026 PrepMaster. Built for interview success.
      </footer>
    </>
  );
}

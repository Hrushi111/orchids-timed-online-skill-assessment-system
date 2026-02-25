"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function TestStartPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectId = searchParams.get("subject");

  const [subject, setSubject] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [qCount, setQCount] = useState(0);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("mixed");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (!subjectId) { router.push("/dashboard"); return; }

    const load = async () => {
      const [{ data: s }, { data: t }, { count }] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", subjectId).single(),
        supabase.from("topics").select("*").eq("subject_id", subjectId),
        supabase.from("questions").select("id", { count: "exact", head: true }).eq("subject_id", subjectId),
      ]);
      setSubject(s);
      setTopics(t ?? []);
      setQCount(count ?? 0);
      setNumQuestions(Math.min(10, count ?? 10));
      setLoading(false);
    };
    load();
  }, [subjectId, user, authLoading, router]);

  const startTest = () => {
    router.push(`/test/take?subject=${subjectId}&num=${numQuestions}&difficulty=${difficulty}`);
  };

  if (loading || authLoading) return (
    <>
      <Navbar />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <div className="spinner" style={{ width: 48, height: 48 }} />
        <span style={{ color: "var(--text-muted)" }}>Loading test details…</span>
      </div>
    </>
  );

  const difficultyInfo: Record<string, { label: string; color: string; desc: string }> = {
    mixed: { label: "Mixed", color: "#7A8060", desc: "Best for overall practice" },
    easy: { label: "Easy", color: "#2D7A4F", desc: "Build confidence first" },
    medium: { label: "Medium", color: "#C4860A", desc: "Standard interview level" },
    hard: { label: "Hard", color: "#8B0000", desc: "Challenge yourself" },
  };

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: "calc(100vh - 68px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}>
        {/* Glow */}
        <div style={{
          position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)",
          width: 500, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(174,183,179,0.1) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="card fade-in-up" style={{ width: "100%", maxWidth: 540, padding: "40px 36px", position: "relative" }}>
          {/* Back */}
          <Link href="/dashboard" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: "var(--text-muted)", fontSize: 13, textDecoration: "none",
            marginBottom: 28, transition: "color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--primary-light)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            ← Back to Dashboard
          </Link>

          {/* Subject Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
              background: "#F0EEE0",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36,
              animation: "float 3s ease-in-out infinite",
            }}>
              🎯
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, fontFamily: "Poppins" }}>
              {subject?.name} Test
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
              {subject?.description}
            </p>
          </div>

          {/* Quick Stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12, marginBottom: 28,
          }}>
            {[
              { icon: "⏱", val: `${subject?.duration_minutes}m`, lbl: "Duration" },
              { icon: "❓", val: qCount, lbl: "Questions" },
              { icon: "🏷️", val: topics.length, lbl: "Topics" },
            ].map(({ icon, val, lbl }) => (
              <div key={lbl} style={{
                textAlign: "center",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "14px 8px",
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 20, fontFamily: "Poppins" }}>{val}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Topics */}
          {topics.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="label">Topics Covered</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {topics.map(t => (
                  <span key={t.id} className="badge badge-primary">{t.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Questions select */}
          <div className="form-group">
            <label className="label">Number of Questions</label>
            <select
              className="select"
              value={numQuestions}
              onChange={e => setNumQuestions(Number(e.target.value))}
            >
              {[5, 10, 15, 20].filter(n => n <= qCount).map(n => (
                <option key={n} value={n}>{n} questions</option>
              ))}
              {qCount > 0 && qCount < 5 && (
                <option value={qCount}>{qCount} questions (all available)</option>
              )}
            </select>
          </div>

          {/* Difficulty select */}
          <div className="form-group">
            <label className="label">Difficulty Level</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(difficultyInfo).map(([val, info]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDifficulty(val)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${difficulty === val ? info.color : "var(--border)"}`,
                    background: difficulty === val ? `${info.color}18` : "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                    color: difficulty === val ? info.color : "var(--text-secondary)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{info.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{info.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="alert alert-warning" style={{ marginBottom: 24 }}>
            <span>⚠️</span>
            <div>Once started, the timer begins immediately. The test will auto-submit when time runs out.</div>
          </div>

          {/* Start button */}
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", fontSize: 16 }}
            onClick={startTest}
            disabled={qCount === 0}
          >
            {qCount === 0 ? "No questions available" : "🚀 Start Test Now"}
          </button>
        </div>
      </div>
    </>
  );
}

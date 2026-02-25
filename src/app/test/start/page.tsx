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
    <><Navbar />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", color: "#94a3b8" }}>Loading…</div>
    </div></>
  );

  return (
    <>
      <Navbar />
      <div style={{ minHeight: "calc(100vh - 64px)", background: "linear-gradient(135deg,#f8fafc,#ede9fe)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card fade-in" style={{ width: "100%", maxWidth: 520, padding: 36 }}>
          <Link href="/dashboard" style={{ color: "#64748b", fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginBottom: 24 }}>
            ← Back to Dashboard
          </Link>

          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎯</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{subject?.name} Test</h1>
            <p style={{ color: "#64748b", fontSize: 14 }}>{subject?.description}</p>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
              {[
                ["⏱", subject?.duration_minutes + "min", "Duration"],
                ["❓", qCount, "Available Qs"],
                ["🏷️", topics.length, "Topics"],
              ].map(([icon, val, lbl]) => (
                <div key={lbl as string}>
                  <div style={{ fontSize: 18 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{val}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {topics.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>TOPICS COVERED</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {topics.map(t => (
                  <span key={t.id} className="badge badge-primary" style={{ fontSize: 12 }}>{t.name}</span>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="label">Number of Questions</label>
            <select className="select" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))}>
              {[5, 10, 15, 20].filter(n => n <= qCount).map(n => (
                <option key={n} value={n}>{n} questions</option>
              ))}
              {qCount > 0 && qCount < 5 && <option value={qCount}>{qCount} questions (all available)</option>}
            </select>
          </div>

          <div className="form-group">
            <label className="label">Difficulty</label>
            <select className="select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="mixed">Mixed (Easy + Medium + Hard)</option>
              <option value="easy">Easy only</option>
              <option value="medium">Medium only</option>
              <option value="hard">Hard only</option>
            </select>
          </div>

          <div style={{ background: "#fef3c7", borderRadius: 8, padding: 12, fontSize: 13, color: "#92400e", marginBottom: 20 }}>
            ⚠️ Once started, the timer begins immediately. The test will auto-submit when time runs out.
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={startTest} disabled={qCount === 0}>
            {qCount === 0 ? "No questions available" : "🚀 Start Test Now"}
          </button>
        </div>
      </div>
    </>
  );
}

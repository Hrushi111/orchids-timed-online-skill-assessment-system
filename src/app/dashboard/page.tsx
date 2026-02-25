"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const SUBJECT_ICONS: Record<string, string> = { Java: "☕", SQL: "🗄️", Angular: "🔺", Aptitude: "🧠", "Web Development": "🌐", Python: "🐍", default: "📚" };
const SUBJECT_COLORS: Record<string, string> = {
  Java: "linear-gradient(135deg,#f97316,#fb923c)", SQL: "linear-gradient(135deg,#3b82f6,#60a5fa)",
  Angular: "linear-gradient(135deg,#ef4444,#f87171)", Aptitude: "linear-gradient(135deg,#8b5cf6,#a78bfa)",
  "Web Development": "linear-gradient(135deg,#06b6d4,#22d3ee)", Python: "linear-gradient(135deg,#10b981,#34d399)", default: "linear-gradient(135deg,#4f46e5,#818cf8)"
};

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: subs }, { data: results }, { data: qcounts }] = await Promise.all([
        supabase.from("subjects").select("*").order("name"),
        supabase.from("test_results").select("*, subjects(name)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("questions").select("subject_id"),
      ]);
      setSubjects(subs ?? []);
      setRecentResults(results ?? []);
      const counts: Record<string, number> = {};
      (qcounts ?? []).forEach((q: any) => { counts[q.subject_id] = (counts[q.subject_id] ?? 0) + 1; });
      setQuestionCounts(counts);
      setLoading(false);
    };
    if (user) load();
  }, [user]);

  const totalTests = recentResults.length;
  const avgAcc = totalTests > 0 ? (recentResults.reduce((s, r) => s + Number(r.accuracy), 0) / totalTests).toFixed(1) : "—";
  const bestScore = totalTests > 0 ? Math.max(...recentResults.map(r => Number(r.accuracy))).toFixed(1) : "—";

  return (
    <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto" }} className="fade-in">
      {/* Welcome */}
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", color: "white", borderRadius: 16, padding: "28px 32px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Welcome back, {profile?.name?.split(" ")[0]}! 👋</h1>
          <p style={{ opacity: 0.75, fontSize: 15 }}>Ready to practice today? Pick a subject and start your timed test.</p>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[["Tests", totalTests], ["Avg Acc.", avgAcc + (avgAcc !== "—" ? "%" : "")], ["Best", bestScore + (bestScore !== "—" ? "%" : "")]].map(([lbl, val]) => (
            <div key={lbl} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{val}</div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      {loading ? null : recentResults.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Your Recent Performance</div>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {recentResults.map(r => (
              <Link key={r.id} href={`/results/${r.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                <div className="card" style={{ padding: "14px 18px", minWidth: 160, cursor: "pointer", transition: "all 0.2s" }}>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{(r.subjects as any)?.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: Number(r.accuracy) >= 70 ? "#059669" : Number(r.accuracy) >= 40 ? "#d97706" : "#dc2626" }}>
                    {Number(r.accuracy).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.score}/{r.total_questions} correct</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
            <Link href="/history" style={{ textDecoration: "none", flexShrink: 0 }}>
              <div className="card" style={{ padding: "14px 18px", minWidth: 130, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#4f46e5" }}>
                <div style={{ fontSize: 20 }}>📜</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>View All</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Subjects */}
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Choose a Subject</div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading subjects…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 18 }}>
          {subjects.map(s => (
            <div key={s.id} className="card card-hover" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div className="subject-icon" style={{ background: SUBJECT_COLORS[s.name] ?? SUBJECT_COLORS.default }}>
                  {SUBJECT_ICONS[s.name] ?? SUBJECT_ICONS.default}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>⏱ {s.duration_minutes} min · {questionCounts[s.id] ?? 0} questions</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>{s.description}</p>
              <div style={{ display: "flex", gap: 10 }}>
                <Link href={`/test/start?subject=${s.id}`} className="btn btn-primary" style={{ flex: 1 }}>
                  Take Test Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

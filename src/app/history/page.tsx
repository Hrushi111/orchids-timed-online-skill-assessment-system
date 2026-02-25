"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    const load = async () => {
      const [{ data: r }, { data: s }] = await Promise.all([
        supabase.from("test_results").select("*, subjects(name,id)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("subjects").select("id,name").order("name"),
      ]);
      setResults(r ?? []);
      setSubjects(s ?? []);
      setLoading(false);
    };
    load();
  }, [user, authLoading]);

  const filtered = filterSubject ? results.filter(r => r.subject_id === filterSubject) : results;

  const totalTests = results.length;
  const avgAcc = totalTests > 0 ? (results.reduce((s, r) => s + Number(r.accuracy), 0) / totalTests).toFixed(1) : "0";
  const bestAcc = totalTests > 0 ? Math.max(...results.map(r => Number(r.accuracy))).toFixed(1) : "0";

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }} className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Test History</h1>
          <p className="page-subtitle">Review all your past tests and track your progress over time</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { val: totalTests, lbl: "Total Tests", color: "#4f46e5", icon: "📝" },
            { val: `${avgAcc}%`, lbl: "Avg Accuracy", color: "#059669", icon: "🎯" },
            { val: `${bestAcc}%`, lbl: "Best Score", color: "#d97706", icon: "🏆" },
          ].map(s => (
            <div key={s.lbl} className="card" style={{ padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ marginBottom: 16 }}>
          <select className="select" style={{ maxWidth: 220 }} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>No tests found</div>
            <Link href="/dashboard" className="btn btn-primary" style={{ marginTop: 12 }}>Take Your First Test</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(r => {
              const acc = Number(r.accuracy);
              const color = acc >= 70 ? "#059669" : acc >= 40 ? "#d97706" : "#dc2626";
              return (
                <Link key={r.id} href={`/results/${r.id}`} style={{ textDecoration: "none" }}>
                  <div className="card card-hover" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color }}>{acc.toFixed(0)}%</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{(r.subjects as any)?.name}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        {r.score}/{r.total_questions} correct · {Math.floor(r.time_taken_seconds / 60)}m {r.time_taken_seconds % 60}s
                        {r.weak_topics?.length > 0 && <span style={{ marginLeft: 8, color: "#d97706" }}>⚠️ {r.weak_topics.length} weak topics</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: "#94a3b8" }}>{new Date(r.created_at).toLocaleDateString()}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div style={{ color: "#94a3b8" }}>→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

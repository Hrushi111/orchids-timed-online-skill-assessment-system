"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminOverview() {
  const [stats, setStats] = useState({ subjects: 0, topics: 0, questions: 0, users: 0, tests: 0 });
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, t, q, u, tr] = await Promise.all([
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("topics").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("test_results").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        subjects: s.count ?? 0, topics: t.count ?? 0,
        questions: q.count ?? 0, users: u.count ?? 0, tests: tr.count ?? 0
      });
      const { data } = await supabase
        .from("test_results")
        .select("*, profiles(name), subjects(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentTests(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const statCards = [
    { label: "Subjects", value: stats.subjects, icon: "📚", color: "#4f46e5", bg: "#ede9fe" },
    { label: "Topics", value: stats.topics, icon: "🏷️", color: "#0284c7", bg: "#e0f2fe" },
    { label: "Questions", value: stats.questions, icon: "❓", color: "#059669", bg: "#d1fae5" },
    { label: "Users", value: stats.users, icon: "👥", color: "#d97706", bg: "#fef3c7" },
    { label: "Tests Taken", value: stats.tests, icon: "📝", color: "#dc2626", bg: "#fee2e2" },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Overview</h1>
        <p className="page-subtitle">Manage your question bank and monitor platform activity</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 28 }}>
        {statCards.map(sc => (
          <div key={sc.label} className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: sc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{sc.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: sc.color }}>{loading ? "…" : sc.value}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>{sc.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        <Link href="/admin/subjects" className="card card-hover" style={{ padding: 20, textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📚</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Manage Subjects & Topics</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Create subjects, add topics, set test duration</div>
        </Link>
        <Link href="/admin/questions" className="card card-hover" style={{ padding: 20, textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>❓</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Upload Questions</div>
          <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Add individual questions or bulk upload via CSV</div>
        </Link>
      </div>

      <div className="card">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>Recent Test Activity</div>
        {loading ? (
          <div style={{ padding: 24, color: "#94a3b8", textAlign: "center" }}>Loading…</div>
        ) : recentTests.length === 0 ? (
          <div style={{ padding: 24, color: "#94a3b8", textAlign: "center" }}>No tests taken yet</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Subject</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTests.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{(t.profiles as any)?.name ?? "—"}</td>
                  <td>{(t.subjects as any)?.name ?? "—"}</td>
                  <td><strong>{t.score}/{t.total_questions}</strong></td>
                  <td>
                    <span className={`badge ${t.accuracy >= 70 ? "badge-success" : t.accuracy >= 40 ? "badge-medium" : "badge-easy"}`} style={t.accuracy < 40 ? { background: "#fee2e2", color: "#991b1b" } : {}}>
                      {Number(t.accuracy).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: 13 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

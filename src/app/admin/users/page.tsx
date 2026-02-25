"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: u }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("test_results").select("*, subjects(name), profiles(name,email)").order("created_at", { ascending: false }).limit(50),
      ]);
      setUsers(u ?? []);
      setResults(r ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // Per-user stats
  const userStats = users.map(u => {
    const userResults = results.filter(r => r.user_id === u.id);
    const avg = userResults.length > 0 ? userResults.reduce((s: number, r: any) => s + Number(r.accuracy), 0) / userResults.length : 0;
    return { ...u, testCount: userResults.length, avgAccuracy: avg };
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Users & Analytics</h1>
        <p className="page-subtitle">Monitor user performance and test activity</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="stat-value" style={{ color: "#4f46e5" }}>{users.length}</div>
          <div className="stat-label">Total Registered Users</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="stat-value" style={{ color: "#059669" }}>{results.length}</div>
          <div className="stat-label">Total Tests Taken</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>All Users ({users.length})</div>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Loading…</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Tests Taken</th>
                <th>Avg Accuracy</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: "#64748b", fontSize: 13 }}>{u.email}</td>
                  <td><span className={`badge ${u.role === "admin" ? "badge-primary" : "badge-secondary"}`}>{u.role}</span></td>
                  <td>{u.testCount}</td>
                  <td>
                    {u.testCount > 0 ? (
                      <span className={`badge ${u.avgAccuracy >= 70 ? "badge-success" : u.avgAccuracy >= 40 ? "badge-medium" : ""}`}
                        style={u.avgAccuracy < 40 ? { background: "#fee2e2", color: "#991b1b" } : {}}>
                        {u.avgAccuracy.toFixed(1)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ color: "#64748b", fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>Recent Test Results</div>
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Loading…</div>
        ) : results.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>No tests taken yet</div>
        ) : (
          <table className="table">
            <thead><tr><th>User</th><th>Subject</th><th>Score</th><th>Accuracy</th><th>Time</th><th>Date</th></tr></thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{(r.profiles as any)?.name}</td>
                  <td><span className="badge badge-primary">{(r.subjects as any)?.name}</span></td>
                  <td><strong>{r.score}/{r.total_questions}</strong></td>
                  <td><span className={`badge ${Number(r.accuracy) >= 70 ? "badge-success" : "badge-medium"}`}>{Number(r.accuracy).toFixed(1)}%</span></td>
                  <td style={{ fontSize: 13, color: "#64748b" }}>{Math.floor(r.time_taken_seconds / 60)}m {r.time_taken_seconds % 60}s</td>
                  <td style={{ fontSize: 13, color: "#64748b" }}>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

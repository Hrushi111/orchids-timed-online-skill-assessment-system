"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SUBJECT_ICONS: Record<string, string> = {
  Java: "☕", SQL: "🗄️", Angular: "🔺", Aptitude: "🧠",
  "Web Development": "🌐", Python: "🐍", default: "📚"
};
// Iron Man themed subject colors
const SUBJECT_COLORS: Record<string, string> = {
  Java: "linear-gradient(135deg,#cc1f1f,#8b0000)",
  SQL: "linear-gradient(135deg,#f0a500,#c47d00)",
  Angular: "linear-gradient(135deg,#dc2626,#991b1b)",
  Aptitude: "linear-gradient(135deg,#b45309,#78350f)",
  "Web Development": "linear-gradient(135deg,#c47d00,#92400e)",
  Python: "linear-gradient(135deg,#9a1515,#7f1d1d)",
  default: "linear-gradient(135deg,#8b0000,#4a0000)"
};

function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const links = [
    { href: "/dashboard", icon: "⚡", label: "Dashboard" },
    { href: "/history", icon: "📊", label: "My Results" },
    { href: "/questions/submit", icon: "📤", label: "Dump Questions" },
    ...(isAdmin ? [{ href: "/admin", icon: "🛠", label: "Admin Panel" }] : []),
  ];

  return (
    <aside className="sidebar slide-in-left" style={{ display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <div style={{ padding: "8px 22px 20px" }}>
        <Link href="/" className="nav-logo" style={{ fontSize: 18 }}>🔴 IronPrep</Link>
      </div>

      <div className="sidebar-section">Navigation</div>
      {links.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={`sidebar-item ${pathname === l.href ? "active" : ""}`}
        >
          <span style={{ fontSize: 18 }}>{l.icon}</span>
          {l.label}
        </Link>
      ))}

      <div className="sidebar-section" style={{ marginTop: 20 }}>Subjects</div>
      {["Java", "SQL", "Angular", "Aptitude", "Web Development", "Python"].map(s => (
        <div key={s} className="sidebar-item" style={{ fontSize: 13 }}>
          <span>{SUBJECT_ICONS[s]}</span> {s}
        </div>
      ))}

      {/* Bottom Credit */}
      <div style={{ marginTop: "auto", padding: "20px 22px", fontSize: 12, color: "var(--text-muted)" }}>
        PrepMaster v2.0 © 2026
      </div>
    </aside>
  );
}

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
  const avgAcc = totalTests > 0
    ? (recentResults.reduce((s, r) => s + Number(r.accuracy), 0) / totalTests).toFixed(1)
    : "—";
  const bestScore = totalTests > 0
    ? Math.max(...recentResults.map(r => Number(r.accuracy))).toFixed(1)
    : "—";

  const gradeColor = (acc: number) =>
    acc >= 70 ? "#10b981" : acc >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 68px)" }}>
      <Sidebar />

      {/* Main Content */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }} className="fade-in">

        {/* Welcome Banner */}
        <div style={{
          position: "relative", overflow: "hidden",
          borderRadius: 20, padding: "30px 36px", marginBottom: 32,
          background: "linear-gradient(135deg, rgba(204,31,31,0.18) 0%, rgba(240,165,0,0.08) 100%)",
          border: "1px solid rgba(204,31,31,0.3)",
        }}>
          {/* Background decoration */}
          <div style={{
            position: "absolute", right: -40, top: -40,
            width: 180, height: 180, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--gold-light)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                🔴 Welcome back
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, fontFamily: "Poppins" }}>
                {profile?.name?.split(" ")[0]} 👋
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Ready to practice today? Pick a subject and start your timed test.
              </p>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 20 }}>
              {[
                { val: totalTests, lbl: "Tests Taken", icon: "📝" },
                { val: avgAcc !== "—" ? avgAcc + "%" : "—", lbl: "Avg Accuracy", icon: "🎯" },
                { val: bestScore !== "—" ? bestScore + "%" : "—", lbl: "Best Score", icon: "🏆" },
              ].map(({ val, lbl, icon }) => (
                <div key={lbl} style={{
                  textAlign: "center",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  padding: "14px 18px",
                  minWidth: 90,
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Poppins", color: "white" }}>{val}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Performance */}
        {!loading && recentResults.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Poppins" }}>Recent Performance</h2>
              <Link href="/history" className="btn btn-secondary btn-sm">View All →</Link>
            </div>
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
              {recentResults.map((r, i) => {
                const acc = Number(r.accuracy);
                return (
                  <Link key={r.id} href={`/results/${r.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                    <div className="card card-hover fade-in-up" style={{
                      padding: "18px 20px", minWidth: 170,
                      animationDelay: `${i * 0.07}s`, opacity: 0,
                    }}>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                        {(r.subjects as any)?.name}
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: gradeColor(acc), fontFamily: "Poppins" }}>
                        {acc.toFixed(0)}%
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                        {r.score}/{r.total_questions} correct
                      </div>
                      {/* Mini progress */}
                      <div className="progress" style={{ marginTop: 10 }}>
                        <div className="progress-bar" style={{
                          width: `${acc}%`,
                          background: acc >= 70 ? "#10b981" : acc >= 40 ? "#f59e0b" : "#ef4444"
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Subjects Grid */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "Poppins" }}>Choose a Subject</h2>
            <span className="badge badge-primary">{subjects.length} available</span>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, gap: 16 }}>
              <div className="spinner" />
              <span style={{ color: "var(--text-muted)" }}>Loading subjects…</span>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px,1fr))", gap: 20 }}>
              {subjects.map((s, i) => (
                <div
                  key={s.id}
                  className="card card-hover fade-in-up"
                  style={{ padding: 26, animationDelay: `${i * 0.07}s`, opacity: 0 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <div className="subject-icon" style={{ background: SUBJECT_COLORS[s.name] ?? SUBJECT_COLORS.default }}>
                      {SUBJECT_ICONS[s.name] ?? SUBJECT_ICONS.default}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17, fontFamily: "Poppins" }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                        ⏱ {s.duration_minutes} min · {questionCounts[s.id] ?? 0} questions
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
                    {s.description}
                  </p>

                  {/* Question count bar */}
                  <div className="progress" style={{ marginBottom: 18 }}>
                    <div className="progress-bar" style={{ width: `${Math.min(100, (questionCounts[s.id] ?? 0) / 50 * 100)}%` }} />
                  </div>

                  <Link
                    href={`/test/start?subject=${s.id}`}
                    className="btn btn-primary"
                    style={{ width: "100%" }}
                  >
                    🚀 Take Test Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

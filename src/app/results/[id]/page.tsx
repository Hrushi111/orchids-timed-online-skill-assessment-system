"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler,
  Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

const SUGGESTIONS: Record<string, string[]> = {
  Java: ["Review Java OOPs fundamentals", "Practice Collections framework problems", "Study Exception Handling patterns"],
  SQL: ["Practice complex JOIN queries", "Study indexing and query optimization", "Review aggregate functions and GROUP BY"],
  Angular: ["Build small Angular components", "Study RxJS and Observables", "Review Angular lifecycle hooks"],
  Aptitude: ["Practice number series and patterns", "Work on time & distance problems", "Review logical reasoning shortcuts"],
  "Web Development": ["Build a responsive web page", "Study CSS Flexbox and Grid", "Review JavaScript ES6+ features"],
  Python: ["Practice Python data structures", "Study list comprehensions", "Review Python OOP concepts"],
};

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: "var(--text-muted)", font: { family: "Poppins", size: 12 } },
    },
  },
};

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [subject, setSubject] = useState<any>(null);
  const [topicNames, setTopicNames] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    const load = async () => {
      const { data: r } = await supabase.from("test_results").select("*").eq("id", id).single();
      if (!r) { router.push("/dashboard"); return; }
      setResult(r);
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", r.subject_id).single(),
        supabase.from("topics").select("id,name").eq("subject_id", r.subject_id),
      ]);
      setSubject(s);
      const names: Record<string, string> = {};
      (t ?? []).forEach((tp: any) => { names[tp.id] = tp.name; });
      setTopicNames(names);
      const qids = Object.keys(r.answers ?? {});
      if (qids.length > 0) {
        const { data: qs } = await supabase.from("questions").select("*").in("id", qids);
        setQuestions(qs ?? []);
      }
      setLoading(false);
    };
    load();
  }, [id, user, authLoading]);

  if (loading || authLoading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 20, background: "var(--bg)" }}>
      <div className="spinner" style={{ width: 52, height: 52, borderWidth: 3 }} />
      <span style={{ color: "var(--text-muted)" }}>Loading your results…</span>
    </div>
  );

  const { score, total_questions, accuracy, time_taken_seconds, topic_performance = {}, weak_topics = [] } = result;
  const acc = Number(accuracy);
  const timeFmt = `${Math.floor(time_taken_seconds / 60)}m ${time_taken_seconds % 60}s`;
  const grade =
    acc >= 90 ? { label: "Excellent!", color: "#10b981", emoji: "🏆", desc: "Outstanding performance!" } :
      acc >= 70 ? { label: "Good Job!", color: "#6366f1", emoji: "✅", desc: "Above average performance" } :
        acc >= 50 ? { label: "Average", color: "#f59e0b", emoji: "📚", desc: "Room for improvement" } :
          { label: "Keep Going", color: "#ef4444", emoji: "💪", desc: "Practice makes perfect" };

  const topicKeys = Object.keys(topic_performance);
  const radarLabels = topicKeys.map(k => topicNames[k] ?? k.slice(0, 12));
  const radarData = topicKeys.map(k => {
    const t = topic_performance[k];
    return t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
  });

  const doughnutData = {
    labels: ["Correct", "Incorrect"],
    datasets: [{
      data: [score, total_questions - score],
      backgroundColor: ["rgba(16,185,129,0.8)", "rgba(239,68,68,0.5)"],
      borderColor: ["#10b981", "#ef4444"],
      borderWidth: 2,
      hoverOffset: 6,
    }],
  };

  const barData = {
    labels: radarLabels,
    datasets: [{
      label: "Accuracy %",
      data: radarData,
      backgroundColor: radarData.map(v => v >= 70 ? "rgba(16,185,129,0.7)" : v >= 40 ? "rgba(245,158,11,0.7)" : "rgba(239,68,68,0.7)"),
      borderColor: radarData.map(v => v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444"),
      borderWidth: 1,
      borderRadius: 6,
    }],
  };

  const suggestions = SUGGESTIONS[subject?.name] ?? ["Review the subject material", "Practice more questions", "Focus on weak topics"];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "32px 24px" }} className="fade-in">
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* ── SCORE HERO ── */}
        <div style={{
          position: "relative", overflow: "hidden",
          borderRadius: 20, padding: "36px 40px", marginBottom: 28,
          background: `linear-gradient(135deg, ${grade.color}22 0%, ${grade.color}0a 100%)`,
          border: `1.5px solid ${grade.color}3a`,
          textAlign: "center",
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            width: 400, height: 300, borderRadius: "50%",
            background: `radial-gradient(ellipse, ${grade.color}18 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative" }}>
            {/* Emoji + grade */}
            <div style={{ fontSize: 64, marginBottom: 8, animation: "float 3s ease-in-out infinite" }}>
              {grade.emoji}
            </div>
            <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 4, fontFamily: "Poppins", color: grade.color }}>
              {grade.label}
            </h1>
            <p style={{ color: "var(--text-muted)", marginBottom: 28, fontSize: 14 }}>
              {subject?.name} Test — {new Date(result.created_at).toLocaleString()}
            </p>

            {/* Score stats */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              {[
                { val: `${score}/${total_questions}`, lbl: "Score", icon: "🎯", color: "#6366f1" },
                { val: `${acc.toFixed(1)}%`, lbl: "Accuracy", icon: "📊", color: grade.color },
                { val: timeFmt, lbl: "Time Taken", icon: "⏱", color: "#06b6d4" },
                { val: weak_topics.length, lbl: "Weak Areas", icon: "⚠️", color: "#f59e0b" },
              ].map(({ val, lbl, icon, color }) => (
                <div key={lbl} style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14, padding: "16px 22px", minWidth: 120,
                }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "Poppins" }}>{val}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>

            {/* Accuracy bar */}
            <div style={{ maxWidth: 400, margin: "24px auto 0", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                <span>Accuracy</span><span style={{ color: grade.color, fontWeight: 700 }}>{acc.toFixed(1)}%</span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div className="progress-bar" style={{
                  width: `${acc}%`,
                  background: `linear-gradient(90deg, ${grade.color}, ${grade.color}aa)`,
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── CHARTS ── */}
        <div className="mobile-stack" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Doughnut */}
          <div className="card" style={{ padding: 26 }}>
            <div style={{ fontWeight: 700, marginBottom: 18, fontSize: 15, fontFamily: "Poppins" }}>Score Breakdown</div>
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Doughnut
                data={doughnutData}
                options={{
                  ...chartDefaults,
                  cutout: "72%",
                  plugins: {
                    ...chartDefaults.plugins,
                    legend: { ...chartDefaults.plugins.legend, position: "bottom" as const },
                  },
                }}
              />
            </div>
          </div>

          {/* Bar chart */}
          <div className="card" style={{ padding: 26 }}>
            <div style={{ fontWeight: 700, marginBottom: 18, fontSize: 15, fontFamily: "Poppins" }}>Topic Performance</div>
            {topicKeys.length > 0 ? (
              <div style={{ height: 220 }}>
                <Bar
                  data={barData}
                  options={{
                    ...chartDefaults,
                    indexAxis: "y" as const,
                    plugins: { ...chartDefaults.plugins, legend: { display: false } },
                    scales: {
                      x: {
                        min: 0, max: 100,
                        ticks: { callback: (v) => `${v}%`, color: "var(--text-muted)" },
                        grid: { color: "var(--border-light)" },
                      },
                      y: { ticks: { color: "var(--text-muted)" }, grid: { display: false } },
                    },
                  }}
                />
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 60, fontSize: 14 }}>
                No topic data available
              </div>
            )}
          </div>
        </div>

        {/* ── WEAK TOPICS & SUGGESTIONS ── */}
        {weak_topics.length > 0 && (
          <div className="card" style={{ padding: 26, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, fontFamily: "Poppins" }}>
              ⚠️ Areas Needing Improvement
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {weak_topics.map((tid: string) => (
                <span key={tid} style={{
                  background: "rgba(239,68,68,0.12)", color: "#f87171",
                  padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  border: "1px solid rgba(239,68,68,0.25)",
                }}>
                  {topicNames[tid] ?? "General"}
                </span>
              ))}
            </div>

            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, color: "var(--text-secondary)" }}>
              💡 Improvement Suggestions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestions.map((s, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, alignItems: "flex-start",
                  padding: "12px 16px", borderRadius: 10,
                  background: "rgba(99,102,241,0.06)",
                  border: "1px solid rgba(99,102,241,0.15)",
                  fontSize: 14, color: "var(--text-secondary)",
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--primary)", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ANSWER REVIEW ── */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{
            padding: "18px 24px",
            borderBottom: showAnswers ? "1px solid var(--border)" : "none",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "Poppins" }}>Answer Review</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                {score} correct · {total_questions - score} incorrect
              </div>
            </div>
            <button
              className={`btn btn-sm ${showAnswers ? "btn-secondary" : "btn-primary"}`}
              onClick={() => setShowAnswers(!showAnswers)}
            >
              {showAnswers ? "Hide Answers" : "📋 Show Answers"}
            </button>
          </div>

          {showAnswers && questions.length > 0 && (
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 28 }}>
              {questions.map((q, i) => {
                const userAns = result.answers?.[q.id];
                const correct = userAns === q.correct_answer;
                return (
                  <div key={q.id} style={{
                    borderBottom: i < questions.length - 1 ? "1px solid var(--border)" : "none",
                    paddingBottom: i < questions.length - 1 ? 28 : 0,
                  }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: correct ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        border: `2px solid ${correct ? "#10b981" : "#ef4444"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, flexShrink: 0, fontSize: 12,
                        color: correct ? "#34d399" : "#f87171",
                      }}>
                        {i + 1}
                      </span>
                      <p style={{ fontWeight: 600, lineHeight: 1.6, fontSize: 15 }}>{q.question_text}</p>
                      <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: 20 }}>
                        {correct ? "✅" : "❌"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginLeft: 40 }}>
                      {(["A", "B", "C", "D"] as const).map(opt => {
                        const val = q[`option_${opt.toLowerCase()}`];
                        const isCorrect = opt === q.correct_answer;
                        const isUser = opt === userAns;
                        let cls = "";
                        if (isCorrect) cls = "correct";
                        else if (isUser && !isCorrect) cls = "incorrect";
                        return (
                          <div key={opt} className={`option-item ${cls}`} style={{ padding: "9px 12px", cursor: "default", fontSize: 13 }}>
                            <span className="option-letter" style={{ width: 24, height: 24, fontSize: 11 }}>{opt}</span>
                            <span style={{ flex: 1, lineHeight: 1.4 }}>{val}</span>
                            {isCorrect && <span style={{ color: "#34d399", fontSize: 14, fontWeight: 700 }}>✓</span>}
                            {isUser && !isCorrect && <span style={{ color: "#f87171", fontSize: 14, fontWeight: 700 }}>✗</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── ACTIONS ── */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={`/test/start?subject=${result.subject_id}`} className="btn btn-primary btn-lg">
            🔄 Retake Test
          </Link>
          <Link href="/dashboard" className="btn btn-secondary btn-lg">
            🏠 Dashboard
          </Link>
          <Link href="/history" className="btn btn-secondary btn-lg">
            📊 My History
          </Link>
        </div>
      </div>
    </div>
  );
}

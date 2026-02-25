"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Radar, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

const SUGGESTIONS: Record<string, string[]> = {
  Java: ["Review Java OOPs fundamentals", "Practice Collections framework problems", "Study Exception Handling patterns"],
  SQL: ["Practice complex JOIN queries", "Study indexing and query optimization", "Review aggregate functions and GROUP BY"],
  Angular: ["Build small Angular components", "Study RxJS and Observables", "Review Angular lifecycle hooks"],
  Aptitude: ["Practice number series and patterns", "Work on time & distance problems", "Review logical reasoning shortcuts"],
  "Web Development": ["Build a responsive web page", "Study CSS Flexbox and Grid", "Review JavaScript ES6+ features"],
  Python: ["Practice Python data structures", "Study list comprehensions", "Review Python OOP concepts"],
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
      // Fetch questions that were answered
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}><div style={{ color: "#94a3b8" }}>Loading results…</div></div>
    );

  const { score, total_questions, accuracy, time_taken_seconds, topic_performance = {}, weak_topics = [] } = result;
  const acc = Number(accuracy);
  const timeFmt = `${Math.floor(time_taken_seconds / 60)}m ${time_taken_seconds % 60}s`;
  const grade = acc >= 90 ? { label: "Excellent", color: "#059669", emoji: "🏆" } :
    acc >= 70 ? { label: "Good", color: "#2563eb", emoji: "✅" } :
    acc >= 50 ? { label: "Average", color: "#d97706", emoji: "📚" } :
    { label: "Needs Work", color: "#dc2626", emoji: "💪" };

  // Chart data
  const topicKeys = Object.keys(topic_performance);
  const radarLabels = topicKeys.map(k => topicNames[k] ?? k.slice(0, 10));
  const radarData = topicKeys.map(k => {
    const t = topic_performance[k];
    return t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
  });

  const doughnutData = {
    labels: ["Correct", "Incorrect"],
    datasets: [{ data: [score, total_questions - score], backgroundColor: ["#10b981", "#ef4444"], borderWidth: 0 }],
  };

  const barData = {
    labels: radarLabels,
    datasets: [{
      label: "Accuracy %",
      data: radarData,
      backgroundColor: radarData.map(v => v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#ef4444"),
      borderRadius: 6,
    }],
  };

  const suggestions = SUGGESTIONS[subject?.name] ?? ["Review the subject material", "Practice more questions", "Focus on weak topics"];

  return (
    <>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 24px" }} className="fade-in">
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${grade.color}22, ${grade.color}11)`,
          border: `2px solid ${grade.color}33`,
          borderRadius: 16, padding: "28px 32px", marginBottom: 24, textAlign: "center"
        }}>
          <div style={{ fontSize: 52 }}>{grade.emoji}</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "8px 0 4px" }}>{grade.label}!</h1>
          <p style={{ color: "#64748b", marginBottom: 20 }}>{subject?.name} Test — {new Date(result.created_at).toLocaleString()}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { val: `${score}/${total_questions}`, lbl: "Score", color: "#4f46e5" },
              { val: `${acc.toFixed(1)}%`, lbl: "Accuracy", color: grade.color },
              { val: timeFmt, lbl: "Time Taken", color: "#0284c7" },
              { val: weak_topics.length, lbl: "Weak Topics", color: "#d97706" },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Doughnut */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Score Breakdown</div>
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Doughnut data={doughnutData} options={{ cutout: "70%", plugins: { legend: { position: "bottom" } } }} />
            </div>
          </div>

          {/* Topic Performance Bar */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Topic-wise Performance</div>
            {topicKeys.length > 0 ? (
              <div style={{ height: 200 }}>
                <Bar data={barData} options={{
                  indexAxis: "y", responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { min: 0, max: 100, ticks: { callback: (v) => `${v}%` } } }
                }} />
              </div>
            ) : (
              <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>No topic data available</div>
            )}
          </div>
        </div>

        {/* Radar */}
        {topicKeys.length >= 3 && (
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Skill Radar</div>
            <div style={{ height: 280, maxWidth: 400, margin: "0 auto" }}>
              <Radar data={{
                labels: radarLabels,
                datasets: [{
                  label: "Your Score %",
                  data: radarData,
                  backgroundColor: "rgba(79,70,229,0.15)",
                  borderColor: "#4f46e5",
                  pointBackgroundColor: "#4f46e5",
                }]
              }} options={{ scales: { r: { min: 0, max: 100, ticks: { stepSize: 25 } } }, plugins: { legend: { display: false } } }} />
            </div>
          </div>
        )}

        {/* Weak Topics & Suggestions */}
        {weak_topics.length > 0 && (
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>⚠️ Areas Needing Improvement</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {weak_topics.map((tid: string) => (
                <span key={tid} style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                  {topicNames[tid] ?? "General"}
                </span>
              ))}
            </div>
            <div style={{ fontWeight: 600, marginBottom: 10, color: "#374151" }}>💡 Improvement Suggestions</div>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              {suggestions.map((s, i) => (
                <li key={i} style={{ fontSize: 14, color: "#4b5563" }}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Detailed Answers */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>Answer Review</div>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowAnswers(!showAnswers)}>
              {showAnswers ? "Hide Answers" : "Show Answers"}
            </button>
          </div>
          {showAnswers && questions.length > 0 && (
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
              {questions.map((q, i) => {
                const userAns = result.answers?.[q.id];
                const correct = userAns === q.correct_answer;
                return (
                  <div key={q.id} style={{ borderBottom: i < questions.length - 1 ? "1px solid #f1f5f9" : "none", paddingBottom: i < questions.length - 1 ? 20 : 0 }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                      <span style={{ width: 26, height: 26, borderRadius: "50%", background: correct ? "#d1fae5" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0, fontSize: 13 }}>
                        {i + 1}
                      </span>
                      <p style={{ fontWeight: 600, lineHeight: 1.5 }}>{q.question_text}</p>
                      <span style={{ marginLeft: "auto", flexShrink: 0 }}>{correct ? "✅" : "❌"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginLeft: 36 }}>
                      {(["A", "B", "C", "D"] as const).map(opt => {
                        const val = q[`option_${opt.toLowerCase()}`];
                        const isCorrect = opt === q.correct_answer;
                        const isUser = opt === userAns;
                        return (
                          <div key={opt} className={`option-item ${isCorrect ? "correct" : isUser && !isCorrect ? "incorrect" : ""}`} style={{ padding: "8px 12px", cursor: "default", fontSize: 13 }}>
                            <span className="option-letter" style={{ width: 22, height: 22, fontSize: 11 }}>{opt}</span>
                            {val}
                            {isCorrect && <span style={{ marginLeft: "auto", color: "#059669", fontSize: 11, fontWeight: 700 }}>✓</span>}
                            {isUser && !isCorrect && <span style={{ marginLeft: "auto", color: "#ef4444", fontSize: 11, fontWeight: 700 }}>✗</span>}
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

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={`/test/start?subject=${result.subject_id}`} className="btn btn-primary btn-lg">🔄 Retake Test</Link>
          <Link href="/dashboard" className="btn btn-secondary btn-lg">📚 Choose Subject</Link>
          <Link href="/history" className="btn btn-secondary btn-lg">📜 My History</Link>
        </div>
      </div>
    </>
  );
}

"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, Question } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

export default function TakeTestPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const subjectId = searchParams.get("subject")!;
  const numQ = Number(searchParams.get("num") ?? 10);
  const difficulty = searchParams.get("difficulty") ?? "mixed";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState<any>(null);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  // Generate balanced questions from pool
  const generateQuestions = (pool: Question[], total: number, diff: string): Question[] => {
    let filtered = diff === "mixed" ? pool : pool.filter(q => q.difficulty === diff);
    if (filtered.length === 0) filtered = pool;
    // Shuffle
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    if (diff !== "mixed") return shuffled.slice(0, total);
    // Balance: ~40% easy, 40% medium, 20% hard
    const easy = shuffled.filter(q => q.difficulty === "easy");
    const medium = shuffled.filter(q => q.difficulty === "medium");
    const hard = shuffled.filter(q => q.difficulty === "hard");
    const easyCount = Math.round(total * 0.4);
    const hardCount = Math.max(1, Math.round(total * 0.2));
    const medCount = total - easyCount - hardCount;
    const selected = [
      ...easy.slice(0, easyCount),
      ...medium.slice(0, medCount),
      ...hard.slice(0, hardCount),
    ];
    // Fill if not enough
    const remaining = shuffled.filter(q => !selected.includes(q));
    while (selected.length < total && remaining.length > 0) selected.push(remaining.shift()!);
    return selected.slice(0, total).sort(() => Math.random() - 0.5);
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);

    const timeTaken = totalTime - timeLeft;
    let score = 0;
    const topicPerf: Record<string, { correct: number; total: number; topicName: string }> = {};

    questions.forEach(q => {
      const userAns = answers[q.id] ?? "";
      const correct = userAns === q.correct_answer;
      if (correct) score++;
      const tid = q.topic_id ?? "general";
      if (!topicPerf[tid]) topicPerf[tid] = { correct: 0, total: 0, topicName: tid };
      topicPerf[tid].total++;
      if (correct) topicPerf[tid].correct++;
    });

    const accuracy = questions.length > 0 ? (score / questions.length) * 100 : 0;
    const weakTopics = Object.entries(topicPerf)
      .filter(([, v]) => v.total > 0 && v.correct / v.total < 0.5)
      .map(([k]) => k);

    const { data: result } = await supabase.from("test_results").insert({
      user_id: user!.id,
      subject_id: subjectId,
      score,
      total_questions: questions.length,
      accuracy,
      time_taken_seconds: timeTaken,
      answers,
      weak_topics: weakTopics,
      topic_performance: topicPerf,
    }).select().single();

    if (result) router.push(`/results/${result.id}`);
  }, [questions, answers, totalTime, timeLeft, user, subjectId, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }

    const load = async () => {
      const [{ data: s }, { data: pool }] = await Promise.all([
        supabase.from("subjects").select("*").eq("id", subjectId).single(),
        supabase.from("questions").select("*").eq("subject_id", subjectId),
      ]);
      if (!s || !pool || pool.length === 0) { router.push("/dashboard"); return; }
      setSubject(s);
      const selected = generateQuestions(pool, numQ, difficulty);
      setQuestions(selected);
      const duration = s.duration_minutes * 60;
      setTimeLeft(duration);
      setTotalTime(duration);
      setLoading(false);
    };
    load();
  }, [authLoading, user]);

  // Timer
  useEffect(() => {
    if (loading || submittedRef.current) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading]);

  // Prevent back/refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerClass = timeLeft <= 60 ? "timer-critical" : timeLeft <= 120 ? "timer-warning" : "timer-normal";
  const timerPct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const answered = Object.keys(answers).length;

  if (loading || authLoading) return (
    <><Navbar />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 32 }}>⚙️</div>
      <div style={{ color: "#64748b" }}>Generating your test…</div>
    </div></>
  );

  const q = questions[current];

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* Top bar */}
      <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>⚡ {subject?.name} Test</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>Progress</div>
            <div style={{ fontWeight: 700 }}>{answered}/{questions.length}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>Time Left</div>
            <div className={`${timerClass}`} style={{ fontWeight: 800, fontSize: 20, fontFamily: "monospace" }}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { if (confirm("Submit test now?")) handleSubmit(false); }}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Test"}
          </button>
        </div>
      </div>

      {/* Timer bar */}
      <div className="progress" style={{ borderRadius: 0, height: 4 }}>
        <div className="progress-bar" style={{ width: `${timerPct}%`, background: timeLeft <= 60 ? "#ef4444" : timeLeft <= 120 ? "#f97316" : "#10b981" }} />
      </div>

      {timeLeft <= 120 && !submittedRef.current && (
        <div className="alert alert-error" style={{ borderRadius: 0, margin: 0, textAlign: "center" }}>
          ⚠️ {timeLeft <= 60 ? "Less than 1 minute remaining!" : "2 minutes remaining — wrap up!"}
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "1fr 260px", gap: 24 }}>
        {/* Question area */}
        <div>
          <div className="card fade-in" style={{ padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Question {current + 1} of {questions.length}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, opacity: flagged.has(q.id) ? 1 : 0.4 }}
                  title="Flag for review"
                  onClick={() => setFlagged(f => { const n = new Set(f); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
                >🚩</button>
              </div>
            </div>

            <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>{q.question_text}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(["A", "B", "C", "D"] as const).map(opt => {
                const val = q[`option_${opt.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"];
                const selected = answers[q.id] === opt;
                return (
                  <div key={opt} className={`option-item ${selected ? "selected" : ""}`} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}>
                    <span className="option-letter">{opt}</span>
                    <span style={{ fontSize: 15 }}>{val}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid #e2e8f0" }}>
              <button className="btn btn-secondary" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← Previous</button>
              <button className="btn btn-secondary" onClick={() => setAnswers(prev => { const n = { ...prev }; delete n[q.id]; return n; })} disabled={!answers[q.id]}>Clear</button>
              <button className="btn btn-primary" disabled={current === questions.length - 1} onClick={() => setCurrent(c => c + 1)}>Next →</button>
            </div>
          </div>
        </div>

        {/* Question navigator */}
        <div>
          <div className="card" style={{ padding: 16, position: "sticky", top: 76 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Question Navigator</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 16 }}>
              {questions.map((qq, i) => {
                const ans = answers[qq.id];
                const isCur = i === current;
                const isFlag = flagged.has(qq.id);
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrent(i)}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: `2px solid ${isCur ? "#4f46e5" : ans ? "#10b981" : "#e2e8f0"}`,
                      background: isCur ? "#4f46e5" : ans ? "#d1fae5" : "white",
                      color: isCur ? "white" : ans ? "#065f46" : "#64748b",
                      fontWeight: 700, fontSize: 13, cursor: "pointer", position: "relative"
                    }}
                  >
                    {i + 1}
                    {isFlag && <span style={{ position: "absolute", top: -4, right: -4, fontSize: 10 }}>🚩</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "#d1fae5", border: "2px solid #10b981" }} />
                Answered ({answered})
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: "white", border: "2px solid #e2e8f0" }} />
                Unanswered ({questions.length - answered})
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12 }}>🚩</span>
                Flagged ({flagged.size})
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={() => { if (confirm("Submit test now?")) handleSubmit(false); }} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

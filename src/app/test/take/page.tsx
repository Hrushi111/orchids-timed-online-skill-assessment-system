"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, Question } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

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
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const generateQuestions = (pool: Question[], total: number, diff: string): Question[] => {
    let filtered = diff === "mixed" ? pool : pool.filter(q => q.difficulty === diff);
    if (filtered.length === 0) filtered = pool;
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    if (diff !== "mixed") return shuffled.slice(0, total);
    const easy = shuffled.filter(q => q.difficulty === "easy");
    const medium = shuffled.filter(q => q.difficulty === "medium");
    const hard = shuffled.filter(q => q.difficulty === "hard");
    const easyCount = Math.round(total * 0.4);
    const hardCount = Math.max(1, Math.round(total * 0.2));
    const medCount = total - easyCount - hardCount;
    const selected = [...easy.slice(0, easyCount), ...medium.slice(0, medCount), ...hard.slice(0, hardCount)];
    const remaining = shuffled.filter(q => !selected.includes(q));
    while (selected.length < total && remaining.length > 0) selected.push(remaining.shift()!);
    return selected.slice(0, total).sort(() => Math.random() - 0.5);
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    setShowConfirm(false);

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

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
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

  // Circular timer math
  const circleR = 36;
  const circleCirc = 2 * Math.PI * circleR;
  const circleDash = circleCirc * (timerPct / 100);

  if (loading || authLoading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 20, background: "var(--bg)" }}>
      <div className="spinner" style={{ width: 52, height: 52, borderWidth: 3 }} />
      <div style={{ color: "var(--text-muted)", fontSize: 15 }}>Generating your personalized test…</div>
    </div>
  );

  const q = questions[current];

  const timerColor = timeLeft <= 60 ? "#ef4444" : timeLeft <= 120 ? "#f59e0b" : "#10b981";

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* ── Top bar ── */}
      <div style={{
        background: "rgba(10,10,20,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 28px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        {/* Subject info */}
        <div>
          <div className="nav-logo" style={{ fontSize: 16 }}>⚡ {subject?.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>Timed Assessment</div>
        </div>

        {/* Progress + Timer */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* Answered count */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Answered</div>
            <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "Poppins" }}>
              <span style={{ color: "#10b981" }}>{answered}</span>
              <span style={{ color: "var(--text-muted)" }}>/{questions.length}</span>
            </div>
          </div>

          {/* Circular Timer */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Time Left</div>
            <div className="timer-circle" style={{ width: 54, height: 54 }}>
              <svg width="54" height="54" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r={circleR} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                <circle
                  cx="44" cy="44" r={circleR}
                  fill="none" stroke={timerColor} strokeWidth="6"
                  strokeDasharray={`${circleDash} ${circleCirc}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s" }}
                />
              </svg>
              <div className={`timer-circle-text ${timerClass}`} style={{ fontSize: 11, fontWeight: 800 }}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
          >
            {submitting ? <>
              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              Submitting…
            </> : "Submit Test"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress" style={{ borderRadius: 0, height: 3 }}>
        <div className="progress-bar" style={{
          width: `${timerPct}%`,
          background: timerColor,
          transition: "width 1s linear, background 0.5s",
        }} />
      </div>

      {/* Timer warning */}
      {timeLeft <= 120 && !submittedRef.current && (
        <div className="alert" style={{
          borderRadius: 0, margin: 0, textAlign: "center", justifyContent: "center",
          background: timeLeft <= 60 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.12)",
          color: timeLeft <= 60 ? "#f87171" : "#fbbf24",
          border: "none",
          borderBottom: `1px solid ${timeLeft <= 60 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.25)"}`,
        }}>
          {timeLeft <= 60
            ? "🚨 Less than 1 minute remaining! Submit soon!"
            : "⏰ 2 minutes remaining — start wrapping up!"}
        </div>
      )}

      {/* Main layout */}
      <div style={{
        maxWidth: 1000, margin: "0 auto", padding: "28px 24px",
        display: "grid", gridTemplateColumns: "1fr 270px", gap: 24,
      }}>
        {/* ── Question Card ── */}
        <div className="card fade-in" key={current} style={{ padding: 32 }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--primary), #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 14, color: "white", fontFamily: "Poppins",
                flexShrink: 0,
              }}>{current + 1}</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
                of {questions.length} questions
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
              <button
                title="Flag for review"
                onClick={() => setFlagged(f => {
                  const n = new Set(f);
                  n.has(q.id) ? n.delete(q.id) : n.add(q.id);
                  return n;
                })}
                style={{
                  background: flagged.has(q.id) ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.07)",
                  border: flagged.has(q.id) ? "1px solid rgba(239,68,68,0.4)" : "1px solid var(--border)",
                  borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                  fontSize: 14, color: flagged.has(q.id) ? "#f87171" : "var(--text-muted)",
                  transition: "all 0.2s",
                }}
              >
                🚩 {flagged.has(q.id) ? "Flagged" : "Flag"}
              </button>
            </div>
          </div>

          {/* Question text */}
          <p style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.75, marginBottom: 28, color: "var(--text)" }}>
            {q.question_text}
          </p>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(["A", "B", "C", "D"] as const).map(opt => {
              const val = q[`option_${opt.toLowerCase()}` as "option_a" | "option_b" | "option_c" | "option_d"];
              const selected = answers[q.id] === opt;
              return (
                <div
                  key={opt}
                  className={`option-item ${selected ? "selected" : ""}`}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                >
                  <span className="option-letter">{opt}</span>
                  <span style={{ fontSize: 15, lineHeight: 1.5 }}>{val}</span>
                  {selected && (
                    <span style={{ marginLeft: "auto", fontSize: 18 }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 28, paddingTop: 22,
            borderTop: "1px solid var(--border)",
          }}>
            <button
              className="btn btn-secondary"
              disabled={current === 0}
              onClick={() => setCurrent(c => c - 1)}
            >
              ← Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setAnswers(prev => { const n = { ...prev }; delete n[q.id]; return n; })}
              disabled={!answers[q.id]}
              style={{ opacity: answers[q.id] ? 1 : 0.4 }}
            >
              Clear Answer
            </button>
            <button
              className="btn btn-primary"
              disabled={current === questions.length - 1}
              onClick={() => setCurrent(c => c + 1)}
            >
              Next →
            </button>
          </div>
        </div>

        {/* ── Question Navigator ── */}
        <div>
          <div className="card" style={{ padding: 20, position: "sticky", top: 76 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, fontFamily: "Poppins" }}>
              Question Navigator
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 7, marginBottom: 18 }}>
              {questions.map((qq, i) => {
                const ans = answers[qq.id];
                const isCur = i === current;
                const isFlag = flagged.has(qq.id);
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrent(i)}
                    style={{
                      width: "100%", aspectRatio: "1", borderRadius: 8,
                      border: `2px solid ${isCur ? "var(--primary)" : ans ? "#10b981" : "var(--border)"}`,
                      background: isCur ? "var(--primary)" : ans ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)",
                      color: isCur ? "white" : ans ? "#34d399" : "var(--text-muted)",
                      fontWeight: 700, fontSize: 12, cursor: "pointer",
                      position: "relative",
                      transition: "all 0.15s ease",
                      fontFamily: "Poppins",
                    }}
                  >
                    {i + 1}
                    {isFlag && (
                      <span style={{ position: "absolute", top: -3, right: -3, fontSize: 9 }}>🚩</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12, color: "var(--text-muted)" }}>
              {[
                { color: "#10b981", border: "#10b981", label: `Answered (${answered})` },
                { color: "rgba(255,255,255,0.03)", border: "var(--border)", label: `Unanswered (${questions.length - answered})` },
                { color: "var(--primary)", border: "var(--primary)", label: "Current" },
              ].map(({ color, border, label }) => (
                <div key={label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: `2px solid ${border}`, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
              {flagged.size > 0 && (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12 }}>🚩</span>
                  Flagged ({flagged.size})
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 18 }}
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit Test"}
            </button>

            {answered < questions.length && (
              <div style={{ fontSize: 11, textAlign: "center", color: "var(--text-muted)", marginTop: 8 }}>
                {questions.length - answered} question{questions.length - answered !== 1 ? "s" : ""} unanswered
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
            <h2 className="modal-title" style={{ textAlign: "center", marginBottom: 8 }}>Submit Test?</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              You have answered <strong style={{ color: "#10b981" }}>{answered}</strong> out of{" "}
              <strong>{questions.length}</strong> questions.
              {answered < questions.length && (
                <><br /><span style={{ color: "#f87171" }}>⚠️ {questions.length - answered} unanswered will be marked wrong.</span></>
              )}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>
                Keep Reviewing
              </button>
              <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting ? "Submitting…" : "Yes, Submit →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Papa from "papaparse";

const EMPTY = {
    subject_id: "", topic_id: "", question_text: "",
    option_a: "", option_b: "", option_c: "", option_d: "",
    correct_answer: "A", difficulty: "medium",
};

type Mode = "single" | "bulk";

export default function DumpQuestionsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [mode, setMode] = useState<Mode>("single");
    const [subjects, setSubjects] = useState<any[]>([]);
    const [topics, setTopics] = useState<any[]>([]);
    const [form, setForm] = useState({ ...EMPTY });
    const [submitting, setSubmitting] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [myCount, setMyCount] = useState(0);
    const [preview, setPreview] = useState<any[]>([]);
    const [step, setStep] = useState(1); // for single mode wizard
    const fileRef = useRef<HTMLInputElement>(null);

    const filteredTopics = topics.filter(t => t.subject_id === form.subject_id);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push("/auth/login"); return; }
        const load = async () => {
            const [{ data: s }, { data: t }, { count }] = await Promise.all([
                supabase.from("subjects").select("*").order("name"),
                supabase.from("topics").select("*").order("name"),
                supabase.from("questions").select("id", { count: "exact", head: true }).eq("created_by", user.id),
            ]);
            setSubjects(s ?? []);
            setTopics(t ?? []);
            setMyCount(count ?? 0);
        };
        load();
    }, [user, authLoading]);

    const validate = () => {
        const { subject_id, question_text, option_a, option_b, option_c, option_d } = form;
        if (!subject_id) return "Please select a subject.";
        if (!question_text.trim()) return "Question text is required.";
        if (!option_a.trim() || !option_b.trim() || !option_c.trim() || !option_d.trim())
            return "All four options are required.";
        return "";
    };

    const submitSingle = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError("");
        setSubmitting(true);
        const { error: e } = await supabase.from("questions").insert({
            ...form,
            topic_id: form.topic_id || null,
            created_by: user!.id,
        });
        setSubmitting(false);
        if (e) { setError(e.message); return; }
        setSuccess("✅ Question submitted! Thank you for contributing.");
        setMyCount(c => c + 1);
        setForm({ ...EMPTY, subject_id: form.subject_id });
        setStep(1);
        setTimeout(() => setSuccess(""), 5000);
    };

    const handleCSVParse = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBulkLoading(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as any[];
                setPreview(rows.slice(0, 5));
                let inserted = 0, failed = 0;
                for (const row of rows) {
                    const subj = subjects.find(s =>
                        s.name.toLowerCase() === (row.subject ?? "").trim().toLowerCase()
                    );
                    const topic = topics.find(t =>
                        t.name.toLowerCase() === (row.topic ?? "").trim().toLowerCase() &&
                        t.subject_id === subj?.id
                    );
                    if (!subj || !row.question_text) { failed++; continue; }
                    const { error } = await supabase.from("questions").insert({
                        subject_id: subj.id,
                        topic_id: topic?.id ?? null,
                        question_text: row.question_text ?? row.question ?? "",
                        option_a: row.option_a ?? row.a ?? "",
                        option_b: row.option_b ?? row.b ?? "",
                        option_c: row.option_c ?? row.c ?? "",
                        option_d: row.option_d ?? row.d ?? "",
                        correct_answer: (row.correct_answer ?? row.answer ?? "A").toUpperCase(),
                        difficulty: row.difficulty ?? "medium",
                        created_by: user!.id,
                    });
                    if (error) failed++; else inserted++;
                }
                setBulkLoading(false);
                setMyCount(c => c + inserted);
                if (inserted > 0) {
                    setSuccess(`🚀 Bulk upload complete: ${inserted} question${inserted !== 1 ? "s" : ""} added${failed > 0 ? `, ${failed} skipped` : ""}!`);
                } else {
                    setError(`Upload failed. ${failed} row${failed !== 1 ? "s" : ""} had errors. Check subject names match exactly.`);
                }
                if (fileRef.current) fileRef.current.value = "";
                setTimeout(() => { setSuccess(""); setError(""); }, 6000);
            },
            error: () => {
                setBulkLoading(false);
                setError("Could not parse CSV. Please check the file format.");
            },
        });
    };

    const downloadTemplate = () => {
        const csv = [
            "subject,topic,question_text,option_a,option_b,option_c,option_d,correct_answer,difficulty",
            'Java,OOPs,"What is polymorphism in Java?","Ability to take multiple forms","Only about inheritance","A design pattern","None of above",A,easy',
            'SQL,Joins,"What does INNER JOIN return?","Matching rows from both tables","All rows from left table","All rows from right table","All rows from both",A,medium',
            'Python,,"What is a lambda function?","Anonymous inline function","A class method","A decorator","A generator",A,easy',
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "questions_template.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    const stepValid = (s: number) => {
        if (s === 1) return !!form.subject_id;
        if (s === 2) return form.question_text.trim().length > 10;
        if (s === 3) return form.option_a.trim() && form.option_b.trim() && form.option_c.trim() && form.option_d.trim();
        return true;
    };

    return (
        <>
            <Navbar />
            <div style={{ minHeight: "calc(100vh - 68px)", padding: "36px 24px", maxWidth: 820, margin: "0 auto" }}>

                {/* ── HERO HEADER ── */}
                <div className="fade-in" style={{ marginBottom: 32 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                            background: "linear-gradient(135deg, #cc1f1f, #8b0000)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 26, boxShadow: "0 4px 20px rgba(204,31,31,0.5)",
                            animation: "arcReactorPulse 3s ease-in-out infinite",
                        }}>📤</div>
                        <div>
                            <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 900 }}>
                                Dump Your Questions
                            </h1>
                            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 2 }}>
                                Contribute interview questions to the community question bank
                            </p>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div style={{
                        display: "flex", gap: 16, marginTop: 20,
                        padding: "16px 20px",
                        background: "rgba(15,5,5,0.6)",
                        border: "1px solid rgba(204,31,31,0.2)",
                        borderRadius: 12, flexWrap: "wrap",
                    }}>
                        {[
                            { icon: "📝", val: myCount, lbl: "Your Contributions" },
                            { icon: "📚", val: subjects.length, lbl: "Subjects Available" },
                            { icon: "✅", val: "Free", lbl: "Always Open" },
                        ].map(({ icon, val, lbl }) => (
                            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 20 }}>{icon}</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "Poppins", color: "var(--gold-light)" }}>{val}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{lbl}</div>
                                </div>
                                <div style={{ width: 1, height: 30, background: "rgba(204,31,31,0.2)", margin: "0 8px" }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── MODE TOGGLE ── */}
                <div className="card fade-in delay-1" style={{ padding: 6, marginBottom: 24, display: "flex", gap: 4 }}>
                    {(["single", "bulk"] as Mode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError(""); setSuccess(""); setPreview([]); setStep(1); }}
                            style={{
                                flex: 1, padding: "13px 20px",
                                borderRadius: 10, border: "none", cursor: "pointer",
                                fontFamily: "Poppins", fontWeight: 700, fontSize: 14,
                                transition: "all 0.2s",
                                background: mode === m
                                    ? "linear-gradient(135deg, #cc1f1f, #8b0000)"
                                    : "transparent",
                                color: mode === m ? "#fff" : "var(--text-muted)",
                                boxShadow: mode === m ? "0 4px 18px rgba(204,31,31,0.4)" : "none",
                            }}
                        >
                            {m === "single" ? "⚡ Single Question" : "📦 Bulk CSV Upload"}
                        </button>
                    ))}
                </div>

                {/* ── ALERTS ── */}
                {error && (
                    <div className="alert alert-error fade-in" style={{ marginBottom: 20 }}>
                        <span>❌</span>{error}
                    </div>
                )}
                {success && (
                    <div className="alert alert-success fade-in" style={{ marginBottom: 20 }}>
                        {success}
                    </div>
                )}

                {/* ════════════════════
            SINGLE QUESTION MODE — Wizard
            ════════════════════ */}
                {mode === "single" && (
                    <div className="card fade-in" style={{ padding: 28 }}>
                        {/* Step progress */}
                        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32, position: "relative" }}>
                            {/* Line behind steps */}
                            <div style={{
                                position: "absolute", top: 16, left: 0, right: 0, height: 2,
                                background: "rgba(204,31,31,0.1)",
                                zIndex: 0,
                            }} />
                            <div style={{
                                position: "absolute", top: 16, left: 0, height: 2,
                                width: `${((step - 1) / 3) * 100}%`,
                                background: "linear-gradient(90deg, #cc1f1f, #f0a500)",
                                transition: "width 0.4s ease",
                                zIndex: 0,
                            }} />
                            {["Subject", "Question", "Options", "Review"].map((lbl, i) => {
                                const n = i + 1;
                                const done = step > n;
                                const cur = step === n;
                                return (
                                    <div key={lbl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", zIndex: 1 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: "50%",
                                            background: done ? "linear-gradient(135deg, #22c55e, #16a34a)" : cur ? "linear-gradient(135deg, #cc1f1f, #8b0000)" : "rgba(255,255,255,0.06)",
                                            border: done || cur ? "none" : "1px solid rgba(204,31,31,0.3)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 800, fontSize: 13, color: "white",
                                            transition: "all 0.3s",
                                            boxShadow: cur ? "0 0 16px rgba(204,31,31,0.5)" : "none",
                                        }}>
                                            {done ? "✓" : n}
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: cur ? 700 : 500, color: cur ? "var(--gold-light)" : "var(--text-muted)" }}>
                                            {lbl}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── STEP 1: Subject ── */}
                        {step === 1 && (
                            <div className="fade-in">
                                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, fontFamily: "Poppins" }}>
                                    Step 1 — Pick a Subject & Difficulty
                                </h2>
                                <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
                                    Choose which subject and topic this question belongs to.
                                </p>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    <div className="form-group">
                                        <label className="label">Subject *</label>
                                        <select className="select" value={form.subject_id}
                                            onChange={e => setForm(p => ({ ...p, subject_id: e.target.value, topic_id: "" }))}>
                                            <option value="">Select subject…</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Topic (optional)</label>
                                        <select className="select" value={form.topic_id}
                                            onChange={e => setForm(p => ({ ...p, topic_id: e.target.value }))}>
                                            <option value="">No specific topic</option>
                                            {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                        <label className="label">Difficulty Level *</label>
                                        <div style={{ display: "flex", gap: 10 }}>
                                            {[
                                                { val: "easy", color: "#22c55e", desc: "Beginner" },
                                                { val: "medium", color: "#f0a500", desc: "Interview Level" },
                                                { val: "hard", color: "#cc1f1f", desc: "Senior / Advanced" },
                                            ].map(({ val, color, desc }) => (
                                                <button key={val} type="button"
                                                    onClick={() => setForm(p => ({ ...p, difficulty: val }))}
                                                    style={{
                                                        flex: 1, padding: "14px 10px", borderRadius: 10, cursor: "pointer",
                                                        border: `1.5px solid ${form.difficulty === val ? color : "rgba(204,31,31,0.2)"}`,
                                                        background: form.difficulty === val ? `${color}18` : "rgba(255,255,255,0.02)",
                                                        color: form.difficulty === val ? color : "var(--text-muted)",
                                                        transition: "all 0.2s",
                                                        fontFamily: "Poppins",
                                                    }}>
                                                    <div style={{ fontWeight: 700, textTransform: "capitalize" }}>{val}</div>
                                                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: Question ── */}
                        {step === 2 && (
                            <div className="fade-in">
                                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, fontFamily: "Poppins" }}>
                                    Step 2 — Write the Question
                                </h2>
                                <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
                                    Be clear and concise. Avoid ambiguous wording.
                                </p>
                                <div className="form-group">
                                    <label className="label">Question Text *</label>
                                    <textarea
                                        className="input"
                                        rows={5}
                                        placeholder="e.g. What is the time complexity of binary search?"
                                        value={form.question_text}
                                        onChange={e => setForm(p => ({ ...p, question_text: e.target.value }))}
                                        style={{ resize: "vertical", lineHeight: 1.7 }}
                                    />
                                    <div style={{ fontSize: 11, color: form.question_text.length < 10 ? "#cc1f1f" : "var(--text-muted)", marginTop: 6, textAlign: "right" }}>
                                        {form.question_text.length} chars {form.question_text.length < 10 ? "(min 10)" : "✓"}
                                    </div>
                                </div>

                                {/* Tips */}
                                <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(240,165,0,0.06)", border: "1px solid rgba(240,165,0,0.2)", fontSize: 13, color: "var(--text-muted)" }}>
                                    <strong style={{ color: "var(--gold-light)" }}>💡 Tips for good questions:</strong>
                                    <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 2 }}>
                                        <li>Start with "What", "Which", "How", or "Why"</li>
                                        <li>Keep it under 2 sentences</li>
                                        <li>Avoid trick questions — test real knowledge</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3: Options ── */}
                        {step === 3 && (
                            <div className="fade-in">
                                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, fontFamily: "Poppins" }}>
                                    Step 3 — Add Answer Options
                                </h2>
                                <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
                                    Provide four choices and mark the correct one.
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                    {(["A", "B", "C", "D"] as const).map(opt => {
                                        const key = `option_${opt.toLowerCase()}` as keyof typeof form;
                                        const isCorrect = form.correct_answer === opt;
                                        return (
                                            <div key={opt} className="form-group" style={{ position: "relative" }}>
                                                <label className="label" style={{ color: isCorrect ? "#4ade80" : "var(--gold)" }}>
                                                    Option {opt} {isCorrect && "✓ Correct Answer"}
                                                </label>
                                                <div style={{ position: "relative" }}>
                                                    <input
                                                        className="input"
                                                        placeholder={`Option ${opt}…`}
                                                        value={form[key] as string}
                                                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                                        style={{
                                                            borderColor: isCorrect ? "#22c55e" : undefined,
                                                            paddingRight: 44,
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        title="Mark as correct answer"
                                                        onClick={() => setForm(p => ({ ...p, correct_answer: opt }))}
                                                        style={{
                                                            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                                                            background: isCorrect ? "#22c55e" : "rgba(255,255,255,0.07)",
                                                            border: `1.5px solid ${isCorrect ? "#22c55e" : "rgba(255,255,255,0.1)"}`,
                                                            borderRadius: 6, width: 26, height: 26,
                                                            cursor: "pointer", fontSize: 12, color: isCorrect ? "white" : "var(--text-muted)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            transition: "all 0.2s",
                                                        }}
                                                    >✓</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                                    Click ✓ button next to the option to mark it as the correct answer
                                </div>
                            </div>
                        )}

                        {/* ── STEP 4: Review ── */}
                        {step === 4 && (
                            <div className="fade-in">
                                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, fontFamily: "Poppins" }}>
                                    Step 4 — Review & Submit
                                </h2>

                                <div style={{ padding: "20px 22px", borderRadius: 14, background: "rgba(15,5,5,0.7)", border: "1px solid rgba(240,165,0,0.2)", marginBottom: 24 }}>
                                    <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                                        <span className="badge badge-primary">{subjects.find(s => s.id === form.subject_id)?.name}</span>
                                        {form.topic_id && <span className="badge badge-secondary">{topics.find(t => t.id === form.topic_id)?.name}</span>}
                                        <span className={`badge badge-${form.difficulty}`}>{form.difficulty}</span>
                                    </div>

                                    <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 18, lineHeight: 1.6 }}>
                                        {form.question_text}
                                    </p>

                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        {(["A", "B", "C", "D"] as const).map(opt => {
                                            const val = form[`option_${opt.toLowerCase()}` as keyof typeof form] as string;
                                            const isCorrect = form.correct_answer === opt;
                                            return (
                                                <div key={opt} style={{
                                                    display: "flex", gap: 12, alignItems: "center",
                                                    padding: "10px 14px", borderRadius: 8,
                                                    background: isCorrect ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                                                    border: `1px solid ${isCorrect ? "rgba(34,197,94,0.35)" : "rgba(204,31,31,0.1)"}`,
                                                }}>
                                                    <span style={{
                                                        width: 24, height: 24, borderRadius: "50%",
                                                        background: isCorrect ? "#22c55e" : "rgba(255,255,255,0.08)",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                                                        color: isCorrect ? "white" : "var(--text-muted)",
                                                    }}>{opt}</span>
                                                    <span style={{ fontSize: 14, color: isCorrect ? "#4ade80" : "var(--text-secondary)" }}>
                                                        {val}
                                                    </span>
                                                    {isCorrect && <span style={{ marginLeft: "auto", color: "#4ade80", fontWeight: 700, fontSize: 13 }}>✓ Correct</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── NAV BUTTONS ── */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 12 }}>
                            <button
                                className="btn btn-secondary"
                                disabled={step === 1}
                                onClick={() => { setStep(s => s - 1); setError(""); }}
                            >
                                ← Back
                            </button>
                            {step < 4 ? (
                                <button
                                    className="btn btn-primary"
                                    disabled={!stepValid(step)}
                                    onClick={() => { if (stepValid(step)) { setStep(s => s + 1); setError(""); } }}
                                >
                                    Continue →
                                </button>
                            ) : (
                                <button
                                    className="btn btn-gold"
                                    onClick={submitSingle}
                                    disabled={submitting}
                                    style={{ minWidth: 160 }}
                                >
                                    {submitting ? (
                                        <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Submitting…</>
                                    ) : "🚀 Submit Question"}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ════════════════════
            BULK CSV MODE
            ════════════════════ */}
                {mode === "bulk" && (
                    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* Upload card */}
                        <div className="card" style={{ padding: 32, textAlign: "center" }}>
                            <div style={{ fontSize: 52, marginBottom: 12, animation: "float 3s ease-in-out infinite" }}>📦</div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: "Poppins" }}>
                                Bulk CSV Upload
                            </h2>
                            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
                                Upload a CSV file with multiple questions at once.<br />
                                Subject names must match exactly (case-insensitive).
                            </p>

                            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                                <button className="btn btn-outline" onClick={downloadTemplate}>
                                    📥 Download Template CSV
                                </button>
                                <label className="btn btn-primary" style={{ cursor: "pointer" }}>
                                    {bulkLoading ? (
                                        <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Uploading…</>
                                    ) : "📤 Upload CSV File"}
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".csv"
                                        style={{ display: "none" }}
                                        onChange={handleCSVParse}
                                        disabled={bulkLoading}
                                    />
                                </label>
                            </div>

                            {bulkLoading && (
                                <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                    <div className="spinner" />
                                    <span style={{ color: "var(--text-muted)" }}>Inserting questions into database…</span>
                                </div>
                            )}
                        </div>

                        {/* CSV format guide */}
                        <div className="card panel-border" style={{ padding: 24 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, fontFamily: "Poppins" }}>
                                📄 CSV Format Guide
                            </div>
                            <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: "16px 18px", overflowX: "auto", border: "1px solid rgba(240,165,0,0.15)" }}>
                                <code style={{ fontFamily: "monospace", fontSize: 13, color: "var(--gold-light)", lineHeight: 2, display: "block" }}>
                                    subject, topic, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty<br />
                                    <span style={{ color: "var(--text-secondary)" }}>
                                        Java, OOPs, "What is polymorphism?", "Many forms", "Inheritance", "Encapsulation", "None", A, easy<br />
                                        SQL, Joins, "What does INNER JOIN return?", "Matching rows", "All left rows", "All right", "Everything", A, medium
                                    </span>
                                </code>
                            </div>

                            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                {[
                                    { col: "subject", desc: "Must match exactly: Java, SQL, Angular, Python, etc." },
                                    { col: "topic", desc: "Optional. Leave blank if not applicable." },
                                    { col: "correct_answer", desc: 'Must be A, B, C, or D (uppercase).' },
                                    { col: "difficulty", desc: "Must be: easy, medium, or hard (lowercase)." },
                                ].map(({ col, desc }) => (
                                    <div key={col} style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(204,31,31,0.06)", border: "1px solid rgba(204,31,31,0.15)", fontSize: 13 }}>
                                        <code style={{ color: "var(--gold-light)", fontWeight: 700 }}>{col}</code>
                                        <div style={{ color: "var(--text-muted)", marginTop: 3 }}>{desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview table */}
                        {preview.length > 0 && (
                            <div className="card" style={{ overflow: "hidden" }}>
                                <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(204,31,31,0.2)", fontWeight: 700, fontFamily: "Poppins", fontSize: 14 }}>
                                    Preview (first {preview.length} rows)
                                </div>
                                <div style={{ overflowX: "auto" }}>
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                {["Subject", "Topic", "Question", "Correct", "Difficulty"].map(h => (
                                                    <th key={h}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i}>
                                                    <td><span className="badge badge-primary">{row.subject}</span></td>
                                                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{row.topic || "—"}</td>
                                                    <td style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                                        title={row.question_text}>{row.question_text}</td>
                                                    <td style={{ fontWeight: 700, color: "#4ade80" }}>{(row.correct_answer ?? "A").toUpperCase()}</td>
                                                    <td><span className={`badge badge-${row.difficulty ?? "medium"}`}>{row.difficulty ?? "medium"}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Available subjects quick ref */}
                        <div className="card" style={{ padding: 20 }}>
                            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, fontFamily: "Poppins" }}>
                                📚 Available Subjects (exact names for CSV)
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {subjects.map(s => (
                                    <code key={s.id} style={{
                                        background: "rgba(204,31,31,0.1)", color: "var(--gold-light)",
                                        border: "1px solid rgba(204,31,31,0.25)",
                                        padding: "5px 12px", borderRadius: 6, fontSize: 13,
                                        fontFamily: "monospace",
                                    }}>
                                        {s.name}
                                    </code>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── BACK LINK ── */}
                <div style={{ textAlign: "center", marginTop: 32 }}>
                    <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: 13, textDecoration: "none" }}>
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </>
    );
}

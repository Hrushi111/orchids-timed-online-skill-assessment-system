"use client";
import { useEffect, useState, useRef } from "react";
import { supabase, Subject, Topic, Question } from "@/lib/supabase";
import Papa from "papaparse";

const EMPTY_FORM = { subject_id: "", topic_id: "", question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A", difficulty: "medium" };

export default function AdminQuestions() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<(Question & { subjects?: { name: string }; topics?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredTopics = topics.filter(t => t.subject_id === form.subject_id);

  const load = async () => {
    setLoading(true);
    const [{ data: subs }, { data: tops }] = await Promise.all([
      supabase.from("subjects").select("*").order("name"),
      supabase.from("topics").select("*").order("name"),
    ]);
    setSubjects(subs ?? []);
    setTopics(tops ?? []);

    let q = supabase.from("questions").select("*, subjects(name), topics(name)").order("created_at", { ascending: false });
    if (filterSubject) q = q.eq("subject_id", filterSubject);
    if (filterDifficulty) q = q.eq("difficulty", filterDifficulty);
    const { data } = await q.range(page * pageSize, page * pageSize + pageSize - 1);
    setQuestions(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterSubject, filterDifficulty, page]);

  const openAdd = () => {
    setEditQ(null);
    setForm({ ...EMPTY_FORM, subject_id: subjects[0]?.id ?? "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (q: Question) => {
    setEditQ(q);
    setForm({ subject_id: q.subject_id, topic_id: q.topic_id ?? "", question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, option_c: q.option_c, option_d: q.option_d, correct_answer: q.correct_answer, difficulty: q.difficulty });
    setError("");
    setShowModal(true);
  };

  const save = async () => {
    setError("");
    const { subject_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty } = form;
    if (!subject_id || !question_text || !option_a || !option_b || !option_c || !option_d) { setError("All fields except topic are required"); return; }
    const payload = { ...form, topic_id: form.topic_id || null };
    if (editQ) {
      const { error } = await supabase.from("questions").update(payload).eq("id", editQ.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from("questions").insert(payload);
      if (error) { setError(error.message); return; }
    }
    setShowModal(false);
    setSuccess(editQ ? "Question updated!" : "Question added!");
    setTimeout(() => setSuccess(""), 3000);
    load();
  };

  const deleteQ = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("questions").delete().eq("id", id);
    load();
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        let inserted = 0, failed = 0;
        for (const row of rows) {
          const subj = subjects.find(s => s.name.toLowerCase() === (row.subject ?? "").toLowerCase());
          const topic = topics.find(t => t.name.toLowerCase() === (row.topic ?? "").toLowerCase() && t.subject_id === subj?.id);
          if (!subj) { failed++; continue; }
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
          });
          if (error) failed++; else inserted++;
        }
        setBulkLoading(false);
        setSuccess(`Bulk upload: ${inserted} inserted, ${failed} failed`);
        setTimeout(() => setSuccess(""), 5000);
        if (fileRef.current) fileRef.current.value = "";
        load();
      },
    });
  };

  const downloadTemplate = () => {
    const csv = `subject,topic,question_text,option_a,option_b,option_c,option_d,correct_answer,difficulty\nJava,OOPs,"What is polymorphism?","Ability to take many forms","Inheritance only","Encapsulation","None of these",A,easy`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "questions_template.csv"; a.click();
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Questions Manager</h1>
          <p className="page-subtitle">Add, edit, or bulk upload questions to the question bank</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={downloadTemplate}>📥 Template</button>
          <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
            {bulkLoading ? "Uploading…" : "📤 Bulk CSV"}
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} disabled={bulkLoading} />
          </label>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Question</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ padding: 16, marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select className="select" style={{ width: "auto", minWidth: 180 }} value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setPage(0); }}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="select" style={{ width: "auto", minWidth: 160 }} value={filterDifficulty} onChange={e => { setFilterDifficulty(e.target.value); setPage(0); }}>
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="card table-container">
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Loading questions…</div>
        ) : questions.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>No questions found. Add some above or upload a CSV.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Subject</th>
                <th>Topic</th>
                <th>Difficulty</th>
                <th>Answer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={q.id}>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{page * pageSize + i + 1}</td>
                  <td style={{ maxWidth: 320, fontWeight: 500 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={q.question_text}>{q.question_text}</div>
                  </td>
                  <td><span className="badge badge-primary">{(q.subjects as any)?.name}</span></td>
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{(q.topics as any)?.name ?? "—"}</td>
                  <td><span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span></td>
                  <td style={{ fontWeight: 700, color: "var(--success)" }}>{q.correct_answer}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(q)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteQ(q.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (
          <div style={{ padding: "12px 20px", display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--border)" }}>
            <button className="btn btn-sm btn-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>Page {page + 1}</span>
            <button className="btn btn-sm btn-secondary" disabled={questions.length < pageSize} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {/* CSV format hint */}
      <div className="card panel-border" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: "var(--primary)" }}>📄 CSV Format Guide</div>
        <div style={{ fontSize: 13, color: "var(--primary)", fontFamily: "monospace", background: "var(--bg-secondary)", padding: 10, borderRadius: 6, overflowX: "auto" }}>
          subject, topic, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty<br />
          Java, OOPs, "What is polymorphism?", "Many forms", "Inheritance", "Encapsulation", "None", A, easy
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editQ ? "Edit Question" : "Add Question"}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="label">Subject</label>
                <select className="select" value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value, topic_id: "" }))}>
                  <option value="">Select…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Topic (optional)</label>
                <select className="select" value={form.topic_id} onChange={e => setForm(p => ({ ...p, topic_id: e.target.value }))}>
                  <option value="">No specific topic</option>
                  {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Question Text</label>
              <textarea className="input" rows={3} value={form.question_text} onChange={e => setForm(p => ({ ...p, question_text: e.target.value }))} style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {(["A", "B", "C", "D"] as const).map(opt => (
                <div className="form-group" key={opt}>
                  <label className="label">Option {opt}</label>
                  <input className="input" value={form[`option_${opt.toLowerCase()}` as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [`option_${opt.toLowerCase()}`]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="label">Correct Answer</label>
                <select className="select" value={form.correct_answer} onChange={e => setForm(p => ({ ...p, correct_answer: e.target.value }))}>
                  {["A", "B", "C", "D"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Difficulty</label>
                <select className="select" value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save Question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

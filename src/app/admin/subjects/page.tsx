"use client";
import { useEffect, useState } from "react";
import { supabase, Subject, Topic } from "@/lib/supabase";

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [selectedSubjectForTopic, setSelectedSubjectForTopic] = useState<string>("");
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "", duration_minutes: 20 });
  const [topicForm, setTopicForm] = useState({ name: "", subject_id: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const load = async () => {
    const [{ data: subs }, { data: tops }] = await Promise.all([
      supabase.from("subjects").select("*").order("name"),
      supabase.from("topics").select("*").order("name"),
    ]);
    setSubjects(subs ?? []);
    setTopics(tops ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEditSubject = (s?: Subject) => {
    setEditSubject(s ?? null);
    setSubjectForm(s ? { name: s.name, description: s.description ?? "", duration_minutes: s.duration_minutes } : { name: "", description: "", duration_minutes: 20 });
    setError("");
    setShowSubjectModal(true);
  };

  const saveSubject = async () => {
    setError("");
    if (!subjectForm.name.trim()) { setError("Subject name is required"); return; }
    if (editSubject) {
      const { error } = await supabase.from("subjects").update(subjectForm).eq("id", editSubject.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from("subjects").insert(subjectForm);
      if (error) { setError(error.message); return; }
    }
    setShowSubjectModal(false);
    setSuccess(editSubject ? "Subject updated!" : "Subject created!");
    setTimeout(() => setSuccess(""), 3000);
    load();
  };

  const deleteSubject = async (id: string) => {
    if (!confirm("Delete this subject and all its topics? Questions will remain.")) return;
    await supabase.from("topics").delete().eq("subject_id", id);
    await supabase.from("subjects").delete().eq("id", id);
    load();
  };

  const openAddTopic = (subjectId?: string) => {
    setEditTopic(null);
    setTopicForm({ name: "", subject_id: subjectId ?? subjects[0]?.id ?? "" });
    setError("");
    setShowTopicModal(true);
  };

  const openEditTopic = (t: Topic) => {
    setEditTopic(t);
    setTopicForm({ name: t.name, subject_id: t.subject_id });
    setError("");
    setShowTopicModal(true);
  };

  const saveTopic = async () => {
    setError("");
    if (!topicForm.name.trim()) { setError("Topic name is required"); return; }
    if (!topicForm.subject_id) { setError("Please select a subject"); return; }
    if (editTopic) {
      const { error } = await supabase.from("topics").update(topicForm).eq("id", editTopic.id);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from("topics").insert(topicForm);
      if (error) { setError(error.message); return; }
    }
    setShowTopicModal(false);
    setSuccess(editTopic ? "Topic updated!" : "Topic added!");
    setTimeout(() => setSuccess(""), 3000);
    load();
  };

  const deleteTopic = async (id: string) => {
    if (!confirm("Delete this topic?")) return;
    await supabase.from("topics").delete().eq("id", id);
    load();
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Subjects & Topics</h1>
          <p className="page-subtitle">Create subjects and organize topics within them</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => openAddTopic()}>+ Add Topic</button>
          <button className="btn btn-primary" onClick={() => openEditSubject()}>+ New Subject</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {subjects.map(s => {
            const subTopics = topics.filter(t => t.subject_id === s.id);
            const isExpanded = expandedSubject === s.id;
            return (
              <div key={s.id} className="card">
                <div
                  style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => setExpandedSubject(isExpanded ? null : s.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ fontSize: 20 }}>📚</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{s.description}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="badge badge-primary">⏱ {s.duration_minutes}min</span>
                    <span className="badge badge-secondary">{subTopics.length} topics</span>
                    <button className="btn btn-sm btn-secondary" onClick={e => { e.stopPropagation(); openEditSubject(s); }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); deleteSubject(s.id); }}>Delete</button>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>Topics ({subTopics.length})</div>
                      <button className="btn btn-sm btn-primary" onClick={() => openAddTopic(s.id)}>+ Add Topic</button>
                    </div>
                    {subTopics.length === 0 ? (
                      <div style={{ color: "#94a3b8", fontSize: 14 }}>No topics yet. Add one above.</div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {subTopics.map(t => (
                          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px" }}>
                            <span style={{ fontSize: 14 }}>{t.name}</span>
                            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 12 }} onClick={() => openEditTopic(t)}>✏️</button>
                            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 12 }} onClick={() => deleteTopic(t.id)}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowSubjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editSubject ? "Edit Subject" : "New Subject"}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="label">Subject Name</label>
              <input className="input" value={subjectForm.name} onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Java" />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={subjectForm.description} onChange={e => setSubjectForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description…" style={{ resize: "vertical" }} />
            </div>
            <div className="form-group">
              <label className="label">Test Duration (minutes)</label>
              <input className="input" type="number" min={5} max={120} value={subjectForm.duration_minutes} onChange={e => setSubjectForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowSubjectModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveSubject}>Save Subject</button>
            </div>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {showTopicModal && (
        <div className="modal-overlay" onClick={() => setShowTopicModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{editTopic ? "Edit Topic" : "Add Topic"}</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="label">Subject</label>
              <select className="select" value={topicForm.subject_id} onChange={e => setTopicForm(p => ({ ...p, subject_id: e.target.value }))}>
                <option value="">Select subject…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Topic Name</label>
              <input className="input" value={topicForm.name} onChange={e => setTopicForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. OOPs, Collections…" />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setShowTopicModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTopic}>Save Topic</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

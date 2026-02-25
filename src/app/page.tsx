"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const SUBJECT_META: Record<string, { icon: string; color: string; desc: string }> = {
  Java: { icon: "☕", color: "linear-gradient(135deg,#671722,#4A1018)", desc: "OOPs, Collections, Multithreading" },
  SQL: { icon: "🗄️", color: "linear-gradient(135deg,#83e2f6,#5BBDD4)", desc: "Joins, Indexing, Aggregates" },
  Angular: { icon: "🔺", color: "linear-gradient(135deg,#a2babe,#6B7D8A)", desc: "Components, RxJS, Lifecycle" },
  Aptitude: { icon: "🧠", color: "linear-gradient(135deg,#671722,#4A1018)", desc: "Quant, Logical, Verbal" },
  "Web Development": { icon: "🌐", color: "linear-gradient(135deg,#83e2f6,#5BBDD4)", desc: "HTML, CSS, JS, React" },
  Python: { icon: "🐍", color: "linear-gradient(135deg,#e8eac7,#c0c2a5)", desc: "Data Structures, OOP, Algorithms" },
};

export default function HomePage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 3.5s Safety net
    const safetyNet = setTimeout(() => {
      setLoading(false);
    }, 3500);

    async function loadSubjects() {
      try {
        const { data, error } = await supabase.from("subjects").select("*").order("name");
        if (error) {
          console.error("Supabase Error:", error);
        }
        setSubjects(data ?? []);
      } catch (err: any) {
        console.error("Fetch Exception:", err);
      } finally {
        setLoading(false);
        clearTimeout(safetyNet);
      }
    }

    loadSubjects();
    const t = setTimeout(() => setVisible(true), 80);
    return () => {
      clearTimeout(t);
      clearTimeout(safetyNet);
    };
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: "calc(100vh - 68px)", overflowX: "hidden" }}>

        {/* ══════════════════════════════════════
            HERO — Text LEFT · Mjolnir RIGHT
            ══════════════════════════════════════ */}
        <section style={{
          minHeight: "calc(100vh - 68px)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          padding: "60px 60px 60px 80px",
          gap: 40,
          position: "relative",
        }}>
          {/* LEFT — Headline */}
          <div style={{ animation: visible ? "slideInLeft 0.7s ease forwards" : "none", opacity: visible ? 1 : 0 }}>
            {/* Status pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 16px", borderRadius: 40, marginBottom: 28,
              background: "rgba(131,226,246,0.08)",
              border: "1px solid rgba(131,226,246,0.2)",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.1em",
              color: "#83e2f6", textTransform: "uppercase",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "blink 1.5s ease-in-out infinite" }} />
              Crimson Protocol engaged — Worthy Only
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 4.5vw, 64px)",
              fontWeight: 900, lineHeight: 1.1,
              fontFamily: "Poppins", marginBottom: 22,
            }}>
              <span className="gradient-text">Prove</span>
              <br />
              <span style={{ color: "var(--text)" }}>You Are</span>
              <br />
              <span style={{ color: "#83e2f6", fontStyle: "italic" }}>Worthy</span>
            </h1>

            <p style={{
              fontSize: 17, color: "var(--text-secondary)", lineHeight: 1.8,
              marginBottom: 36, maxWidth: 460,
            }}>
              Crimson-grade interview prep. Timed quizzes, instant analytics,
              and divine feedback — engineered to make you{" "}
              <strong style={{ color: "#83e2f6" }}>interview-ready</strong>.
            </p>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
              <Link href="/auth/register" className="btn btn-primary btn-xl" style={{ minWidth: 180 }}>
                ⚡ Prove Worthy
              </Link>
              <Link href="/auth/login" className="btn btn-outline btn-xl">
                → Sign In
              </Link>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 32 }}>
              {[
                { val: "500+", lbl: "Questions", icon: "❓" },
                { val: "6", lbl: "Subjects", icon: "📚" },
                { val: "100%", lbl: "Free", icon: "🆓" },
              ].map(({ val, lbl, icon }) => (
                <div key={lbl} style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "Poppins", color: "#FCD34D" }}>
                    {icon} {val}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Mjolnir ring display */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: visible ? "slideInRight 0.7s ease forwards" : "none",
            opacity: visible ? 1 : 0,
            position: "relative",
          }}>
            {/* Outer dashed ring — gold */}
            <div style={{
              position: "absolute", width: 380, height: 380, borderRadius: "50%",
              border: "1px dashed rgba(251,183,36,0.25)",
              animation: "spin 30s linear infinite",
            }}>
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div key={deg} style={{
                  position: "absolute", width: 8, height: 8, borderRadius: "50%",
                  background: "#FBB724",
                  top: "50%", left: "50%",
                  transformOrigin: "0 0",
                  transform: `rotate(${deg}deg) translate(189px, -4px)`,
                }} />
              ))}
            </div>

            {/* Middle ring — blue */}
            <div style={{
              position: "absolute", width: 280, height: 280, borderRadius: "50%",
              border: "1px solid rgba(59,130,246,0.3)",
              animation: "spin 20s linear infinite reverse",
            }} />

            {/* Inner ring — vivid blue */}
            <div style={{
              position: "absolute", width: 200, height: 200, borderRadius: "50%",
              border: "2px solid rgba(29,98,211,0.5)",
              animation: "spin 12s linear infinite",
            }} />

            {/* Mjolnir Core — lightning bolt center */}
            <div style={{
              position: "relative", width: 140, height: 140, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(96,165,250,0.3) 0%, rgba(29,98,211,0.2) 50%, rgba(10,14,26,0.9) 100%)",
              border: "3px solid rgba(59,130,246,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "arcReactorPulse 3s ease-in-out infinite",
            }}>
              {/* Lightning bolt SVG */}
              <svg width="52" height="72" viewBox="0 0 52 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 2L4 42H22L16 70L50 28H30L32 2Z"
                  fill="#FBB724" stroke="#FCD34D" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>

            {/* HUD text around Mjolnir */}
            {[
              { text: "WORTHY", angle: -80, dist: 110 },
              { text: "100%", angle: -60, dist: 115 },
              { text: "THOR", angle: 120, dist: 110 },
              { text: "ASGARD", angle: 140, dist: 115 },
            ].map(({ text, angle, dist }) => {
              const rad = angle * Math.PI / 180;
              const x = 50 + Math.cos(rad) * dist / 1.4;
              const y = 50 + Math.sin(rad) * dist / 1.4;
              return (
                <div key={text} style={{
                  position: "absolute", left: `${x}%`, top: `${y}%`,
                  transform: "translate(-50%,-50%)",
                  fontSize: 10, fontFamily: "monospace", fontWeight: 700,
                  color: "rgba(251,183,36,0.65)", letterSpacing: "0.15em",
                  animation: "blink 3s ease-in-out infinite",
                }}>
                  {text}
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════
            SUBJECTS — Cards
            ══════════════════════════════════════ */}
        <section style={{ padding: "80px 60px 80px 80px" }}>
          {/* Section header */}
          <div style={{ marginBottom: 48 }}>
            <div style={{
              display: "inline-block", padding: "4px 14px", borderRadius: 20, marginBottom: 12,
              background: "rgba(251,183,36,0.1)", border: "1px solid rgba(251,183,36,0.22)",
              fontSize: 11, fontWeight: 700, color: "#FBB724", textTransform: "uppercase", letterSpacing: "0.12em",
            }}>
              ⚡ Choose Your Trial
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 900, fontFamily: "Poppins", marginBottom: 8 }}>
              <span className="gradient-text">Subject Arsenal</span>
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 480 }}>
              Six high-yield topics forged for maximum interview impact.
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 40 }}>
              <div className="spinner" />
              <span style={{ color: "var(--text-muted)" }}>Summoning knowledge…</span>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}>
              {subjects.map((s, i) => {
                const meta = SUBJECT_META[s.name] ?? { icon: "📚", color: "linear-gradient(135deg,#1D62D3,#0D3A80)", desc: "" };
                const isEven = i % 2 === 0;
                return (
                  <Link key={s.id} href={`/test/start?subject=${s.id}`} style={{ textDecoration: "none" }}>
                    <div
                      className="card card-hover fade-in-up"
                      style={{
                        padding: "28px 24px",
                        animationDelay: `${i * 0.08}s`, opacity: 0,
                        marginTop: isEven ? 0 : 20,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {/* Subtle corner light */}
                      <div style={{
                        position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)",
                        pointerEvents: "none",
                      }} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                        <div className="subject-icon" style={{ background: meta.color }}>
                          {meta.icon}
                        </div>
                        <span className="badge badge-secondary">{s.duration_minutes}m</span>
                      </div>

                      <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, fontFamily: "Poppins" }}>
                        {s.name}
                      </h3>
                      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                        {meta.desc || s.description}
                      </p>

                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        color: "#FBB724", fontSize: 13, fontWeight: 700,
                      }}>
                        Begin Trial →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════
            FEATURES — RIGHT-biased layout
            ══════════════════════════════════════ */}
        <section style={{ padding: "80px 80px 80px 60px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

            {/* LEFT — Feature cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: "⏱", title: "Timed Tests", desc: "Real-interview pressure with configurable countdown timers and auto-submit." },
                { icon: "📊", title: "Instant Analytics", desc: "Topic-wise breakdown, weak spot identification, and score trends after every test." },
                { icon: "📤", title: "Dump Questions", desc: "Contribute questions via the wizard form or bulk-upload a CSV in seconds." },
                { icon: "🚩", title: "Flag & Review", desc: "Flag tricky questions, review answers, track what you missed." },
              ].map(({ icon, title, desc }, i) => (
                <div
                  key={title}
                  className="card card-hover fade-in-up"
                  style={{
                    padding: "20px 22px",
                    display: "flex", gap: 18, alignItems: "flex-start",
                    animationDelay: `${i * 0.1}s`, opacity: 0,
                    marginLeft: i % 2 === 1 ? 24 : 0,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: i % 2 === 0 ? "rgba(29,98,211,0.18)" : "rgba(251,183,36,0.12)",
                    border: `1px solid ${i % 2 === 0 ? "rgba(59,130,246,0.3)" : "rgba(251,183,36,0.25)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                  }}>{icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, fontFamily: "Poppins" }}>{title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT — Title + CTA */}
            <div style={{ textAlign: "right" }}>
              <div style={{
                display: "inline-block", padding: "4px 14px", borderRadius: 20, marginBottom: 14,
                background: "rgba(29,98,211,0.12)", border: "1px solid rgba(59,130,246,0.3)",
                fontSize: 11, fontWeight: 700, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "0.12em",
              }}>
                ⚡ Odin-Approved
              </div>
              <h2 style={{ fontSize: 36, fontWeight: 900, fontFamily: "Poppins", lineHeight: 1.2, marginBottom: 16 }}>
                Built for <br />
                <span className="gradient-text">Peak Performance</span>
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.8, marginBottom: 32, textAlign: "right" }}>
                Every feature is forged in Asgard to simulate real interview conditions
                and give you the sharpest feedback loop possible.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <Link href="/auth/register" className="btn btn-primary btn-lg">
                  ⚡ Join ThorPrep
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            BOTTOM CTA — Bifrost strip
            ══════════════════════════════════════ */}
        <section style={{ padding: "60px 80px", position: "relative", overflow: "hidden" }}>
          <div style={{
            borderRadius: 20, padding: "48px 56px",
            background: "linear-gradient(135deg, rgba(29,98,211,0.18) 0%, rgba(124,58,237,0.12) 50%, rgba(251,183,36,0.1) 100%)",
            border: "1px solid rgba(59,130,246,0.25)",
            display: "grid", gridTemplateColumns: "1fr auto",
            alignItems: "center", gap: 40,
            position: "relative", overflow: "hidden",
          }}>
            {/* Glow orb */}
            <div style={{
              position: "absolute", right: -80, top: -80, width: 400, height: 400, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div>
              <h2 style={{ fontSize: 28, fontWeight: 900, fontFamily: "Poppins", marginBottom: 8 }}>
                Ready to be <span className="gradient-text">Unstoppable</span>?
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 15 }}>
                Join thousands of engineers who cracked their dream job with ThorPrep.
              </p>
            </div>
            <Link href="/auth/register" className="btn btn-gold btn-xl" style={{ whiteSpace: "nowrap" }}>
              🚀 Open Bifrost
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: "center", padding: "28px 24px",
          borderTop: "1px solid rgba(59,130,246,0.15)",
          color: "var(--text-muted)", fontSize: 13,
        }}>
          <span className="gradient-text" style={{ fontWeight: 800, fontSize: 16 }}>⚡ ThorPrep</span>
          <span style={{ margin: "0 12px", opacity: 0.3 }}>|</span>
          Forged in Asgard · Built with ⚡ · 2026
        </footer>
      </main>
    </>
  );
}

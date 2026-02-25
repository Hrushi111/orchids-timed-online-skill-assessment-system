"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const SUBJECT_META: Record<string, { icon: string; color: string; desc: string }> = {
  Java: { icon: "☕", color: "#3D550C", desc: "OOPs, Collections, Multithreading" },
  SQL: { icon: "🗄️", color: "#4B5320", desc: "Joins, Indexing, Aggregates" },
  Angular: { icon: "🔺", color: "#606C38", desc: "Components, RxJS, Lifecycle" },
  Aptitude: { icon: "🧠", color: "#3D550C", desc: "Quant, Logical, Verbal" },
  "Web Development": { icon: "🌐", color: "#4B5320", desc: "HTML, CSS, JS, React" },
  Python: { icon: "🐍", color: "#606C38", desc: "Data Structures, OOP, Algorithms" },
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
            HERO — Clean Olive Layout
            ══════════════════════════════════════ */}
        <section className="container mobile-stack section-padding" style={{
          minHeight: "80vh",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          alignItems: "center",
          gap: 60,
          position: "relative",
        }}>
          {/* LEFT — Headline */}
          <div style={{
            animation: visible ? "slideInLeft 0.7s ease forwards" : "none",
            opacity: visible ? 1 : 0,
            zIndex: 10
          }} className="mobile-text-center">
            {/* Status pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              height: 32, padding: "0 16px", borderRadius: 40, marginBottom: 28,
              background: "#F0EEE0",
              border: "1px solid var(--border)",
              fontSize: 12, fontWeight: 700, letterSpacing: "0.1em",
              color: "var(--primary)", textTransform: "uppercase",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "blink 1.5s ease-in-out infinite" }} />
              Academy Protocol engaged
            </div>

            <h1 style={{
              fontSize: "clamp(48px, 9vw, 84px)",
              fontWeight: 900, lineHeight: 1.05,
              fontFamily: 'Poppins', marginBottom: 28,
              color: "var(--primary)",
              letterSpacing: "-0.03em"
            }}>
              Master the<br />
              <span style={{ color: "var(--text-muted)" }}>Art of the</span><br />
              Interview.
            </h1>

            <p style={{
              fontSize: 20, color: "var(--text-secondary)", lineHeight: 1.6,
              marginBottom: 48, maxWidth: 540,
              marginLeft: "auto", marginRight: "auto"
            }}>
              Premium interview preparation engineered with academic precision.
              Timed trials, detailed analytics, and the wisdom to help you succeed.
            </p>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 64, justifyContent: "inherit" }}>
              <Link href="/auth/register" className="btn btn-primary btn-xl" style={{ minWidth: 220 }}>
                Get Started
              </Link>
              <Link href="/auth/login" className="btn btn-outline btn-xl">
                Sign In
              </Link>
            </div>

            {/* Stats row */}
            <div className="mobile-hide" style={{ display: "flex", gap: 60, justifyContent: "inherit" }}>
              {[
                { val: "500+", lbl: "Questions", icon: "💎" },
                { val: "6", lbl: "Subjects", icon: "🏛️" },
                { val: "100%", lbl: "Free", icon: "📜" },
              ].map(({ val, lbl, icon }) => (
                <div key={lbl} style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: "var(--primary)" }}>{val}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Clean Visual Component */}
          <div className="mobile-hide" style={{
            position: "relative",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            animation: visible ? "slideInRight 0.7s ease forwards" : "none",
            opacity: visible ? 1 : 0
          }}>
            <div style={{
              width: "100%",
              aspectRatio: "1/1",
              background: "white",
              borderRadius: "24px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 120
            }}>
              🌿
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            SUBJECTS — Cards
            ══════════════════════════════════════ */}
        <section className="container section-padding">
          {/* Section header */}
          <div style={{ marginBottom: 80 }} className="mobile-text-center">
            <div style={{
              display: "inline-flex", alignItems: "center", height: 32, padding: "0 16px", borderRadius: 20, marginBottom: 14,
              background: "#F0EEE0", border: "1px solid var(--border)",
              fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.12em",
            }}>
              🌿 The Arsenal
            </div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 42px)", fontWeight: 900, fontFamily: "Poppins", marginBottom: 12, color: "var(--primary)" }}>
              Subject Specializations
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              Focused technical assessments designed to test your core mastery.
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "40px 0", justifyContent: "center" }}>
              <div className="spinner" />
              <span style={{ color: "var(--text-muted)" }}>Summoning knowledge…</span>
            </div>
          ) : subjects.length === 0 ? (
            <div style={{
              padding: "60px 20px", textAlign: "center", borderRadius: 16,
              background: "white", border: "1px dashed var(--border)"
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🛡️</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>The Arsenal is Locked</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
                We couldn't retrieve the subjects. Please check your connection.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary btn-sm"
              >
                🔄 Refresh Connection
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
              gap: 48,
            }}>
              {subjects.map((s, i) => {
                const meta = SUBJECT_META[s.name] ?? { icon: "📚", color: "#4B5320", desc: "" };
                return (
                  <Link key={s.id} href={`/test/start?subject=${s.id}`} style={{ textDecoration: "none" }}>
                    <div
                      className="card card-hover"
                      style={{
                        padding: "36px 32px",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <div style={{
                          fontSize: 28, width: 56, height: 56, borderRadius: 16,
                          background: "#F9F7E8", border: "1px solid var(--border)",
                          display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {meta.icon}
                        </div>
                        <span style={{
                          fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
                          padding: "4px 12px", borderRadius: 20, background: "#F0EEE0"
                        }}>
                          {s.duration_minutes}m
                        </span>
                      </div>

                      <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, fontFamily: "Poppins", color: "var(--primary)" }}>
                        {s.name}
                      </h3>
                      <p style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.6 }}>
                        {meta.desc || s.description}
                      </p>

                      <div style={{
                        marginTop: "auto",
                        display: "inline-flex", alignItems: "center", gap: 8,
                        color: "var(--primary)", fontSize: 15, fontWeight: 800,
                      }}>
                        Start Assessment <span className="arrow-icon">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════
            FEATURES 
            ══════════════════════════════════════ */}
        <section className="container section-padding" style={{ paddingTop: 160, paddingBottom: 160 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 100, alignItems: "center" }} className="mobile-stack">

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
                  className="card card-hover"
                  style={{
                    padding: "20px 22px",
                    display: "flex", gap: 18, alignItems: "flex-start",
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: "#F0EEE0",
                    border: "1px solid var(--border)",
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
            <div className="mobile-text-center">
              <div style={{
                display: "inline-flex", alignItems: "center", height: 32, padding: "0 16px", borderRadius: 20, marginBottom: 16,
                background: "#F0EEE0", border: "1px solid var(--border)",
                fontSize: 12, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.12em",
              }}>
                🏛️ Elite Standards
              </div>
              <h2 style={{ fontSize: "clamp(30px, 5vw, 40px)", fontWeight: 900, fontFamily: "Poppins", lineHeight: 1.2, marginBottom: 20, color: "var(--primary)" }}>
                Forge Your Future <br />
                <span style={{ color: "var(--text-muted)" }}>With Precision</span>
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.8, marginBottom: 36 }}>
                Our trials are meticulously crafted to provide a true reflection of
                real-world interview environments. No distractions, just growth.
              </p>
              <div style={{ display: "flex", gap: 14 }} className="mobile-text-center">
                <Link href="/auth/register" className="btn btn-primary btn-lg">
                  Join the Academy
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════
            BOTTOM CTA 
            ══════════════════════════════════════ */}
        <section className="container section-padding">
          <div style={{
            borderRadius: 24, padding: "60px 48px",
            background: "var(--primary)",
            display: "grid", gridTemplateColumns: "1fr auto",
            alignItems: "center", gap: 40,
            position: "relative", overflow: "hidden",
            boxShadow: "var(--shadow-lg)"
          }} className="mobile-stack mobile-text-center">
            <div>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 36px)", fontWeight: 900, fontFamily: "Poppins", marginBottom: 12, color: "white" }}>
                Ready to be Unstoppable?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, maxWidth: 500 }}>
                Join the ranks of top-tier engineers who prepared their way to success.
              </p>
            </div>
            <Link href="/auth/register" className="btn btn-xl" style={{
              background: "white", color: "var(--primary)", fontWeight: 800, whiteSpace: "nowrap"
            }}>
              Start Your Journey
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="container" style={{
          textAlign: "center", padding: "40px 24px",
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)", fontSize: 13,
        }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: "var(--primary)" }}>⚡ ThorPrep</span>
          </div>
          <p style={{ opacity: 0.6 }}>
            Academy Protocol · Built with ⚡ · {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </>
  );
}

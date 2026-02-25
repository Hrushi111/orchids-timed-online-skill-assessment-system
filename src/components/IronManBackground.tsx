"use client";
import { useEffect, useRef } from "react";

/*
  ThorBackground
  Fixed, full-screen atmospheric backdrop — NO floating pictures.
  Layers:
  1. Canvas  — drifting electric-blue/silver lightning sparks
  2. Static storm gradient mesh
  3. Subtle diagonal rune-grid overlay
  4. Corner Mjolnir-bracket accents
  5. Left/right rune text panels
*/
export default function IronManBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    /* ── Lightning particle canvas ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;

        let W = window.innerWidth, H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;

        const resize = () => {
            W = window.innerWidth; H = window.innerHeight;
            canvas.width = W; canvas.height = H;
        };
        window.addEventListener("resize", resize);

        type Particle = {
            x: number; y: number; vx: number; vy: number;
            size: number; alpha: number; color: string;
            life: number; maxLife: number;
        };

        // Custom palette — crimson, cyan, cream, steel
        const COLORS = [
            "rgba(131,226,246,",   // electric cyan
            "rgba(162,186,190,",   // steel blue-gray
            "rgba(232,234,199,",   // warm cream (rare)
            "rgba(138,32,48,",     // crimson glow (rare)
            "rgba(91,189,212,",    // deeper cyan
        ];

        const particles: Particle[] = [];

        const spawn = () => {
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            particles.push({
                x: Math.random() * W,
                y: H + 10,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 0.8 - 0.3,
                size: Math.random() * 1.8 + 0.4,
                alpha: 0,
                color,
                life: 0,
                maxLife: Math.random() * 180 + 120,
            });
        };

        for (let i = 0; i < 100; i++) spawn();

        let frame = 0;
        let raf: number;

        const draw = () => {
            ctx.clearRect(0, 0, W, H);
            frame++;

            if (frame % 5 === 0 && particles.length < 140) spawn();

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life++;
                p.x += p.vx;
                p.y += p.vy;

                const progress = p.life / p.maxLife;
                p.alpha = progress < 0.15
                    ? progress / 0.15
                    : progress > 0.75
                        ? (1 - progress) / 0.25
                        : 1;

                if (p.life >= p.maxLife || p.y < -10) {
                    particles.splice(i, 1);
                    continue;
                }

                // Core dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${(p.alpha * 0.65).toFixed(2)})`;
                ctx.fill();
            }

            // Subtle horizontal lightning scan (very faint, blue)
            const scanY = ((frame * 0.4) % H);
            const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 2);
            scanGrad.addColorStop(0, "rgba(96,165,250,0)");
            scanGrad.addColorStop(0.8, "rgba(96,165,250,0.015)");
            scanGrad.addColorStop(1, "rgba(96,165,250,0.04)");
            ctx.fillStyle = scanGrad;
            ctx.fillRect(0, scanY - 40, W, 42);

            raf = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <>
            {/* ── Canvas: drifting sparks ── */}
            <canvas
                ref={canvasRef}
                style={{
                    position: "fixed", inset: 0,
                    width: "100%", height: "100%",
                    pointerEvents: "none", zIndex: 0,
                }}
            />

            {/* ── Storm gradient mesh ── */}
            <div style={{
                position: "fixed", inset: 0,
                background: `
                  radial-gradient(ellipse 70% 60% at 15% 20%, rgba(29,78,216,0.12) 0%, transparent 65%),
                  radial-gradient(ellipse 55% 50% at 85% 75%, rgba(109,40,217,0.08) 0%, transparent 60%),
                  radial-gradient(ellipse 45% 40% at 50% 50%, rgba(30,58,138,0.10) 0%, transparent 55%),
                  radial-gradient(ellipse 80% 70% at 80% 10%, rgba(96,165,250,0.05) 0%, transparent 60%)
                `,
                pointerEvents: "none", zIndex: 0,
            }} />

            {/* ── Diagonal rune-grid overlay ── */}
            <div style={{
                position: "fixed", inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px)
                `,
                backgroundSize: "70px 70px",
                pointerEvents: "none", zIndex: 0,
                maskImage: "radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 100%)",
                WebkitMaskImage: "radial-gradient(ellipse 75% 75% at 50% 50%, black 30%, transparent 100%)",
            }} />

            {/* ── Corner Mjolnir brackets ── */}
            {/* Top-left */}
            <div style={{ position: "fixed", top: 88, left: 18, pointerEvents: "none", zIndex: 1 }}>
                <div style={{ width: 36, height: 36, borderTop: "2px solid rgba(96,165,250,0.3)", borderLeft: "2px solid rgba(96,165,250,0.3)", borderRadius: "4px 0 0 0" }} />
            </div>
            {/* Top-right */}
            <div style={{ position: "fixed", top: 88, right: 18, pointerEvents: "none", zIndex: 1 }}>
                <div style={{ width: 36, height: 36, borderTop: "2px solid rgba(251,191,36,0.25)", borderRight: "2px solid rgba(251,191,36,0.25)", borderRadius: "0 4px 0 0" }} />
            </div>
            {/* Bottom-left */}
            <div style={{ position: "fixed", bottom: 18, left: 18, pointerEvents: "none", zIndex: 1 }}>
                <div style={{ width: 36, height: 36, borderBottom: "2px solid rgba(96,165,250,0.2)", borderLeft: "2px solid rgba(96,165,250,0.2)", borderRadius: "0 0 0 4px" }} />
            </div>
            {/* Bottom-right */}
            <div style={{ position: "fixed", bottom: 18, right: 18, pointerEvents: "none", zIndex: 1 }}>
                <div style={{ width: 36, height: 36, borderBottom: "2px solid rgba(251,191,36,0.2)", borderRight: "2px solid rgba(251,191,36,0.2)", borderRadius: "0 0 4px 0" }} />
            </div>

            {/* ── Left rune readout ── */}
            <div style={{
                position: "fixed", left: 14, top: "50%", transform: "translateY(-50%)",
                pointerEvents: "none", zIndex: 1,
                display: "flex", flexDirection: "column", gap: 7,
                opacity: 0.18,
            }}>
                {["ODIN PROTOCOL", "BIFROST: LOCKED", "MJOLNIR: WORTHY", "ASGARD: ONLINE", "THUNDER: READY"].map((txt, i) => (
                    <div key={txt} style={{
                        fontSize: 9, fontFamily: "monospace",
                        color: i % 2 === 0 ? "#60A5FA" : "#FBB724",
                        letterSpacing: "0.15em",
                        animation: `blink ${2 + i * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                    }}>{txt}</div>
                ))}
            </div>

            {/* ── Right rune readout ── */}
            <div style={{
                position: "fixed", right: 14, top: "50%", transform: "translateY(-50%)",
                pointerEvents: "none", zIndex: 1,
                display: "flex", flexDirection: "column", gap: 7, alignItems: "flex-end",
                opacity: 0.18,
            }}>
                {["SHIELD: RAISED", "LIGHTNING: 100%", "REALM: SECURED", "POWER: DIVINE", "STATUS: WORTHY"].map((txt, i) => (
                    <div key={txt} style={{
                        fontSize: 9, fontFamily: "monospace",
                        color: i % 2 === 0 ? "#A78BFA" : "#60A5FA",
                        letterSpacing: "0.15em",
                        animation: `blink ${2.5 + i * 0.4}s ease-in-out infinite`,
                        animationDelay: `${i * 0.6 + 0.3}s`,
                    }}>{txt}</div>
                ))}
            </div>
        </>
    );
}

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
                    pointerEvents: "none", zIndex: -1,
                }}
            />

            {/* ── Background vignette/mesh ── */}
            <div style={{
                position: "fixed", inset: 0,
                background: `
                  radial-gradient(ellipse 70% 60% at 15% 20%, rgba(103,23,34,0.2) 0%, transparent 65%),
                  radial-gradient(ellipse 55% 50% at 85% 75%, rgba(131,226,246,0.15) 0%, transparent 60%),
                  radial-gradient(ellipse 45% 40% at 50% 50%, rgba(22,31,46,0.4) 0%, transparent 55%),
                  radial-gradient(ellipse 80% 70% at 80% 10%, rgba(131,226,246,0.1) 0%, transparent 60%)
                `,
                pointerEvents: "none", zIndex: -1,
            }} />

            {/* ── Diagonal rune-grid overlay ── */}
            <div style={{
                position: "fixed", inset: 0,
                backgroundImage: `
                  linear-gradient(rgba(131,226,246,0.08) 1.5px, transparent 1.5px),
                  linear-gradient(90deg, rgba(131,226,246,0.08) 1.5px, transparent 1.5px)
                `,
                backgroundSize: "90px 90px",
                pointerEvents: "none", zIndex: -1,
                maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 10%, transparent 95%)",
                WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 10%, transparent 95%)",
                opacity: 0.5,
            }} />

            {/* ── Corner accents ── */}
            {/* Top-left */}
            <div style={{ position: "fixed", top: 80, left: 16, pointerEvents: "none", zIndex: -1 }}>
                <div style={{ width: 40, height: 40, borderTop: "2px solid rgba(131,226,246,0.25)", borderLeft: "2px solid rgba(131,226,246,0.25)", borderRadius: "6px 0 0 0" }} />
            </div>
            {/* Top-right */}
            <div style={{ position: "fixed", top: 80, right: 16, pointerEvents: "none", zIndex: -1 }}>
                <div style={{ width: 40, height: 40, borderTop: "2px solid rgba(103,23,34,0.3)", borderRight: "2px solid rgba(103,23,34,0.3)", borderRadius: "0 6px 0 0" }} />
            </div>
            {/* Bottom-left */}
            <div style={{ position: "fixed", bottom: 16, left: 16, pointerEvents: "none", zIndex: -1 }}>
                <div style={{ width: 40, height: 40, borderBottom: "2px solid rgba(103,23,34,0.2)", borderLeft: "2px solid rgba(103,23,34,0.2)", borderRadius: "0 0 0 6px" }} />
            </div>
            {/* Bottom-right */}
            <div style={{ position: "fixed", bottom: 16, right: 16, pointerEvents: "none", zIndex: -1 }}>
                <div style={{ width: 40, height: 40, borderBottom: "2px solid rgba(131,226,246,0.25)", borderRight: "2px solid rgba(131,226,246,0.25)", borderRadius: "0 0 6px 0" }} />
            </div>

            {/* ── Side text panels ── */}
            <div style={{
                position: "fixed", left: 12, top: "55%", transform: "translateY(-50%)",
                pointerEvents: "none", zIndex: -1,
                display: "flex", flexDirection: "column", gap: 8,
                opacity: 0.2,
            }}>
                {["CRIMSON PROTOCOL", "CYAN: ENGAGED", "WORTHY: TRUE", "CORES: OPTIMAL", "SYSTEM: ARMORED"].map((txt, i) => (
                    <div key={txt} style={{
                        fontSize: 9, fontFamily: "monospace",
                        color: i % 2 === 0 ? "#671722" : "#83e2f6",
                        letterSpacing: "0.2em",
                        animation: `blink ${3 + i * 0.5}s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                    }}>{txt}</div>
                ))}
            </div>

            <div style={{
                position: "fixed", right: 12, top: "55%", transform: "translateY(-50%)",
                pointerEvents: "none", zIndex: -1,
                display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end",
                opacity: 0.2,
            }}>
                {["REACTIVE ARMOR", "STEEL: REINFORCED", "OUTPUT: DIVINE", "TEMP: STABLE", "STATUS: ACTIVE"].map((txt, i) => (
                    <div key={txt} style={{
                        fontSize: 9, fontFamily: "monospace",
                        color: i % 2 === 0 ? "#a2babe" : "#83e2f6",
                        letterSpacing: "0.2em",
                        animation: `blink ${3.5 + i * 0.4}s ease-in-out infinite`,
                        animationDelay: `${i * 0.6 + 0.3}s`,
                    }}>{txt}</div>
                ))}
            </div>
        </>
    );
}

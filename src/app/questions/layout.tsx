"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function QuestionsLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.push("/auth/login");
    }, [user, loading, router]);

    if (loading || !user) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12, background: "var(--bg)" }}>
            <div className="spinner" />
            <span style={{ color: "var(--text-muted)" }}>Loading…</span>
        </div>
    );

    return <>{children}</>;
}

"use client";
import { Suspense } from "react";

export default function TestStartLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div style={{padding:40,textAlign:"center",color:"#94a3b8"}}>Loading…</div>}>{children}</Suspense>;
}

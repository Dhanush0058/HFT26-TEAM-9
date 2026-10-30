"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { BookOpen, Shield, Cpu, Activity, AlertCircle } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex font-sans">
      <Sidebar currentTab="docs" />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader title="Documentation & Methodology" showSearchAndFilter={false} />

        <main className="flex-1 w-full px-6 sm:px-8 py-6 max-w-4xl space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <BookOpen className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-900">Rekishi Forensics Architecture</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rekishi is a digital collision forensics framework designed to address incomplete dashcam coverage, contradictory witness statements, and unaligned sensor telemetry.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-md border border-slate-100 bg-slate-50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Cpu className="w-4 h-4 text-blue-600" /> Multimodal AI Pipeline
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Utilizes <strong>Featherless Vision (Qwen2-VL)</strong> for video keyframe extraction and <strong>Groq Whisper + Llama 3.3</strong> for sub-second audio transcription and contradiction reasoning.
                </p>
              </div>

              <div className="p-4 rounded-md border border-slate-100 bg-slate-50 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Activity className="w-4 h-4 text-emerald-600" /> 3D Trajectory Engine
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Interpolates discrete vision and sensor coordinates into smooth cubic splines, rendered in WebGL (Three.js) synchronized to a millisecond timeline scrubber.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-md flex gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Forensic Traceability Notice:</strong> Rekishi distinguishes direct physical observations from probabilistic inferences. Conclusions communicate explicit confidence metrics rather than definitive legal determinations.
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


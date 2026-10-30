"use client";

import React from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  AlertTriangle, 
  CheckCircle2, 
  Video, 
  Mic, 
  Activity, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  BrainCircuit
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { INITIAL_CASES } from "./data";

export default function DashboardMetricsPage() {
  const totalCases = 24;
  const activeCases = INITIAL_CASES.length;
  const flaggedContradictions = 7;
  const avgConfidence = 89.4;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex font-sans">
      
      {/* Sidebar with 4 clean navigation items */}
      <Sidebar currentTab="dashboard" casesCount={activeCases} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <TopHeader title="Forensic Dashboard" showSearchAndFilter={false} />

        {/* Dashboard Analytics View */}
        <main className="flex-1 w-full px-6 sm:px-8 py-6 max-w-6xl space-y-6">
          
          {/* ─────────────────────────────────────────────────────────
              A. TOP KPI METRICS ROW (The Big Numbers)
          ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Cases */}
            <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Cases</span>
                <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">{totalCases}</span>
                <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +12% this mo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Archived & historical files</p>
            </div>

            {/* Card 2: Active Cases */}
            <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active Investigations</span>
                <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">{activeCases}</span>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  Live Intake
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Under active reconstruction</p>
            </div>

            {/* Card 3: Contradictions Flagged */}
            <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Contradictions Flagged</span>
                <div className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-rose-600">{flaggedContradictions}</span>
                <span className="text-[11px] font-medium text-rose-500">
                  Needs review
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Witness vs Video discrepancies</p>
            </div>

            {/* Card 4: Reconstruction Confidence */}
            <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Avg. AI Confidence</span>
                <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">{avgConfidence}%</span>
                <span className="text-[11px] font-medium text-emerald-600">
                  High certainty
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Calculated across 42 streams</p>
            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────
              B. ANALYTICAL BREAKDOWNS (Charts & Diagnostic Insights)
          ───────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Box 1: Evidence Ingestion Distribution */}
            <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Multi-Source Evidence Mix
                </h2>
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  48 Total Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Proportion of digital evidence ingested across active and closed accident dossiers.
              </p>

              {/* Progress bars showing distribution */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Video className="w-3.5 h-3.5 text-blue-600" /> Dashcam & CCTV Video
                    </span>
                    <span className="font-bold text-slate-900">46% (22 files)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "46%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Mic className="w-3.5 h-3.5 text-sky-500" /> Witness Audio Statements
                    </span>
                    <span className="font-bold text-slate-900">33% (16 files)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: "33%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <Activity className="w-3.5 h-3.5 text-indigo-500" /> CAN Bus & OBD-II Telemetry
                    </span>
                    <span className="font-bold text-slate-900">21% (10 logs)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "21%" }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Contradiction & Discrepancy Breakdown */}
            <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Discrepancy Severity Matrix
                </h2>
                <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  Groq LLM Reasoner
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                AI cross-correlation between witness testimony and physical ground-truth recordings.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-rose-900">Traffic Signal Violations</div>
                    <div className="text-[11px] text-rose-600">Disproved witness red/green claims</div>
                  </div>
                  <span className="text-base font-extrabold text-rose-700">4</span>
                </div>

                <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-900">Speed & Braking Estimates</div>
                    <div className="text-[11px] text-amber-600">Disagreements with sensor curves</div>
                  </div>
                  <span className="text-base font-extrabold text-amber-700">2</span>
                </div>

                <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Verified Direct Alignments</div>
                    <div className="text-[11px] text-emerald-600">Corroborated across 2+ sources</div>
                  </div>
                  <span className="text-base font-extrabold text-emerald-700">18</span>
                </div>
              </div>
            </div>

            {/* Box 3: Recent AI Forensic Activity Log */}
            <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Forensic Pipeline Feed
                </h2>
                <BrainCircuit className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Live stream of automated multimodal extractions and synchronization passes.
              </p>

              <div className="space-y-3">
                <div className="flex gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">CASE-101:</span>
                    <span className="text-slate-600"> Featherless VLM parsed 14 keyframes from dashcam.</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">3 mins ago</div>
                  </div>
                </div>

                <div className="flex gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">CASE-101:</span>
                    <span className="text-slate-600"> Groq Whisper transcribed witness audio in 0.72s.</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">7 mins ago</div>
                  </div>
                </div>

                <div className="flex gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">CASE-101:</span>
                    <span className="text-slate-600"> Contradiction flagged at timestamp 14:02:10.</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">11 mins ago</div>
                  </div>
                </div>

                <div className="flex gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                  <div>
                    <span className="font-semibold text-slate-900">CASE-102:</span>
                    <span className="text-slate-600"> 3D spline trajectory generated (84 coordinate steps).</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">25 mins ago</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick link button to Cases */}
          <div className="p-4 bg-blue-50/80 border border-blue-200/80 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-xs font-bold text-slate-900">Ready to examine or create collision files?</span>
                <p className="text-[11px] text-slate-500">Open the Cases ledger to review evidence files or run 3D trajectory simulations.</p>
              </div>
            </div>
            <Link
              href="/cases"
              className="text-xs font-semibold px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-2xs flex items-center gap-1"
            >
              Go to Cases <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </main>
      </div>

    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { 
  Cpu, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  Save,
  Lock,
  Database,
  HardDrive,
  Terminal,
  Check
} from "lucide-react";

export default function SettingsPage() {
  const [sensitivity, setSensitivity] = useState("high");
  const [autoExtract, setAutoExtract] = useState(true);
  const [timeFormat, setTimeFormat] = useState("dual");
  const [auditLogging, setAuditLogging] = useState(true);
  const [confidenceFloor, setConfidenceFloor] = useState("75");
  const [isSaved, setIsSaved] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    bucket: string;
    supabaseUrl: string | null;
    status: string;
  } | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/supabase/status")
      .then((r) => r.json())
      .then((data) => setSupabaseStatus(data))
      .catch(() => {});
  }, []);

  const handleCopySqlNotice = () => {
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex font-sans">
      <Sidebar currentTab="settings" />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader title="System & Forensic Preferences" showSearchAndFilter={false} />

        <main className="flex-1 w-full px-6 sm:px-8 py-6 max-w-4xl space-y-6">
          
          {/* Block 1: Forensic Engine Status (Internal Config Secured) */}
          <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" /> Forensic Intelligence Engine
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-modal neural pipeline status and internal backend connectivity.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vision Pipeline</div>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Featherless VLM
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Internal Config
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Audio STT</div>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Groq Whisper-v3
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Internal Config
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Reasoner Core</div>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Llama 3.3 70B
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Internal Config
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">3D Physics</div>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> SciPy Spline Engine
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Active & Local</div>
              </div>
            </div>
          </div>

          {/* Block 1.5: Supabase Cloud Database & Storage */}
          <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" /> Supabase Cloud Database & Storage
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  PostgreSQL relational tables and Object Storage bucket for digital evidence assets.
                </p>
              </div>
              {supabaseStatus?.connected ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Awaiting Keys in backend/.env
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Database Status</div>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  {supabaseStatus?.connected ? "PostgreSQL Connected" : "Local In-Memory Cache (Active)"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {supabaseStatus?.supabaseUrl || "Tables: cases, evidence_records, timeline"}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Storage Bucket</div>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                  {supabaseStatus?.bucket || "evidence-media"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Videos, Images, Documents, Sensors</div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">SQL Migration</div>
                <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  supabase_schema.sql
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ready for Supabase SQL Editor</div>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
                <span>Setup Guide: Execute SQL Schema in Supabase Dashboard</span>
                <span className="text-emerald-400 text-[10px]">supabase_schema.sql</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                1. Open your Supabase Dashboard &rarr; <strong>SQL Editor</strong> &rarr; <strong>New query</strong>.<br />
                2. Copy & paste the contents of <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">supabase_schema.sql</code> and click <strong>Run</strong>.<br />
                3. Paste your project URL & Anon Key into <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">backend/.env</code> (<span className="text-slate-400">SUPABASE_URL</span> &amp; <span className="text-slate-400">SUPABASE_KEY</span>).
              </p>
            </div>
          </div>

          {/* Block 2: Forensic Analysis Preferences */}
          <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" /> Analysis & Extraction Protocols
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure how Rekishi ingests sources, analyzes contradictions, and synchronizes dual timelines.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              
              {/* Contradiction Sensitivity */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Contradiction Detection Sensitivity
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Threshold for flagging discrepancies between witness recollections and sensor/dashcam records.
                  </p>
                </div>
                <select
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  className="h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="high">High (Flag all potential deviations)</option>
                  <option value="standard">Standard (Flag high-certainty conflicts)</option>
                  <option value="conservative">Conservative (Physical violations only)</option>
                </select>
              </div>

              {/* Auto Metadata Extraction */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Automatic Metadata & Timestamp Extraction
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Immediately parse file headers and EXIF/video timestamps upon evidence upload.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoExtract}
                    onChange={(e) => setAutoExtract(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Dual Timeline Display Mode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Timeline Coordinate Representation
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Controls presentation of Accident Event Timeline vs System Evidence Upload Timeline.
                  </p>
                </div>
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="dual">Dual Timelines (Accident Event + Upload Time)</option>
                  <option value="event">Event-Centric (Normalized T+Seconds)</option>
                  <option value="system">System Ledger (Date & Time Ordered)</option>
                </select>
              </div>

              {/* Minimum Confidence Floor */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Minimum Inference Confidence Floor (%)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Inferences below this threshold are marked as uncertain hypotheses.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={confidenceFloor}
                    onChange={(e) => setConfidenceFloor(e.target.value)}
                    className="w-16 h-8 px-2 text-xs bg-white border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 text-center"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>

              {/* Chain of Custody Audit Logging */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Chain of Custody & Audit Logging
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Maintain an unalterable forensic record of every file upload, extraction, and re-analysis pass.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={auditLogging}
                    onChange={(e) => setAuditLogging(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Preferences are maintained in active session configuration.
              </span>
              <button
                type="button"
                onClick={handleSave}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition flex items-center gap-1.5 shadow-2xs"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Preferences Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

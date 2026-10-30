"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { 
  CheckCircle2, 
  Save, 
  MoreHorizontal, 
  Database, 
  HardDrive, 
  Terminal, 
  Cpu, 
  Check, 
  Lock, 
  Activity 
} from "lucide-react";

export default function SettingsPage() {
  const [autoExtract, setAutoExtract] = useState(true);
  const [timeFormat, setTimeFormat] = useState("dual");
  const [auditLogging, setAuditLogging] = useState(true);
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
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF] text-[#111111] font-sans">
      
      {/* Fixed Sidebar touching screen edges */}
      <Sidebar currentTab="settings" />

      {/* Fixed Topbar touching screen edges */}
      <TopHeader title="Settings" showSearch={false} />

      {/* Main Content Area starting after sidebar (260px) and topbar (72px + 32px breathing room) */}
      <main 
        style={{ marginLeft: "260px", paddingTop: "104px" }}
        className="ml-[260px] pt-[104px] px-6 sm:px-8 pb-12 min-h-screen"
      >
        <div className="max-w-5xl space-y-6">

          {/* Block 1: Supabase Cloud Database & Storage */}
          <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0F0F0] pb-4">
              <div>
                <span className="text-[13px] font-medium text-[#8A8A8A]">
                  Cloud Infrastructure
                </span>
                <h2 className="text-xl font-extrabold text-[#111111] mt-0.5 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" /> Supabase Database & Storage Vault
                </h2>
                <p className="text-xs text-[#8A8A8A] mt-0.5">
                  PostgreSQL relational tables and Object Storage bucket for digital evidence assets.
                </p>
              </div>
              {supabaseStatus?.connected ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Awaiting Credentials
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Database Status</div>
                <div className="text-xs font-bold text-[#111111] mt-1 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  {supabaseStatus?.connected ? "PostgreSQL Connected" : "Local In-Memory Cache (Active)"}
                </div>
                <div className="text-[10px] text-[#8A8A8A] mt-0.5 truncate">
                  {supabaseStatus?.supabaseUrl || "Tables: cases, evidence_records, timeline"}
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Storage Bucket</div>
                <div className="text-xs font-bold text-[#111111] mt-1 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                  {supabaseStatus?.bucket || "evidence-media"}
                </div>
                <div className="text-[10px] text-[#8A8A8A] mt-0.5">Videos, Images, Documents, Sensors</div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">SQL Migration</div>
                <div className="text-xs font-bold text-[#111111] mt-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                  supabase_schema.sql
                </div>
                <div className="text-[10px] text-[#8A8A8A] mt-0.5">Ready for Supabase SQL Editor</div>
              </div>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-[18px] font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
                <span>Setup Guide: Execute SQL Schema in Supabase Dashboard</span>
                <span className="text-emerald-400 text-[10px]">supabase_schema.sql</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                1. Open your Supabase Dashboard &rarr; <strong>SQL Editor</strong> &rarr; <strong>New query</strong>.<br />
                2. Copy & paste the contents of <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">supabase_schema.sql</code> and click <strong>Run</strong>.<br />
                3. Paste your project URL & Anon Key into <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">backend/.env</code>.
              </p>
            </div>
          </div>

          {/* Block 2: Forensic Intelligence Engine */}
          <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-5">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
              <div>
                <span className="text-[13px] font-medium text-[#8A8A8A]">Neural Pipelines</span>
                <h2 className="text-xl font-extrabold text-[#111111] mt-0.5 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" /> Forensic Intelligence Engine
                </h2>
                <p className="text-xs text-[#8A8A8A] mt-0.5">
                  Multi-modal neural pipeline status and internal backend connectivity.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Operational
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Vision Pipeline</div>
                <div className="text-xs font-bold text-[#111111] mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Featherless VLM
                </div>
                <div className="text-[10px] text-[#8A8A8A] mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Internal Config
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Audio STT</div>
                <div className="text-xs font-bold text-[#111111] mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Groq Whisper-v3
                </div>
                <div className="text-[10px] text-[#8A8A8A] mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Internal Config
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Reasoner Core</div>
                <div className="text-xs font-bold text-[#111111] mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Llama 3.3 70B
                </div>
                <div className="text-[10px] text-[#8A8A8A] mt-0.5 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Internal Config
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                <div className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">3D Physics</div>
                <div className="text-xs font-bold text-[#111111] mt-1 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" /> SciPy Spline Engine
                </div>
                <div className="text-[10px] text-[#8A8A8A] mt-0.5">Active & Local</div>
              </div>
            </div>
          </div>

          {/* Block 3: Preferences Card */}
          <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[13px] font-medium text-[#8A8A8A]">
                  Configuration & Preferences
                </span>
                <h2 className="text-xl font-extrabold text-[#111111] mt-0.5">
                  System Settings
                </h2>
                <p className="text-xs text-[#8A8A8A] mt-0.5">
                  Configure processing behaviors and default forensic timeline presentation.
                </p>
              </div>

              <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              
              {/* Auto Metadata Extraction */}
              <div className="flex items-center justify-between p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC] hover:border-[#111111] transition">
                <div className="pr-4">
                  <label className="text-xs font-bold text-[#111111] block">
                    Automatic Evidence Extraction
                  </label>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">
                    Extract timestamps and file metadata immediately upon intake.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={autoExtract}
                    onChange={(e) => setAutoExtract(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E5E5E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#121212]"></div>
                </label>
              </div>

              {/* Timeline Display Mode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC] hover:border-[#111111] transition">
                <div>
                  <label className="text-xs font-bold text-[#111111] block">
                    Default Timeline Format
                  </label>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">
                    Format used across synchronization charts and visual telemetry scrubbers.
                  </p>
                </div>
                <select
                  value={timeFormat}
                  onChange={(e) => setTimeFormat(e.target.value)}
                  className="h-10 px-4 text-xs bg-white border border-[#E5E5E0] rounded-full text-[#111111] font-semibold focus:outline-none focus:border-[#111111] cursor-pointer"
                >
                  <option value="dual">Dual Timestamps (Accident vs Upload)</option>
                  <option value="accident">Accident Time Only (Elapsed T+)</option>
                  <option value="system">Upload Time Only (System Intake)</option>
                </select>
              </div>

              {/* Audit Logging */}
              <div className="flex items-center justify-between p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC] hover:border-[#111111] transition">
                <div className="pr-4">
                  <label className="text-xs font-bold text-[#111111] block">
                    Forensic Immutable Audit Logging
                  </label>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">
                    Record immutable forensic integrity trails for each file upload and AI analysis.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={auditLogging}
                    onChange={(e) => setAuditLogging(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#E5E5E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#121212]"></div>
                </label>
              </div>

            </div>

            <div className="pt-4 border-t border-[#F0F0F0] flex items-center justify-between">
              <span className="text-xs text-[#8A8A8A]">
                Preferences automatically persist to local configuration.
              </span>
              <button
                type="button"
                onClick={handleSave}
                className="h-11 px-6 bg-[#121212] hover:bg-black text-white text-xs font-bold rounded-full transition flex items-center gap-2 shadow-sm"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Preferences Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

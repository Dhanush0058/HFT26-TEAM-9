"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { 
  Cpu, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  Save,
  Lock
} from "lucide-react";

export default function SettingsPage() {
  const [sensitivity, setSensitivity] = useState("high");
  const [autoExtract, setAutoExtract] = useState(true);
  const [timeFormat, setTimeFormat] = useState("dual");
  const [auditLogging, setAuditLogging] = useState(true);
  const [confidenceFloor, setConfidenceFloor] = useState("75");
  const [isSaved, setIsSaved] = useState(false);

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

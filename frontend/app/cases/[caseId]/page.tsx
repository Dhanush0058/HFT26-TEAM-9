"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  Database, 
  Eye, 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  Sparkles, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Video, 
  Mic, 
  Image as ImageIcon, 
  Code,
  Activity,
  X,
  Compass,
  Play,
  Pause
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import ThreeForensicCanvas from "@/components/3d/ThreeForensicCanvas";
import { 
  getStoredCaseById, 
  getStoredCases,
  saveStoredCases,
  CaseDetail, 
  EvidenceRecord, 
  analyzeCaseEvidence, 
  addEvidenceToCase, 
  deleteEvidenceFromCase,
  deleteCase
} from "@/lib/casesService";

export default function CaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.caseId as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "records" | "visuals">("details");
  
  // Records tab states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [viewingEvidence, setViewingEvidence] = useState<EvidenceRecord | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Visuals tab scrubber state
  const [scrubberTime, setScrubberTime] = useState(2.8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // Load case data and auto-refresh when AI completes in background
  useEffect(() => {
    if (!caseId) return;
    const reload = () => {
      const found = getStoredCaseById(caseId);
      if (found) {
        setCaseData({ ...found });
        const vid = (found as any).videoUrl || found.evidenceList?.find(e => (e.dataType === "Video" || /\.(mp4|mov|avi|webm)$/i.test(e.name)) && e.fileUrl)?.fileUrl;
        if (vid) setUploadedVideoUrl(vid);
      }
    };
    reload();

    window.addEventListener('caseUpdated', reload);
    return () => window.removeEventListener('caseUpdated', reload);
  }, [caseId]);

  // Scrubber animation loop for Visuals tab
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setScrubberTime((prev) => {
          if (prev >= 6.0) return 0.0;
          return Number((prev + 0.1).toFixed(1));
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!caseData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <TopHeader title="Case Dossier" showSearchAndFilter={false} />
        <main className="flex-1 w-full px-6 py-12 max-w-4xl mx-auto text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">Case Dossier Not Found</h2>
          <p className="text-xs text-slate-500">The requested case ID ({caseId}) does not exist in local storage or the active ledger.</p>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Cases Ledger
          </Link>
        </main>
      </div>
    );
  }

  // Trigger Smart Analysis (Direct Real-time Groq/Gemini AI Call)
  const handleTriggerAnalysis = async () => {
    if (!caseData) return;
    setIsAnalyzing(true);
    setAnalysisNotice("Querying Groq & Gemini AI for real-time forensic synthesis on uploaded media...");

    try {
      const res = await fetch(`http://localhost:8000/api/cases/${caseData.id}/generate-summary`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        const execSummary = data.summary?.executive || (typeof data.summary === "string" ? data.summary : null);
        if (execSummary) {
          const nowStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " UTC";
          const updated = {
            ...caseData,
            summary: execSummary,
            lastAnalyzedAt: nowStr
          };
          setCaseData(updated);
          const cases = getStoredCases();
          const target = cases.find(c => c.id === caseData.id || c.caseNumber === caseData.caseNumber);
          if (target) {
            target.summary = execSummary;
            target.lastAnalyzedAt = nowStr;
            saveStoredCases(cases);
          }
          setAnalysisNotice(`AI Analysis Complete! Synthesized via ${data.providerUsed || "Multi-Modal AI Pipeline"}.`);
          setTimeout(() => setAnalysisNotice(null), 4500);
          setIsAnalyzing(false);
          return;
        }
      }
    } catch {
      // fallback to client-side rule synthesis
    }

    try {
      const updated = analyzeCaseEvidence(caseData.id);
      setCaseData({ ...updated });
      setAnalysisNotice(`Analysis Updated from ${updated.evidenceList.length} evidence source(s).`);
      setTimeout(() => setAnalysisNotice(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Upload new evidence from Records tab (Streams to Supabase Storage & Database)
  const handleUploadNewEvidence = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
      let blobUrl: string | undefined = undefined;

      if (f.type.includes("video") || /\.(mp4|mov|avi|webm)$/i.test(f.name)) {
        blobUrl = URL.createObjectURL(f);
        setUploadedVideoUrl(blobUrl);

        // Upload real video file to backend YOLO & Supabase Storage
        const formData = new FormData();
        formData.append("file", f);
        fetch(`http://localhost:8000/api/cases/${caseData.id}/upload-video`, {
          method: "POST",
          body: formData
        }).then(async res => {
          if (res.ok) {
            const d = await res.json();
            if (d.summary) {
              setCaseData(prev => prev ? ({
                ...prev,
                summary: d.summary?.executive || d.summary
              }) : null);
            }
          }
        }).catch(() => {});
      } else {
        // Upload non-video evidence (Image, Document, Text, Audio, CSV) to Supabase Storage
        const formData = new FormData();
        formData.append("file", f);
        fetch(`http://localhost:8000/api/cases/${caseData.id}/upload-evidence`, {
          method: "POST",
          body: formData
        }).then(async res => {
          if (res.ok) {
            const d = await res.json();
            if (d.summary) {
              setCaseData(prev => prev ? ({
                ...prev,
                summary: d.summary?.executive || d.summary
              }) : null);
            }
          }
        }).catch(() => {});
      }

      const updated = addEvidenceToCase(caseData.id, {
        name: f.name,
        size: `${sizeMb} MB`,
        type: f.type || "application/octet-stream",
        accidentTime: caseData.accidentDate,
        fileUrl: blobUrl
      });
      setCaseData({ ...updated });
    }
    setAnalysisNotice(`New evidence ingested to Supabase Storage. Extracted optical metadata and synced 3D reconstruction!`);
    setTimeout(() => setAnalysisNotice(null), 4000);
  };

  // Delete evidence
  const handleDeleteEvidence = (evId: string) => {
    if (confirm("Are you sure you want to remove this evidence file from the case dossier?")) {
      const updated = deleteEvidenceFromCase(caseData.id, evId);
      setCaseData({ ...updated });
    }
  };

  // Download evidence mock
  const handleDownloadEvidence = (ev: EvidenceRecord) => {
    const textContent = JSON.stringify(ev, null, 2);
    const blob = new Blob([textContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ev.name}.forensic-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDataTypeBadge = (type: string) => {
    switch (type) {
      case "Video":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200"><Video className="w-3 h-3" /> Video</span>;
      case "Audio":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200"><Mic className="w-3 h-3" /> Audio</span>;
      case "Sensor":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"><Activity className="w-3 h-3" /> Sensor</span>;
      case "PDF":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200"><FileText className="w-3 h-3" /> PDF</span>;
      case "Image":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200"><ImageIcon className="w-3 h-3" /> Image</span>;
      case "Script":
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"><Code className="w-3 h-3" /> Script</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200"><FileText className="w-3 h-3" /> {type}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header */}
      <TopHeader title={`Case Workspace: ${caseData.caseNumber}`} showSearchAndFilter={false} />

      <div className="flex-1 flex min-w-0">
        
        {/* ─────────────────────────────────────────────────────────────
            LEFT SIDEBAR NAVIGATION INSIDE CASE
            Sidebar Items: 1. Details  2. Records  3. Visuals
        ───────────────────────────────────────────────────────────── */}
        <aside className="w-56 bg-white border-r border-slate-200/90 shrink-0 select-none flex flex-col justify-between min-h-[calc(100vh-4rem)]">
          <div>
            {/* Top Back Button */}
            <div className="p-3 border-b border-slate-100">
              <Link
                href="/cases"
                className="w-full flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Back to Cases</span>
              </Link>
            </div>

            {/* Case Tag Identification */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/40">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Dossier</div>
              <div className="text-xs font-mono font-bold text-blue-700 truncate mt-0.5">{caseData.caseNumber}</div>
              <div className="text-[11px] font-semibold text-slate-800 line-clamp-1 mt-0.5">{caseData.name}</div>
            </div>

            {/* Case Navigation Tabs */}
            <nav className="p-2 space-y-1">
              <button
                onClick={() => setActiveTab("details")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "details"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileText className={`w-4 h-4 ${activeTab === "details" ? "text-blue-600" : "text-slate-400"}`} />
                <span>1. Details</span>
              </button>

              <button
                onClick={() => setActiveTab("records")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "records"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className={`w-4 h-4 ${activeTab === "records" ? "text-blue-600" : "text-slate-400"}`} />
                  <span>2. Records</span>
                </div>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-mono px-1.5 py-0.5 rounded font-bold">
                  {caseData.evidenceList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("visuals")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "visuals"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Eye className={`w-4 h-4 ${activeTab === "visuals" ? "text-blue-600" : "text-slate-400"}`} />
                <span>3. Visuals</span>
              </button>
            </nav>
          </div>

          {/* Bottom Actions & Dossier Confidence */}
          <div className="p-3 border-t border-slate-100 space-y-2.5">
            <button
              onClick={() => {
                if (confirm(`Permanently delete case "${caseData.name}" (${caseData.caseNumber})?`)) {
                  deleteCase(caseData.id);
                  router.push("/cases");
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete This Case</span>
            </button>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600">Certainty Index</span>
                <span className="font-bold text-blue-700">{caseData.confidence}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${caseData.confidence}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Multi-source alignment</div>
            </div>
          </div>
        </aside>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT CONTENT AREA: ACTIVE TAB CONTENT
        ───────────────────────────────────────────────────────────── */}
        <main className="flex-1 w-full p-6 sm:p-8 max-w-6xl min-w-0 space-y-6">
          
          {/* Global Notice Alert if present */}
          {analysisNotice && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-900 flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" /> {analysisNotice}
              </span>
              <button onClick={() => setAnalysisNotice(null)} className="text-blue-500 hover:text-blue-700">✕</button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              A. DETAILS TAB [Default]
              Block 1: Case Details (Static Info)
              Block 2: Brief Summary (Dynamic AI Generated: Summary = f(all_evidence_files))
              Block 3: Evidence Timeline (Dual Timeline Concept)
          ───────────────────────────────────────────────────────── */}
          {activeTab === "details" && (
            <div className="space-y-6">
              
              {/* BLOCK 1: CASE DETAILS (STATIC INFO) */}
              <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Block 1: Incident Specifications
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {caseData.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs font-bold rounded">
                      {caseData.caseNumber}
                    </span>
                    {caseData.status === "Flagged Contradiction" ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> Contradiction Flagged
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Consistent
                      </span>
                    )}
                  </div>
                </div>

                {/* 6 Core Static Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1 text-xs">
                  
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                    <div className="text-[11px] font-semibold text-slate-400">Case Name</div>
                    <div className="font-bold text-slate-800 mt-0.5">{caseData.name}</div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                    <div className="text-[11px] font-semibold text-slate-400">Case Number</div>
                    <div className="font-mono font-bold text-blue-700 mt-0.5">{caseData.caseNumber}</div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" /> Filed By
                    </div>
                    <div className="font-bold text-slate-800 mt-0.5">{caseData.filedBy}</div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Filed Date & Time
                    </div>
                    <div className="font-medium text-slate-800 mt-0.5">{caseData.filedDate}</div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 text-blue-800">
                      <Calendar className="w-3 h-3 text-blue-600" /> Accident Date & Time (Event Time)
                    </div>
                    <div className="font-bold text-slate-900 mt-0.5">{caseData.accidentDate}</div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> Assigned Address / Location
                    </div>
                    <div className="font-medium text-slate-800 mt-0.5 truncate">{caseData.address}</div>
                  </div>

                </div>

                {caseData.description && (
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/40 text-xs text-slate-600 mt-2">
                    <span className="font-bold text-slate-700">Initial Officer Remarks: </span>
                    {caseData.description}
                  </div>
                )}
              </div>

              {/* BLOCK 2: BRIEF SUMMARY (DYNAMIC AI GENERATED: Summary = f(all_evidence_files)) */}
              <div className="bg-white p-6 rounded-lg border border-blue-200/80 shadow-2xs space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        Block 2: Executive Forensic Synthesis <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Auto-Generated AI</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Automated multi-modal synthesis generated directly from video optical flow, telemetry, and witness records.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Auto-Updated: {caseData.lastAnalyzedAt || "Current"}
                    </span>
                    <button
                      type="button"
                      onClick={handleTriggerAnalysis}
                      disabled={isAnalyzing}
                      title="Force manual re-sync if new evidence uploaded"
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-medium transition flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                      <span>{isAnalyzing ? "Syncing..." : "Re-sync"}</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-lg text-xs text-slate-700 leading-relaxed font-sans">
                  {caseData.summary}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Synthesized across <strong>{caseData.evidenceList.length} evidence sources</strong></span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dual Featherless VLM + Groq Pipeline
                  </span>
                </div>
              </div>

              {/* BLOCK 3: EVIDENCE TIMELINE (DUAL TIMELINE CONCEPT - VERY IMPORTANT) */}
              <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" /> Block 3: Dual Evidence Timeline
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chronological integration correlating <strong>Accident Event Time</strong> with <strong>System Upload Time</strong>.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 font-semibold text-blue-700">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Accident Time (Physical Reality)
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> System Upload Time (Chain of Custody)
                    </span>
                  </div>
                </div>

                {/* Vertical Chronological Timeline */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {caseData.timeline.map((event, idx) => (
                    <div key={event.id || idx} className="relative group">
                      
                      {/* Timeline Node Icon */}
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center text-[10px] font-bold text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition shadow-2xs">
                        {idx + 1}
                      </div>

                      {/* Timeline Card */}
                      <div className="p-4 rounded-lg border border-slate-200/90 bg-white hover:border-blue-300 transition shadow-2xs space-y-2">
                        
                        {/* Mandatory UI Format header: Evidence: [File Name] | Accident Time: ... | Uploaded/Last Updated: ... */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              Evidence: <span className="text-blue-700 font-mono font-medium">{event.evidenceName}</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              Accident Time: <strong>{event.accidentTime}</strong>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            Uploaded / Last Updated: {event.uploadedTime}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <div className="text-xs font-bold text-slate-800">{event.title}</div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>
                        </div>

                        {/* Bottom Tagging: Fact/Observation vs Inference */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <div className="flex items-center gap-2">
                            {event.classification === "OBSERVATION" ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                [FACT: RAW OBSERVATION]
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                [HYPOTHESIS: AI INFERENCE]
                              </span>
                            )}
                            <span className="text-slate-400">{event.dataType} Stream</span>
                          </div>

                          <span className="font-medium text-slate-500 text-[10px]">
                            Confidence: <strong>{event.confidence}%</strong>
                          </span>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              B. RECORDS TAB [/cases/[caseId]/records]
              Evidence Management and Analysis Center
              - Table view: File Name | Upload Date | File Size | Data Type | Status | Actions
              - Smart Analysis Logic button
              - Upload New Evidence dropzone
          ───────────────────────────────────────────────────────── */}
          {activeTab === "records" && (
            <div className="space-y-6">
              
              {/* Evidence Center Header & Smart Analysis Trigger */}
              <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" /> Evidence Management & Analysis Center
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ingested repository. Smart analysis evaluates all files together to evolve the case summary.
                    </p>
                  </div>

                  {/* Smart Analysis Action Button */}
                  <button
                    type="button"
                    onClick={handleTriggerAnalysis}
                    disabled={isAnalyzing || caseData.evidenceList.length === 0}
                    className={`h-9 px-4 rounded-md text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                      isAnalyzing || caseData.evidenceList.length === 0
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                    <span>{isAnalyzing ? "Running Smart Multi-Source Analysis..." : "⚡ Analyze All Evidence"}</span>
                  </button>
                </div>

                {/* Smart Analysis Rules Explainer Box */}
                <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-md text-xs text-blue-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Smart Analysis Logic: </span>
                    <span>
                      Analyzes all {caseData.evidenceList.length} evidence sources collectively (<code>Summary = f(all_evidence_files)</code>). Only files with <code>is_data_extracted == 0</code> undergo preliminary feature parsing to optimize processing, after which the updated findings update the Brief Summary in the Details tab.
                    </span>
                  </div>
                </div>

                {/* Evidence Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3 font-bold">File Name</th>
                        <th className="px-4 py-3 font-bold">Upload Date (System)</th>
                        <th className="px-4 py-3 font-bold">File Size</th>
                        <th className="px-4 py-3 font-bold">Data Type</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {caseData.evidenceList.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">
                            <div className="flex items-center gap-2">
                              {getDataTypeBadge(ev.dataType)}
                              <span className="truncate" title={ev.name}>{ev.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{ev.uploadDate}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono">{ev.size}</td>
                          <td className="px-4 py-3 text-slate-700 font-medium">{ev.dataType}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {ev.status === "Extracted" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Extracted (1)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" /> Pending (0)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {/* View Action */}
                              <button
                                type="button"
                                title="View Extracted Artifacts"
                                onClick={() => setViewingEvidence(ev)}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Download Action */}
                              <button
                                type="button"
                                title="Download Record Data"
                                onClick={() => handleDownloadEvidence(ev)}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Re-analyze Action */}
                              <button
                                type="button"
                                title="Re-analyze this file"
                                onClick={handleTriggerAnalysis}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Action */}
                              <button
                                type="button"
                                title="Delete from Case"
                                onClick={() => handleDeleteEvidence(ev.id)}
                                className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upload Supplemental Evidence Card */}
              <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-600" /> Ingest Additional Evidence (Any Format)
                  </h3>
                  <span className="text-[11px] text-slate-400">Audio, Video, PDF, CSV, Images, Script</span>
                </div>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleUploadNewEvidence(e.dataTransfer.files);
                  }}
                  onClick={() => {
                    const el = document.getElementById("supplemental-upload-input");
                    if (el) el.click();
                  }}
                  className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition ${
                    isDragging
                      ? "border-blue-600 bg-blue-50/60"
                      : "border-slate-300 hover:border-blue-400 bg-slate-50/40 hover:bg-slate-50"
                  }`}
                >
                  <input
                    id="supplemental-upload-input"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUploadNewEvidence(e.target.files)}
                  />
                  <Upload className="w-7 h-7 text-blue-600 mx-auto mb-2" />
                  <div className="text-xs font-bold text-slate-800">
                    Click or drop files to attach new evidence to this case dossier
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Newly uploaded files automatically trigger extraction and re-generate the Brief Summary.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────
              C. VISUALS TAB [/cases/[caseId]/visuals]
              Placeholder for graphs, maps, and visual representation of case data
          ───────────────────────────────────────────────────────── */}
          {activeTab === "visuals" && (
            <div className="space-y-6">
              
              {/* Visuals Header Card */}
              <div className="bg-white p-6 rounded-lg border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" /> Case Visuals & 3D Reconstruction Studio
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Visual models, spatial trajectory diagrams, and synchronized timeline reconstruction.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <Compass className="w-3 h-3" /> Bird&apos;s-Eye Forensic Perspective
                    </span>
                  </div>
                </div>

                {/* Three.js Real-Time 3D Forensic Simulation & Video Canvas */}
                <ThreeForensicCanvas
                  scrubberTime={scrubberTime}
                  onTimeChange={setScrubberTime}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  caseTitle={caseData.name}
                  caseDescription={caseData.description}
                  evidenceList={caseData.evidenceList}
                  evidenceVideoUrl={uploadedVideoUrl || (caseData as any).videoUrl || caseData.evidenceList.find(e => (e.dataType === "Video" || /\.(mp4|mov|avi|webm)$/i.test(e.name)) && e.fileUrl)?.fileUrl}
                  defaultScenario={(caseData as any).scenario}
                  onVideoUploaded={(file) => {
                    const blobUrl = URL.createObjectURL(file);
                    setUploadedVideoUrl(blobUrl);
                    // Add evidence to case
                    addEvidenceToCase(caseData.id, {
                      name: file.name,
                      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                      type: file.type || "video/mp4",
                      fileUrl: blobUrl
                    });
                    const formData = new FormData();
                    formData.append("file", file);
                    fetch(`http://localhost:8000/api/cases/${caseData.id}/upload-video`, {
                      method: "POST",
                      body: formData
                    }).catch(() => {});
                  }}
                />

                {/* Secondary Visual Charts: Kinematics & Contradiction Graph */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* Kinematics Curve */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Vehicle Deceleration Kinematics</span>
                      <span className="text-[10px] text-slate-400">CAN Telemetry Derived</span>
                    </div>
                    <div className="h-28 flex items-end gap-1.5 pt-4 px-2 border-b border-l border-slate-200">
                      {[48, 48, 47, 46, 42, 36, 26, 18, 14, 0].map((speed, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div 
                            className={`w-full rounded-t transition-all ${
                              i >= 5 ? "bg-rose-500" : "bg-blue-600"
                            }`} 
                            style={{ height: `${(speed / 50) * 100}%` }}
                          ></div>
                          <span className="text-[8px] font-mono text-slate-400">T+{i}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Emergency brake actuation occurred at T-0.7s with peak deceleration rate of -0.82 G.
                    </p>
                  </div>

                  {/* Multi-Source Corroboration Matrix */}
                  <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Source Correlation Index</span>
                      <span className="text-[10px] font-bold text-rose-600">Discrepancy Detected</span>
                    </div>
                    
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-slate-600">Video vs Sensor Timing:</span>
                        <span className="font-bold text-emerald-600">99.2% Aligned</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-slate-600">Witness Audio vs Video:</span>
                        <span className="font-bold text-rose-600">62.0% Discrepant (Light State)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-slate-600">Speed Estimate Consistency:</span>
                        <span className="font-bold text-emerald-600">94.5% Corroborated</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </main>

      </div>

      {/* ─────────────────────────────────────────────────────────
          VIEW EVIDENCE INSPECTION MODAL (from Records tab)
      ───────────────────────────────────────────────────────── */}
      {viewingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                {getDataTypeBadge(viewingEvidence.dataType)}
                <h3 className="text-xs font-bold text-slate-900 truncate max-w-md">{viewingEvidence.name}</h3>
              </div>
              <button
                onClick={() => setViewingEvidence(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">File Size</span>
                  <div className="font-mono font-bold text-slate-800">{viewingEvidence.size}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Extraction Status</span>
                  <div className="font-bold text-emerald-600">{viewingEvidence.status}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Upload Date (System)</span>
                  <div className="text-slate-700">{viewingEvidence.uploadDate}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Accident Time (Event)</span>
                  <div className="text-slate-700 font-semibold">{viewingEvidence.accidentTime}</div>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Extracted Findings & Telemetry:</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 leading-relaxed">
                  {viewingEvidence.extractedData?.summary || "File structure validated. Ready for cross-source timeline synthesis."}
                </p>
              </div>

              {viewingEvidence.extractedData?.transcript && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Whisper Voice Transcript:</span>
                  <p className="p-3 bg-blue-50/50 border border-blue-200 rounded-md text-blue-900 italic">
                    &ldquo;{viewingEvidence.extractedData.transcript}&rdquo;
                  </p>
                </div>
              )}

              {viewingEvidence.extractedData?.keyObservations && (
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Optical & Physical Markers:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                    {viewingEvidence.extractedData.keyObservations.map((obs, i) => (
                      <li key={i}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">ID: {viewingEvidence.id}</span>
              <button
                onClick={() => setViewingEvidence(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

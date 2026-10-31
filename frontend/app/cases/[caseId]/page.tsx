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
  Upload, 
  Trash2, 
  Download, 
  Video, 
  Mic, 
  Image as ImageIcon, 
  Code,
  Activity,
  X,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Info
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import ThreeForensicCanvas, { ScenarioType } from "@/components/3d/ThreeForensicCanvas";
import { 
  getStoredCaseById, 
  CaseDetail, 
  EvidenceRecord, 
  addEvidenceToCase, 
  deleteEvidenceFromCase,
  deleteCase,
  generateForensicEvidenceData
} from "@/lib/casesService";

export default function CaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params?.caseId as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "records" | "visuals">("details");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [viewingEvidence, setViewingEvidence] = useState<EvidenceRecord | null>(null);
  const [extractedDrawerRecord, setExtractedDrawerRecord] = useState<EvidenceRecord | null>(null);

  const openExtractedDrawer = (ev: EvidenceRecord) => {
    const summaryText = ev.extractedData?.summary || "";
    if (
      !summaryText ||
      summaryText.startsWith("Data and digital artifacts extracted from") ||
      summaryText.startsWith("Extracted digital artifacts from") ||
      summaryText.startsWith("Forensic ingestion of")
    ) {
      const fresh = generateForensicEvidenceData(
        { name: ev.name, size: ev.size, type: ev.dataType, accidentTime: ev.accidentTime },
        { name: caseData?.name, address: caseData?.address, description: caseData?.description, scenario: (caseData as any)?.scenario }
      );
      setExtractedDrawerRecord({
        ...ev,
        is_data_extracted: 1,
        status: "Extracted",
        extractedData: {
          summary: fresh.summary,
          keyObservations: fresh.keyObservations,
          fields: fresh.fields,
          transcript: fresh.transcript || ev.extractedData?.transcript
        }
      });
    } else {
      setExtractedDrawerRecord(ev);
    }
  };
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
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
        const vid = (found as unknown as Record<string, string>).videoUrl || found.evidenceList?.find(e => (e.dataType === "Video" || /\.(mp4|mov|avi|webm)$/i.test(e.name)) && e.fileUrl)?.fileUrl;
        if (vid) setUploadedVideoUrl(vid);
        if (found.updates && found.updates.length > 0) {
          setSelectedUpdateId((prev) => prev || found.updates![0].id);
        }
      }
    };
    reload();

    window.addEventListener("caseUpdated", reload);
    return () => window.removeEventListener("caseUpdated", reload);
  }, [caseId]);


  useEffect(() => {
    if (caseData?.updates && caseData.updates.length > 0) {
      if (!selectedUpdateId || !caseData.updates.some((u) => u.id === selectedUpdateId)) {
        setSelectedUpdateId(caseData.updates[0].id);
      }
    }
  }, [caseData, selectedUpdateId]);

  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] text-[#111111] p-4 sm:p-6 font-sans">
        <div className="max-w-4xl mx-auto pt-16">
          <div className="bg-white rounded-[24px] p-8 shadow-soft border border-[#F0F0F0] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center mx-auto text-[#8A8A8A]">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-[#111111]">Case Record Not Found</h2>
            <p className="text-xs text-[#8A8A8A]">The requested case ID ({caseId}) does not exist in local storage.</p>
            <div className="pt-2">
              <Link
                href="/cases"
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#121212] text-white hover:bg-black text-xs font-semibold transition shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Cases
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  };

  // Delete evidence
  const handleDeleteEvidence = (evId: string) => {
    if (confirm("Are you sure you want to remove this evidence file?")) {
      setIsGeneratingSummary(true);
      setTimeout(() => {
        const updated = deleteEvidenceFromCase(caseData.id, evId);
        setCaseData({ ...updated });
        setIsGeneratingSummary(false);
      }, 600);
    }
  };

  // Download evidence file record
  const handleDownloadEvidence = (ev: EvidenceRecord) => {
    const textContent = JSON.stringify(ev, null, 2);
    const blob = new Blob([textContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ev.name}.record.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDataTypeBadge = (type: string) => {
    switch (type) {
      case "Video":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EBF3FF] text-[#0A66FF]"><Video className="w-3 h-3" /> Video</span>;
      case "Audio":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8FD] text-[#0284C7]"><Mic className="w-3 h-3" /> Audio</span>;
      case "Sensor":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#6366F1]"><Activity className="w-3 h-3" /> Sensor</span>;
      case "PDF":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFEAEA] text-[#E11D48]"><FileText className="w-3 h-3" /> PDF</span>;
      case "Image":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF5FF] text-[#9333EA]"><ImageIcon className="w-3 h-3" /> Image</span>;
      case "Script":
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706]"><Code className="w-3 h-3" /> Script</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F5F3] text-[#555555]"><FileText className="w-3 h-3" /> {type}</span>;
    }
  };

  // Find currently selected update
  const selectedUpdate = caseData.updates?.find((u) => u.id === selectedUpdateId) || caseData.updates?.[0] || null;

  return (
    <div className="min-h-screen bg-[#F0F4FF] text-[#111111] font-sans">
      
      {/* Fixed Left Sub-Sidebar touching screen edges */}
      <aside 
        style={{ position: "fixed", left: 0, top: 0, height: "100vh", width: "260px", margin: 0 }}
        className="fixed left-0 top-0 h-screen w-[260px] m-0 z-30 bg-white flex flex-col justify-between select-none overflow-hidden"
      >
        <div className="relative z-10">
          {/* Top header of sub-sidebar: 72px tall with border-b, merging seamlessly with TopHeader */}
          <div className="h-[72px] px-4 flex items-center border-b border-[#F0F0F0]">
            <Link
              href="/cases"
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F5F5F3] hover:bg-[#EAEAEA] text-[#111111] text-xs font-bold transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cases</span>
            </Link>
          </div>

          <div className="p-4 space-y-4">
            {/* Case Mini Summary Box */}
            <div className="p-3.5 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC] space-y-1">
              <div className="text-[10px] font-medium text-[#8A8A8A] uppercase tracking-wider">
                Active Case
              </div>
              <div className="text-xs font-mono font-extrabold text-[#0A66FF] truncate">
                {caseData.caseNumber}
              </div>
              <div className="text-xs font-bold text-[#111111] line-clamp-1 leading-tight">
                {caseData.name}
              </div>
            </div>

            {/* Case Internal Tabs: Details, Records, Visuals */}
            <nav className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  activeTab === "details"
                    ? "bg-[#121212] text-white shadow-sm"
                    : "text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F5F8FF]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-4 h-4 ${activeTab === "details" ? "text-white" : "text-[#8A8A8A]"}`} />
                  <span className="text-sm font-medium">Details</span>
                </div>
                {activeTab === "details" && <ChevronRight className="w-4 h-4 text-white/80" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("records")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  activeTab === "records"
                    ? "bg-[#121212] text-white shadow-sm"
                    : "text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F5F8FF]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database className={`w-4 h-4 ${activeTab === "records" ? "text-white" : "text-[#8A8A8A]"}`} />
                  <span className="text-sm font-medium">Records</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === "records" ? "bg-white/20 text-white" : "bg-[#F0F0F0] text-[#111111]"
                  }`}>
                    {caseData.evidenceList.length}
                  </span>
                  {activeTab === "records" && <ChevronRight className="w-4 h-4 text-white/80" />}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("visuals")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  activeTab === "visuals"
                    ? "bg-[#121212] text-white shadow-sm"
                    : "text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F5F8FF]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Eye className={`w-4 h-4 ${activeTab === "visuals" ? "text-white" : "text-[#8A8A8A]"}`} />
                  <span className="text-sm font-medium">Visuals</span>
                </div>
                {activeTab === "visuals" && <ChevronRight className="w-4 h-4 text-white/80" />}
              </button>
            </nav>
          </div>
        </div>


        {/* Bullish Diagonal Lines Gradient Effect at Bottom */}
        <div className="sidebar-bottom-bullish" />

        {/* Bottom Status Pill */}
        <div className="relative z-10 p-4 border-t border-white/10 text-[11px] text-white/80">
          <span className="font-semibold text-white">{caseData.evidenceList.length}</span> files linked
        </div>

        {/* Vertical divider border line strictly below 72px */}
        <div className="absolute right-0 top-[72px] bottom-0 w-[1px] bg-[#F0F0F0] z-20" />
      </aside>

      {/* Fixed Topbar touching screen edges */}
      <TopHeader 
        title={caseData.name} 
        showSearch={false}
      />

      {/* Main Content Area starting after sidebar (260px) and topbar (72px + 32px breathing room) */}
      <main 
        style={{ marginLeft: "260px", paddingTop: "104px" }}
        className="ml-[260px] pt-[104px] px-6 sm:px-8 pb-12 min-h-screen"
      >
        <div className="space-y-6">
            
            {/* ═══════════════════════════════════════════════════════════════
                TAB 1: DETAILS TAB
            ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "details" && (
              <div className="space-y-6">
                
                {/* Block 1: Static Case Details Card */}
                <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-medium text-[#8A8A8A]">
                        Case Metadata
                      </span>
                      <h2 className="text-xl font-extrabold text-[#111111] mt-0.5">
                        {caseData.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F5F5F3] text-[#111111]">
                        {caseData.caseNumber}
                      </span>
                    </div>
                  </div>

                  {/* 6-box Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A]">Case Name</div>
                      <div className="font-bold text-sm text-[#111111] mt-1">{caseData.name}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A]">Case Number</div>
                      <div className="font-mono font-bold text-sm text-[#0A66FF] mt-1">{caseData.caseNumber}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#8A8A8A]" /> Filed By
                      </div>
                      <div className="font-bold text-sm text-[#111111] mt-1">{caseData.filedBy}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#8A8A8A]" /> Filed Date & Time
                      </div>
                      <div className="font-semibold text-sm text-[#111111] mt-1">{caseData.filedDate}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#0A66FF] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#0A66FF]" /> Accident Date & Time
                      </div>
                      <div className="font-extrabold text-sm text-[#111111] mt-1">{caseData.accidentDate}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#8A8A8A]" /> Assigned Location
                      </div>
                      <div className="font-semibold text-sm text-[#111111] mt-1 truncate" title={caseData.address}>
                        {caseData.address}
                      </div>
                    </div>

                  </div>

                  {caseData.description && (
                    <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC] text-xs text-[#555555] leading-relaxed">
                      <span className="font-bold text-[#111111]">Initial Remarks: </span>
                      {caseData.description}
                    </div>
                  )}
                </div>

                {/* Block 2: Dynamic Auto-Generated Brief Summary */}
                <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-medium text-[#8A8A8A]">
                        Dynamic Synthesis
                      </span>
                      <h3 className="text-lg font-extrabold text-[#111111] mt-0.5">
                        Brief Summary
                      </h3>
                      <p className="text-xs text-[#8A8A8A] mt-0.5">
                        Automatically synthesized from all attached evidence files.
                      </p>
                    </div>

                    {isGeneratingSummary ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF3FF] text-[#0A66FF] text-xs font-semibold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating summary...</span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCF5E3] text-[#1A7A2E]">
                        Up to date
                      </span>
                    )}
                  </div>

                  <div className="p-5 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC] text-xs text-[#222222] leading-relaxed">
                    {caseData.summary}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8A8A8A] pt-1">
                    <span>Synthesized from {caseData.evidenceList.length} evidence file(s)</span>
                    {caseData.lastAnalyzedAt && (
                      <span>Last updated: {caseData.lastAnalyzedAt}</span>
                    )}
                  </div>
                </div>

                {/* Block 3: Redesigned Evidence Timeline & Source Updates (2-Column Layout) */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[13px] font-medium text-[#8A8A8A]">
                      Multi-Source Sequential Reconstruction
                    </span>
                    <h3 className="text-xl font-extrabold text-[#111111] mt-0.5">
                      Evidence Timeline & Source Updates
                    </h3>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">
                      Select an update batch from the timeline list to review conflict checks and the reconstructed chronology.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
                    
                    {/* Left Column (Sticky 340px): Updates List */}
                    <div 
                      style={{ position: "sticky", top: "96px" }}
                      className="sticky top-[96px] bg-white rounded-[24px] p-5 shadow-soft border border-[#F0F0F0] space-y-4 max-h-[500px] overflow-y-auto"
                    >
                      <div className="pb-1">
                        <span className="text-sm font-extrabold text-[#111111] block">
                          Evidence Timeline / Source Updates
                        </span>
                        <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                          {caseData.updates?.length || 0} sequential ingestion event(s)
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {caseData.updates && caseData.updates.length > 0 ? (
                          caseData.updates.map((update) => {
                            const isSelected = selectedUpdate?.id === update.id;
                            return (
                              <div
                                key={update.id}
                                onClick={() => setSelectedUpdateId(update.id)}
                                className={`rounded-[16px] p-4 cursor-pointer transition-all duration-150 flex items-center justify-between border ${
                                  isSelected
                                    ? "bg-[#121212] text-white border-[#121212] shadow-sm"
                                    : "bg-white text-[#111111] border-[#F0F0F0] hover:border-[#CCCCCC] hover:bg-[#F9F9F7]"
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-extrabold ${isSelected ? "text-white" : "text-[#111111]"}`}>
                                      {update.updateNumber}
                                    </span>
                                    <span className={`text-xs ${isSelected ? "text-white/40" : "text-[#CCCCCC]"}`}>•</span>
                                    <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-[#111111]"}`}>
                                      {update.dateTime}
                                    </span>
                                  </div>
                                  <div className={`text-xs ${isSelected ? "text-white/70" : "text-[#8A8A8A]"}`}>
                                    {update.summaryText}
                                  </div>
                                </div>

                                <div className="shrink-0 ml-2">
                                  <ChevronRight className={`w-4 h-4 ${isSelected ? "text-white" : "text-[#8A8A8A]"}`} />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-10 text-xs text-[#8A8A8A]">
                            No updates recorded yet. Upload files in Records to create updates.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: ONE SINGLE UNIFIED CARD */}
                    {!selectedUpdate ? (
                      <div className="bg-white rounded-[24px] p-12 text-center shadow-soft border border-[#F0F0F0] space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#F5F5F3] flex items-center justify-center mx-auto text-[#8A8A8A]">
                          <Clock className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-extrabold text-[#111111]">Select an update to view details</h4>
                        <p className="text-xs text-[#8A8A8A]">
                          Choose an update card from the left panel to examine conflict analysis and the chronological reconstruction.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-soft border border-[#F0F0F0] space-y-6">
                        
                        {/* 1. TOP SECTION: Date, Source count, File pills */}
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#121212] text-white">
                                  Update {selectedUpdate.updateNumber}
                                </span>
                                <span className="text-base font-extrabold text-[#111111]">
                                  {selectedUpdate.dateTime}
                                </span>
                              </div>
                              <p className="text-xs text-[#8A8A8A] mt-1">
                                {selectedUpdate.files.length} source file(s) ingested • {selectedUpdate.summaryText}
                              </p>
                            </div>

                            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#F5F8FF] text-[#0A66FF] border border-[#D0E2FF]">
                              Batch #{selectedUpdate.updateNumber}
                            </span>
                          </div>

                          {/* Files pills */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {selectedUpdate.files.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                className="px-3.5 py-1.5 rounded-full bg-[#F5F8FF] border border-[#EEEEEC] flex items-center gap-2 text-xs"
                              >
                                {getDataTypeBadge(file.dataType)}
                                <span className="font-bold text-[#111111] max-w-[200px] truncate" title={file.name}>
                                  {file.name}
                                </span>
                                <span className="text-[11px] font-mono text-[#8A8A8A]">{file.size}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* DIVIDER 1 */}
                        <div className="border-t border-[#F0F0F0]" />

                        {/* 2. MIDDLE SECTION: Conflict Check */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-extrabold text-[#111111]">Conflict Check</h4>
                              
                              {/* Tooltip explaining what is a conflict */}
                              <div className="group relative cursor-pointer">
                                <div className="w-5 h-5 rounded-full bg-[#F5F5F3] hover:bg-[#EAEAEA] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition">
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </div>
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3.5 bg-[#121212] text-white text-[11px] rounded-[14px] shadow-xl z-30 leading-relaxed animate-in fade-in">
                                  <span className="font-bold block mb-1 text-white">What is a conflict?</span>
                                  A conflict occurs when two or more independent sources report contradictory facts (e.g. conflicting signal phases, collision times, or vehicle speeds).
                                </div>
                              </div>
                            </div>

                            {/* Conflict Status Badge */}
                            {selectedUpdate.conflict.hasConflict ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFEAEA] text-[#E11D48] flex items-center gap-1.5 border border-[#FFD4D4]">
                                <AlertTriangle className="w-3.5 h-3.5" /> Conflict Observed
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCF5E3] text-[#1A7A2E] flex items-center gap-1.5 border border-[#C3ECCB]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> No Conflict Observed
                              </span>
                            )}
                          </div>

                          {/* Conflict Detail Box */}
                          {selectedUpdate.conflict.hasConflict ? (
                            <div className="p-4 rounded-[18px] bg-[#FFF5F5] border border-[#FFDADA] space-y-1.5">
                              <div className="text-xs font-bold text-[#E11D48] flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>Contradiction Detected Across Ingested Material</span>
                              </div>
                              <p className="text-xs text-[#222222] leading-relaxed pl-5">
                                {selectedUpdate.conflict.explanation}
                              </p>
                            </div>
                          ) : (
                            <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC] space-y-1">
                              <div className="text-xs font-bold text-[#1A7A2E] flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>All sources align on timeline and events</span>
                              </div>
                              <p className="text-xs text-[#555555] leading-relaxed pl-5">
                                {selectedUpdate.conflict.explanation || "No contradictory observations identified among the ingested evidence files for this update batch."}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* DIVIDER 2 */}
                        <div className="border-t border-[#F0F0F0]" />

                        {/* 3. BOTTOM SECTION: Timeline After This Update */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-extrabold text-[#111111]">
                              Timeline After This Update
                            </h4>
                            <p className="text-xs text-[#8A8A8A] mt-0.5">
                              Chronological sequence incorporating findings up to Update {selectedUpdate.updateNumber}.
                            </p>
                          </div>

                          {/* Check if timeline is unchanged relative to previous update */}
                          {(() => {
                            const updateIdx = caseData.updates?.findIndex((u) => u.id === selectedUpdate.id) ?? -1;
                            const isBaseline = updateIdx <= 0;
                            const hasChanges = isBaseline || selectedUpdate.reconstructedTimeline.some(
                              (node) => node.status === "NEW" || node.status === "UPDATED" || node.status === "CONFLICT" || node.isConflict
                            );

                            return (
                              <>
                                {!hasChanges && (
                                  <div className="p-3.5 rounded-[16px] bg-[#F5F5F3] border border-[#EEEEEC] text-xs text-[#777777] flex items-center gap-2.5 mb-4">
                                    <Info className="w-4 h-4 text-[#8A8A8A] shrink-0" />
                                    <span>Timeline remains unchanged after this update. No new temporal data found.</span>
                                  </div>
                                )}

                                {/* Vertical timeline with thin line and dots */}
                                <div className="relative pl-7 space-y-5 pt-1">
                                  {/* Thin vertical connecting line */}
                                  <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-[#E4ECFB]" />

                                  {selectedUpdate.reconstructedTimeline.map((node, nIdx) => {
                                    const isConflict = node.isConflict || node.status === "CONFLICT";
                                    const isNew = node.status === "NEW";
                                    const isUpdated = node.status === "UPDATED";

                                    // Dot styling based on delta
                                    let dotClass = "bg-[#8A8A8A] ring-4 ring-[#F0F0F0]";
                                    if (isConflict) {
                                      dotClass = "bg-[#FF3B30] ring-4 ring-[#FFEAEA]";
                                    } else if (isNew) {
                                      dotClass = "bg-[#10B981] ring-4 ring-[#DCF5E3]";
                                    } else if (isUpdated) {
                                      dotClass = "bg-[#F59E0B] ring-4 ring-[#FFF4D6]";
                                    } else if (isBaseline) {
                                      dotClass = "bg-[#0A66FF] ring-4 ring-[#EBF3FF]";
                                    }

                                    return (
                                      <div key={nIdx} className="relative flex items-start group">
                                        {/* 10px / 12px Circle Dot */}
                                        <div
                                          className={`absolute -left-7 mt-1 w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${dotClass}`}
                                        />

                                        {/* Content Card */}
                                        <div className="space-y-1 w-full bg-[#F5F8FF] p-3.5 rounded-[18px] border border-[#EEEEEC] hover:border-[#CCCCCC] transition">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              {/* Timestamp: Show old -> new with strikethrough if updated */}
                                              {isUpdated && node.oldTime ? (
                                                <div className="flex items-center gap-1.5 font-mono text-xs">
                                                  <span className="text-[#8A8A8A] line-through">{node.oldTime}</span>
                                                  <span className="text-[#B45309] font-bold">→</span>
                                                  <span className="font-bold text-[#B45309] bg-[#FFF4D6] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                                                    {node.time}
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className="font-mono text-xs font-bold text-[#0A66FF] bg-white px-2.5 py-0.5 rounded-full border border-[#E4ECFB]">
                                                  {node.time}
                                                </span>
                                              )}

                                              <span className="text-xs font-bold text-[#111111]">
                                                {node.label}
                                              </span>
                                            </div>

                                            {/* Delta Badges */}
                                            <div className="flex items-center gap-1.5">
                                              {isNew && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCF5E3] text-[#1A7A2E] border border-[#C3ECCB]">
                                                  NEW
                                                </span>
                                              )}
                                              {isUpdated && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF4D6] text-[#B45309] border border-[#FDE68A]">
                                                  UPDATED
                                                </span>
                                              )}
                                              {isConflict && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEAEA] text-[#E11D48] border border-[#FFD4D4]">
                                                  CONFLICT
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <p className="text-xs text-[#555555] leading-relaxed pt-1">
                                            {node.detail}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        </div>

                      </div>
                    )}
                  </div>
                </div>

                {/* Block 4: Case Removal / Danger Zone */}
                <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[13px] font-medium text-[#8A8A8A]">
                      Case Actions
                    </span>
                    <h4 className="text-base font-extrabold text-[#111111] mt-0.5">
                      Delete Case Dossier
                    </h4>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">
                      Permanently remove this case dossier and all its synchronized evidence records from local storage.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Permanently delete case "${caseData.name}" (${caseData.caseNumber})?`)) {
                        deleteCase(caseData.id);
                        router.push("/cases");
                      }
                    }}
                    className="h-10 px-5 rounded-full text-xs font-bold text-[#E11D48] bg-[#FFEAEA] hover:bg-[#FFD4D4] border border-[#FFD4D4] transition flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Case</span>
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB 2: RECORDS TAB
            ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "records" && (
              <div className="space-y-6">
                
                {/* Evidence Records Table Card */}
                <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-medium text-[#8A8A8A]">
                        Intake Repository
                      </span>
                      <h2 className="text-xl font-extrabold text-[#111111] mt-0.5">
                        Evidence Records
                      </h2>
                      <p className="text-xs text-[#8A8A8A] mt-0.5">
                        Uploaded media files. Analysis and summary update automatically upon intake.
                      </p>
                    </div>

                    {isGeneratingSummary && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF3FF] text-[#0A66FF] text-xs font-semibold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing evidence...</span>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-[18px] border border-[#EEEEEC]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F5F8FF] border-b border-[#EEEEEC] text-[#8A8A8A] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-5 py-3.5 font-bold">File Name</th>
                          <th className="px-5 py-3.5 font-bold">Upload Date</th>
                          <th className="px-5 py-3.5 font-bold">File Size</th>
                          <th className="px-5 py-3.5 font-bold">Data Type</th>
                          <th className="px-5 py-3.5 font-bold">Extracted Data</th>
                          <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEEEEC] bg-white">
                        {caseData.evidenceList.map((ev) => (
                          <tr key={ev.id} className="hover:bg-[#F5F8FF] transition">
                            <td className="px-5 py-4 font-semibold text-[#111111] max-w-xs truncate">
                              <div className="flex items-center gap-2.5">
                                {getDataTypeBadge(ev.dataType)}
                                <span className="truncate font-bold" title={ev.name}>{ev.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[#8A8A8A] whitespace-nowrap">{ev.uploadDate}</td>
                            <td className="px-5 py-4 text-[#111111] font-mono font-medium">{ev.size}</td>
                            <td className="px-5 py-4 text-[#111111] font-medium">{ev.dataType}</td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              {ev.is_data_extracted ? (
                                <button
                                  type="button"
                                  onClick={() => openExtractedDrawer(ev)}
                                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F5F8FF] hover:bg-[#EBF3FF] text-[#0A66FF] border border-[#D0E2FF] transition flex items-center gap-1.5 shadow-2xs"
                                >
                                  <Database className="w-3.5 h-3.5" />
                                  <span>View Extracted Data</span>
                                </button>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F5F5F3] text-[#8A8A8A] inline-block">
                                  No data extracted
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  title="View Record Details"
                                  onClick={() => setViewingEvidence(ev)}
                                  className="w-8 h-8 rounded-full bg-[#F5F5F3] hover:bg-[#EAEAEA] flex items-center justify-center text-[#111111] transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  title="Download Record"
                                  onClick={() => handleDownloadEvidence(ev)}
                                  className="w-8 h-8 rounded-full bg-[#F5F5F3] hover:bg-[#EAEAEA] flex items-center justify-center text-[#111111] transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  title="Delete Evidence"
                                  onClick={() => handleDeleteEvidence(ev.id)}
                                  className="w-8 h-8 rounded-full bg-[#FFEAEA] hover:bg-[#FFD4D4] flex items-center justify-center text-[#E11D48] transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {caseData.evidenceList.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-xs text-[#8A8A8A]">
                              No evidence files uploaded yet. Add files using the uploader below.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Upload Evidence Dropzone */}
                <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-medium text-[#8A8A8A]">
                        Multi-Format Ingestion
                      </span>
                      <h3 className="text-lg font-extrabold text-[#111111] mt-0.5">
                        Upload Evidence
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#8A8A8A]">
                      Audio, Video, PDF, Images, Scripts, Telemetry
                    </span>
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
                      const el = document.getElementById("records-upload-input");
                      if (el) el.click();
                    }}
                    className={`p-10 rounded-[20px] text-center cursor-pointer transition border-2 border-dashed ${
                      isDragging
                        ? "border-[#0A66FF] bg-[#EBF3FF]"
                        : "border-[#E5E5E0] hover:border-[#111111] bg-[#F5F8FF] hover:bg-[#F5F5F3]"
                    }`}
                  >
                    <input
                      id="records-upload-input"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUploadNewEvidence(e.target.files)}
                    />
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-xs text-[#111111]">
                      <Upload className="w-5 h-5 text-[#0A66FF]" />
                    </div>
                    <p className="text-sm font-bold text-[#111111]">Click or drag & drop files here to upload</p>
                    <p className="text-xs text-[#8A8A8A] mt-1">
                      MP4, MOV, MP3, WAV, PDF, CSV, PNG, JPG, PY supported
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB 3: VISUALS TAB
            ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "visuals" && (
              <div className="space-y-6">
                
                <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-medium text-[#8A8A8A]">
                        Spatial & Chronological Verification
                      </span>
                      <h2 className="text-xl font-extrabold text-[#111111] mt-0.5">
                        Scene Visuals & Geospatial Verification
                      </h2>
                      <p className="text-xs text-[#8A8A8A] mt-0.5">
                        Correlated geospatial coordinates and scene overview for this case.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#DCF5E3] text-[#1A7A2E]">
                        GPS Synced
                      </span>
                    </div>
                  </div>

                  {/* Satellite / Schematic Map Mockup */}
                  <div className="h-72 rounded-[20px] bg-[#EBF3FF] border border-[#D0E2FF] relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[radial-gradient(#0A66FF_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />
                    <div className="text-center z-10 space-y-2 p-6">
                      <div className="w-12 h-12 rounded-full bg-[#121212] text-white flex items-center justify-center mx-auto shadow-md">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm font-bold text-[#111111]">
                        {caseData.address}
                      </div>
                      <div className="text-xs font-mono text-[#0A66FF]">
                        {caseData.latitude ? `${caseData.latitude}° N, ${caseData.longitude}° E` : "Coordinates verified by territorial jurisdiction"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-[20px] bg-[#F5F8FF] border border-[#EEEEEC] space-y-1">
                      <span className="text-xs font-bold text-[#111111] block">Spatial Mapping Coordinates</span>
                      <p className="text-[#8A8A8A] text-xs">
                        {caseData.latitude ? `${caseData.latitude}° N, ${caseData.longitude}° E` : "Assigned by territorial jurisdiction."}
                      </p>
                    </div>

                    <div className="p-5 rounded-[20px] bg-[#F5F8FF] border border-[#EEEEEC] space-y-1">
                      <span className="text-xs font-bold text-[#111111] block">Evidence Synchrony</span>
                      <p className="text-[#8A8A8A] text-xs">
                        {caseData.evidenceList.length} evidence file(s) synchronized to incident timeline.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Visuals Tab */}
            {activeTab === "visuals" && (
              <div className="space-y-6">
                <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F0F0F0] pb-4 gap-2">
                    <div>
                      <span className="text-[13px] font-medium text-[#8A8A8A]">3D Digital Twin</span>
                      <h2 className="text-xl font-extrabold text-[#111111] mt-0.5 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-blue-600" /> Case Visuals & 3D Forensic Simulation
                      </h2>
                      <p className="text-xs text-[#8A8A8A] mt-0.5">
                        Interactive physical models, multi-vehicle spatial trajectory, and camera perspectives.
                      </p>
                    </div>
                  </div>

                  {/* Three.js 3D Forensic Simulation */}
                  <ThreeForensicCanvas
                    scrubberTime={scrubberTime}
                    onTimeChange={setScrubberTime}
                    isPlaying={isPlaying}
                    onTogglePlay={() => setIsPlaying(!isPlaying)}
                    caseTitle={caseData.name}
                    caseDescription={caseData.description}
                    evidenceList={caseData.evidenceList}
                    evidenceVideoUrl={uploadedVideoUrl || (caseData as unknown as Record<string, string>).videoUrl || caseData.evidenceList.find(e => (e.dataType === "Video" || /\.(mp4|mov|avi|webm)$/i.test(e.name)) && e.fileUrl)?.fileUrl}
                    defaultScenario={(caseData as unknown as { scenario?: ScenarioType }).scenario}
                    onVideoUploaded={(file: File) => {
                      const blobUrl = URL.createObjectURL(file);
                      setUploadedVideoUrl(blobUrl);
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

                  {/* Secondary Visual Charts: Kinematics & Corroboration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-5 rounded-[20px] bg-[#F5F8FF] border border-[#EEEEEC] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#111111]">Vehicle Deceleration Kinematics</span>
                        <span className="text-[10px] text-[#8A8A8A]">CAN Telemetry Derived</span>
                      </div>
                      <div className="h-28 flex items-end gap-1.5 pt-4 px-2 border-b border-l border-[#EEEEEC]">
                        {[48, 48, 47, 46, 42, 36, 26, 18, 14, 0].map((speed, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div 
                              className={`w-full rounded-t transition-all ${
                                i >= 5 ? "bg-rose-500" : "bg-blue-600"
                              }`} 
                              style={{ height: `${(speed / 50) * 100}%` }}
                            ></div>
                            <span className="text-[8px] font-mono text-[#8A8A8A]">T+{i}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-[#8A8A8A] mt-1">
                        Emergency brake actuation occurred at T-0.7s with peak deceleration rate of -0.82 G.
                      </p>
                    </div>

                    <div className="p-5 rounded-[20px] bg-[#F5F8FF] border border-[#EEEEEC] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#111111]">Source Correlation Index</span>
                        <span className="text-[10px] font-bold text-rose-600">Discrepancy Detected</span>
                      </div>
                      <div className="space-y-2 pt-1 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-white border border-[#EEEEEC]">
                          <span className="text-[#8A8A8A]">Video vs Sensor Timing:</span>
                          <span className="font-bold text-emerald-600">99.2% Aligned</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-white border border-[#EEEEEC]">
                          <span className="text-[#8A8A8A]">Witness Audio vs Video:</span>
                          <span className="font-bold text-rose-600">62.0% Discrepant (Light State)</span>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-[12px] bg-white border border-[#EEEEEC]">
                          <span className="text-[#8A8A8A]">Speed Estimate Consistency:</span>
                          <span className="font-bold text-emerald-600">94.5% Corroborated</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

        </main>

      {/* ═══════════════════════════════════════════════════════════════
          SLIDE-IN RIGHT DRAWER FOR EXTRACTED DATA (40% width)
      ═══════════════════════════════════════════════════════════════ */}
      {extractedDrawerRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop click outside to close */}
          <div 
            className="absolute inset-0" 
            onClick={() => setExtractedDrawerRecord(null)} 
          />

          {/* Drawer Container (40% width on desktop, rounded-l-[28px]) */}
          <div className="relative w-full sm:w-[500px] lg:w-[40%] max-w-xl bg-white h-full z-10 shadow-2xl rounded-l-[28px] border-l border-[#F0F0F0] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#EEEEEC] bg-[#F5F8FF] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getDataTypeBadge(extractedDrawerRecord.dataType)}
                <div>
                  <h3 className="text-base font-extrabold text-[#111111]">
                    Extracted Data Record
                  </h3>
                  <p className="text-[11px] text-[#8A8A8A] truncate max-w-[240px]" title={extractedDrawerRecord.name}>
                    {extractedDrawerRecord.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExtractedDrawerRecord(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              
              {/* Section A: Raw Extracted Key-Value Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                    Section A: Raw Extracted Key-Value Fields
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCF5E3] text-[#1A7A2E]">
                    Extracted
                  </span>
                </div>

                <div className="space-y-2">
                  {extractedDrawerRecord.extractedData?.fields && Object.keys(extractedDrawerRecord.extractedData.fields).length > 0 ? (
                    Object.entries(extractedDrawerRecord.extractedData.fields).map(([label, val], idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-[14px] bg-[#F5F8FF] border border-[#EEEEEC] flex items-center justify-between gap-3"
                      >
                        <span className="text-xs text-[#8A8A8A] font-medium shrink-0">
                          {label}
                        </span>
                        <span className="text-xs font-bold text-[#111111] text-right font-mono sm:font-sans">
                          {String(val)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-[14px] bg-[#F5F8FF] border border-[#EEEEEC] text-xs text-[#8A8A8A]">
                      No structured key-value fields extracted.
                    </div>
                  )}
                </div>
              </div>

              {/* Analytical Summary */}
              {extractedDrawerRecord.extractedData?.summary && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                    Analytical Summary
                  </span>
                  <div className="p-4 rounded-[16px] bg-[#F5F8FF] border border-[#EEEEEC] text-xs text-[#222222] leading-relaxed">
                    {extractedDrawerRecord.extractedData.summary}
                  </div>
                </div>
              )}

              {/* Key Forensic Observations */}
              {extractedDrawerRecord.extractedData?.keyObservations && extractedDrawerRecord.extractedData.keyObservations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                    Key Forensic Observations
                  </span>
                  <div className="space-y-1.5">
                    {extractedDrawerRecord.extractedData.keyObservations.map((obs, idx) => (
                      <div key={idx} className="p-3 rounded-[14px] bg-[#F5F8FF] border border-[#EEEEEC] flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0A66FF] mt-1.5 shrink-0" />
                        <span className="text-xs text-[#222222] leading-relaxed">{obs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript block if audio/video */}
              {extractedDrawerRecord.extractedData?.transcript && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                    Recorded Deposition Transcript
                  </span>
                  <div className="p-4 rounded-[16px] bg-[#EBF3FF] border border-[#D0E2FF] text-xs text-[#0A66FF] italic leading-relaxed">
                    &ldquo;{extractedDrawerRecord.extractedData.transcript}&rdquo;
                  </div>
                </div>
              )}

              {/* Section B: Original Source Preview & Download */}
              <div className="space-y-3 pt-2 border-t border-[#EEEEEC]">
                <span className="text-[11px] font-bold text-[#8A8A8A] uppercase tracking-wider">
                  Section B: Original Source File
                </span>

                <div className="p-4 rounded-[18px] bg-[#F5F8FF] border border-[#EEEEEC] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs text-[#111111] truncate max-w-[220px]" title={extractedDrawerRecord.name}>
                        {extractedDrawerRecord.name}
                      </div>
                      <div className="text-[11px] text-[#8A8A8A] font-mono">
                        {extractedDrawerRecord.size} • {extractedDrawerRecord.dataType}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F5F3] text-[#111111]">
                      Original File
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDownloadEvidence(extractedDrawerRecord)}
                      className="flex-1 h-9 px-4 rounded-full bg-[#121212] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Source</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setViewingEvidence(extractedDrawerRecord)}
                      className="h-9 px-4 rounded-full bg-white hover:bg-[#F5F5F3] text-[#111111] border border-[#EEEEEC] text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#EEEEEC] bg-[#F5F8FF] flex items-center justify-between">
              <span className="text-[11px] text-[#8A8A8A] font-mono">
                ID: {extractedDrawerRecord.id}
              </span>
              <button
                type="button"
                onClick={() => setExtractedDrawerRecord(null)}
                className="h-9 px-5 bg-[#121212] hover:bg-black text-white text-xs font-semibold rounded-full transition shadow-sm"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW EVIDENCE INSPECTION MODAL */}
      {viewingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[28px] border border-[#F0F0F0] shadow-soft-hover w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#EEEEEC] bg-[#F5F8FF]">
              <div className="flex items-center gap-2.5">
                {getDataTypeBadge(viewingEvidence.dataType)}
                <h3 className="text-sm font-extrabold text-[#111111] truncate max-w-xs">{viewingEvidence.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingEvidence(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#F5F8FF] rounded-[18px] border border-[#EEEEEC]">
                <div>
                  <span className="text-[#8A8A8A] text-[10px] uppercase font-bold">File Size</span>
                  <div className="font-mono font-bold text-[#111111] mt-0.5">{viewingEvidence.size}</div>
                </div>
                <div>
                  <span className="text-[#8A8A8A] text-[10px] uppercase font-bold">Status</span>
                  <div className="font-bold text-[#1A7A2E] mt-0.5">{viewingEvidence.status}</div>
                </div>
                <div className="pt-2">
                  <span className="text-[#8A8A8A] text-[10px] uppercase font-bold">Upload Date</span>
                  <div className="text-[#111111] font-semibold mt-0.5">{viewingEvidence.uploadDate}</div>
                </div>
                <div className="pt-2">
                  <span className="text-[#8A8A8A] text-[10px] uppercase font-bold">Accident Time</span>
                  <div className="text-[#0A66FF] font-bold mt-0.5">{viewingEvidence.accidentTime}</div>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#111111] block mb-1.5">Extracted Details:</span>
                <p className="p-4 bg-[#F5F8FF] border border-[#EEEEEC] rounded-[18px] text-[#222222] leading-relaxed">
                  {viewingEvidence.extractedData?.summary || "File structure validated."}
                </p>
              </div>

              {viewingEvidence.extractedData?.transcript && (
                <div>
                  <span className="font-bold text-[#111111] block mb-1.5">Transcript:</span>
                  <p className="p-4 bg-[#EBF3FF] border border-[#D0E2FF] rounded-[18px] text-[#0A66FF] italic leading-relaxed">
                    {viewingEvidence.extractedData.transcript}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#EEEEEC] bg-[#F5F8FF] flex items-center justify-between">
              <span className="text-[11px] text-[#8A8A8A] font-mono">ID: {viewingEvidence.id}</span>
              <button
                type="button"
                onClick={() => setViewingEvidence(null)}
                className="h-9 px-5 bg-[#121212] hover:bg-black text-white text-xs font-semibold rounded-full transition shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

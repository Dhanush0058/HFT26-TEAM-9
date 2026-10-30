"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  MoreHorizontal,
  RefreshCw
} from "lucide-react";
import TopHeader from "@/components/TopHeader";
import { 
  getStoredCaseById, 
  CaseDetail, 
  EvidenceRecord, 
  addEvidenceToCase, 
  deleteEvidenceFromCase 
} from "@/lib/casesService";

export default function CaseDetailsPage() {
  const params = useParams();
  const caseId = params?.caseId as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "records" | "visuals">("details");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [viewingEvidence, setViewingEvidence] = useState<EvidenceRecord | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    const found = getStoredCaseById(caseId);
    if (found) {
      setCaseData(found);
    }
  }, [caseId]);

  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#F6F5F2] text-[#111111] p-4 sm:p-6 font-sans">
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

  // Handle uploading new evidence in Records:
  // Data extraction and dynamic summary regeneration happen automatically!
  const handleUploadNewEvidence = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsGeneratingSummary(true);

    setTimeout(() => {
      let updated = caseData;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
        updated = addEvidenceToCase(caseData.id, {
          name: f.name,
          size: `${sizeMb} MB`,
          type: f.type || "application/octet-stream",
          accidentTime: caseData.accidentDate
        });
      }
      setCaseData({ ...updated });
      setIsGeneratingSummary(false);
    }, 1200);
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

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#111111] font-sans">
      
      {/* Fixed Left Sub-Sidebar touching screen edges */}
      <aside 
        style={{ position: "fixed", left: 0, top: 0, height: "100vh", width: "260px", margin: 0 }}
        className="fixed left-0 top-0 h-screen w-[260px] m-0 z-30 bg-white flex flex-col justify-between select-none"
      >
        <div>
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
            <div className="p-3.5 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC] space-y-1">
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
                    : "text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F9F9F7]"
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
                    : "text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F9F9F7]"
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
                    : "text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F9F9F7]"
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

        {/* Bottom Status Pill */}
        <div className="p-4 border-t border-[#F5F5F3] text-[11px] text-[#8A8A8A]">
          <span className="font-semibold text-[#111111]">{caseData.evidenceList.length}</span> files linked
        </div>

        {/* Vertical divider border line strictly below 72px */}
        <div className="absolute right-0 top-[72px] bottom-0 w-[1px] bg-[#F0F0F0]" />
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
                      <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 6-box Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <div className="p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A]">Case Name</div>
                      <div className="font-bold text-sm text-[#111111] mt-1">{caseData.name}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A]">Case Number</div>
                      <div className="font-mono font-bold text-sm text-[#0A66FF] mt-1">{caseData.caseNumber}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#8A8A8A]" /> Filed By
                      </div>
                      <div className="font-bold text-sm text-[#111111] mt-1">{caseData.filedBy}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#8A8A8A]" /> Filed Date & Time
                      </div>
                      <div className="font-semibold text-sm text-[#111111] mt-1">{caseData.filedDate}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#0A66FF] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#0A66FF]" /> Accident Date & Time
                      </div>
                      <div className="font-extrabold text-sm text-[#111111] mt-1">{caseData.accidentDate}</div>
                    </div>

                    <div className="p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC]">
                      <div className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#8A8A8A]" /> Assigned Location
                      </div>
                      <div className="font-semibold text-sm text-[#111111] mt-1 truncate" title={caseData.address}>
                        {caseData.address}
                      </div>
                    </div>

                  </div>

                  {caseData.description && (
                    <div className="p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC] text-xs text-[#555555] leading-relaxed">
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

                  <div className="p-5 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC] text-xs text-[#222222] leading-relaxed">
                    {caseData.summary}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8A8A8A] pt-1">
                    <span>Synthesized from {caseData.evidenceList.length} evidence file(s)</span>
                    {caseData.lastAnalyzedAt && (
                      <span>Last updated: {caseData.lastAnalyzedAt}</span>
                    )}
                  </div>
                </div>

                {/* Block 3: Dual Timeline Concept */}
                <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-medium text-[#8A8A8A]">
                        Chronological Reconstruction
                      </span>
                      <h3 className="text-lg font-extrabold text-[#111111] mt-0.5">
                        Evidence Timeline
                      </h3>
                      <p className="text-xs text-[#8A8A8A] mt-0.5">
                        Dual timeline correlating physical accident events with ingestion timestamps.
                      </p>
                    </div>

                    <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {caseData.timeline.length > 0 ? (
                    <div className="space-y-4">
                      {caseData.timeline.map((event, idx) => (
                        <div 
                          key={event.id || idx} 
                          className="p-5 rounded-[20px] bg-[#F9F9F7] border border-[#EEEEEC] hover:border-[#111111] transition-all duration-150 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-6 h-6 rounded-full bg-[#121212] text-white flex items-center justify-center text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-[#111111]">
                                Evidence: <span className="text-[#0A66FF] font-mono">{event.evidenceName}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EBF3FF] text-[#0A66FF]">
                                Accident Time: {event.accidentTime}
                              </span>
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FFFFFF] text-[#8A8A8A] border border-[#EEEEEC]">
                                Ingested: {event.uploadedTime}
                              </span>
                            </div>
                          </div>

                          <div className="pl-8 space-y-1">
                            <div className="text-xs font-bold text-[#111111]">{event.title}</div>
                            <p className="text-xs text-[#555555] leading-relaxed">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-xs text-[#8A8A8A]">
                      No evidence timeline entries yet. Upload evidence in the Records tab to construct the timeline.
                    </div>
                  )}
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
                      <thead className="bg-[#F9F9F7] border-b border-[#EEEEEC] text-[#8A8A8A] uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-5 py-3.5 font-bold">File Name</th>
                          <th className="px-5 py-3.5 font-bold">Upload Date</th>
                          <th className="px-5 py-3.5 font-bold">File Size</th>
                          <th className="px-5 py-3.5 font-bold">Data Type</th>
                          <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEEEEC] bg-white">
                        {caseData.evidenceList.map((ev) => (
                          <tr key={ev.id} className="hover:bg-[#F9F9F7] transition">
                            <td className="px-5 py-4 font-semibold text-[#111111] max-w-xs truncate">
                              <div className="flex items-center gap-2.5">
                                {getDataTypeBadge(ev.dataType)}
                                <span className="truncate font-bold" title={ev.name}>{ev.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[#8A8A8A] whitespace-nowrap">{ev.uploadDate}</td>
                            <td className="px-5 py-4 text-[#111111] font-mono font-medium">{ev.size}</td>
                            <td className="px-5 py-4 text-[#111111] font-medium">{ev.dataType}</td>
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
                            <td colSpan={5} className="text-center py-12 text-xs text-[#8A8A8A]">
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
                        : "border-[#E5E5E0] hover:border-[#111111] bg-[#F9F9F7] hover:bg-[#F5F5F3]"
                    }`}
                  >
                    <input
                      id="records-upload-input"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUploadNewEvidence(e.target.files)}
                    />
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-2xs">
                      <Upload className="w-5 h-5 text-[#0A66FF]" />
                    </div>
                    <div className="text-sm font-extrabold text-[#111111]">
                      Click or drag files here to upload evidence
                    </div>
                    <p className="text-xs text-[#8A8A8A] mt-1 max-w-md mx-auto">
                      Files are analyzed upon intake to reconstruct the dual timeline and synthesize the brief summary.
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
                        Spatial & Telemetry Mapping
                      </span>
                      <h2 className="text-xl font-extrabold text-[#111111] mt-0.5">
                        Visual Reconstruction
                      </h2>
                      <p className="text-xs text-[#8A8A8A] mt-0.5">
                        Spatial coordinates and telemetry synchrony for this case.
                      </p>
                    </div>

                    <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Spatial Map Graphic */}
                  <div className="w-full h-80 bg-[#121212] rounded-[20px] p-6 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-mono text-white/60 z-10">
                      <span>LOCATION: {caseData.address}</span>
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white">
                        {caseData.latitude ? `${caseData.latitude}, ${caseData.longitude}` : "Standard Grid"}
                      </span>
                    </div>

                    <div className="relative flex-1 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-40 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                        <div className="w-24 h-24 rounded-full border border-[#0A66FF]/40 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-[#0A66FF]" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/60 font-mono z-10">
                      <span>Event Time: {caseData.accidentDate}</span>
                      <span>{caseData.evidenceList.length} Ingested Streams</span>
                    </div>
                  </div>

                  {/* 2 Metric Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-[20px] bg-[#F9F9F7] border border-[#EEEEEC] space-y-1">
                      <span className="text-xs font-bold text-[#111111] block">Spatial Mapping Coordinates</span>
                      <p className="text-[#8A8A8A] text-xs">
                        {caseData.latitude ? `${caseData.latitude}° N, ${caseData.longitude}° E` : "Assigned by territorial jurisdiction."}
                      </p>
                    </div>

                    <div className="p-5 rounded-[20px] bg-[#F9F9F7] border border-[#EEEEEC] space-y-1">
                      <span className="text-xs font-bold text-[#111111] block">Evidence Synchrony</span>
                      <p className="text-[#8A8A8A] text-xs">
                        {caseData.evidenceList.length} evidence file(s) synchronized to incident timeline.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </main>

      {/* VIEW EVIDENCE INSPECTION MODAL */}
      {viewingEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[28px] border border-[#F0F0F0] shadow-soft-hover w-full max-w-xl overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#EEEEEC] bg-[#F9F9F7]">
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
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#F9F9F7] rounded-[18px] border border-[#EEEEEC]">
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
                <p className="p-4 bg-[#F9F9F7] border border-[#EEEEEC] rounded-[18px] text-[#222222] leading-relaxed">
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

            <div className="px-6 py-4 border-t border-[#EEEEEC] bg-[#F9F9F7] flex items-center justify-between">
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

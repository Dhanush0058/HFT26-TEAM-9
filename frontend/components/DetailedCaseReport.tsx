"use client";

import React, { useState, useMemo } from "react";
import { 
  Download, 
  Printer, 
  ShieldCheck, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Car, 
  UserCheck,
  Compass,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { CaseDetail } from "@/lib/casesService";
import { generateDetailedForensicReport, downloadPdfReport } from "@/lib/reportGenerator";

interface DetailedCaseReportProps {
  caseData: CaseDetail;
}

export default function DetailedCaseReport({ caseData }: DetailedCaseReportProps) {
  const [activeChapter, setActiveChapter] = useState<"all" | "narrative" | "investigation" | "conflicts" | "findings">("all");
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    "Phase A": true,
    "Phase B": true,
    "Phase C": true,
    "Phase D": true,
    "Phase E": true
  });

  const report = useMemo(() => generateDetailedForensicReport(caseData), [caseData]);

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      downloadPdfReport(caseData);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  };

  const togglePhase = (phaseKey: string) => {
    setExpandedPhases(prev => ({ ...prev, [phaseKey]: !prev[phaseKey] }));
  };

  return (
    <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-8">
      
      {/* ── TOP HEADER & ACTIONS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#F0F0F0]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-[#8A8A8A]">
              Official Investigation Dossier
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCF5E3] text-[#1A7A2E] border border-[#C3ECCB] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Certified Dossier
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EBF3FF] text-[#0A66FF] border border-[#D0E2FF]">
              Ref: {report.caseMetadata.caseNumber}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#111111] flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#0A66FF]" />
            Comprehensive Forensic Investigation Report
          </h3>
          <p className="text-xs text-[#8A8A8A] max-w-2xl leading-relaxed">
            Detailed case dossier containing the full investigative progression, cross-evidence conflict reconciliations, and the step-by-step narrative of what actually occurred.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start lg:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => window.print()}
            className="h-10 px-4 rounded-full text-xs font-semibold text-[#111111] bg-[#F5F5F3] hover:bg-[#EAEAEA] border border-[#E0E0DE] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Print or Save via Browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-10 px-5 rounded-full text-xs font-bold text-white bg-[#121212] hover:bg-black transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-75"
            title="Download formatted PDF report"
          >
            {isDownloading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isDownloading ? "Generating PDF..." : "Download PDF Report"}</span>
          </button>
        </div>
      </div>

      {/* ── CHAPTER SELECTOR PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: "all", label: "Full Report Dossier" },
          { key: "narrative", label: "The Incident Story" },
          { key: "investigation", label: "Investigative Progression" },
          { key: "conflicts", label: "Conflict Reconciliation" },
          { key: "findings", label: "Findings & Liability" }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveChapter(tab.key as typeof activeChapter)}
            className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
              activeChapter === tab.key
                ? "bg-[#121212] text-white shadow-2xs"
                : "bg-[#F5F5F3] text-[#666666] hover:bg-[#EBEBEB] hover:text-[#111111]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SECTION I: THE INCIDENT STORY NARRATIVE ("WHAT ACTUALLY HAPPENED") ── */}
      {(activeChapter === "all" || activeChapter === "narrative") && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A66FF]">
                Chapter 01 &bull; Empirical Reconstruction
              </span>
              <h4 className="text-lg font-extrabold text-[#111111] mt-0.5 flex items-center gap-2">
                <Car className="w-4 h-4 text-[#0A66FF]" />
                The Incident Narrative: What Actually Happened
              </h4>
            </div>
            <span className="text-[11px] text-[#8A8A8A]">
              Physical Dynamics &amp; Optical Timecodes
            </span>
          </div>

          <div className="space-y-3">
            {/* Phase A */}
            <div className="p-5 rounded-[20px] bg-[#F5F8FF] border border-[#E0EBFB] space-y-2">
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => togglePhase("Phase A")}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0A66FF] text-white font-mono text-xs font-bold flex items-center justify-center">
                    A
                  </span>
                  <span className="text-sm font-extrabold text-[#111111]">
                    Pre-Collision Approach &amp; Roadway Environment
                  </span>
                </div>
                {expandedPhases["Phase A"] ? <ChevronUp className="w-4 h-4 text-[#8A8A8A]" /> : <ChevronDown className="w-4 h-4 text-[#8A8A8A]" />}
              </div>
              {expandedPhases["Phase A"] && (
                <p className="text-xs sm:text-[13px] text-[#333333] leading-relaxed pt-1 pl-8">
                  {report.incidentStoryNarrative.preCollisionApproach}
                </p>
              )}
            </div>

            {/* Phase B */}
            <div className="p-5 rounded-[20px] bg-[#F5F8FF] border border-[#E0EBFB] space-y-2">
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => togglePhase("Phase B")}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0A66FF] text-white font-mono text-xs font-bold flex items-center justify-center">
                    B
                  </span>
                  <span className="text-sm font-extrabold text-[#111111]">
                    Perception-Reaction Window &amp; Emergency Braking
                  </span>
                </div>
                {expandedPhases["Phase B"] ? <ChevronUp className="w-4 h-4 text-[#8A8A8A]" /> : <ChevronDown className="w-4 h-4 text-[#8A8A8A]" />}
              </div>
              {expandedPhases["Phase B"] && (
                <p className="text-xs sm:text-[13px] text-[#333333] leading-relaxed pt-1 pl-8">
                  {report.incidentStoryNarrative.reactionAndCriticalWindow}
                </p>
              )}
            </div>

            {/* Phase C */}
            <div className="p-5 rounded-[20px] bg-[#FFF8F7] border border-[#FFE7E5] space-y-2">
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => togglePhase("Phase C")}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#E11D48] text-white font-mono text-xs font-bold flex items-center justify-center">
                    C
                  </span>
                  <span className="text-sm font-extrabold text-[#111111]">
                    Point of Impact Dynamics &amp; Structural Kinematics
                  </span>
                </div>
                {expandedPhases["Phase C"] ? <ChevronUp className="w-4 h-4 text-[#8A8A8A]" /> : <ChevronDown className="w-4 h-4 text-[#8A8A8A]" />}
              </div>
              {expandedPhases["Phase C"] && (
                <p className="text-xs sm:text-[13px] text-[#333333] leading-relaxed pt-1 pl-8">
                  {report.incidentStoryNarrative.pointOfImpactDynamics}
                </p>
              )}
            </div>

            {/* Phase D */}
            <div className="p-5 rounded-[20px] bg-[#F5F8FF] border border-[#E0EBFB] space-y-2">
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => togglePhase("Phase D")}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#0A66FF] text-white font-mono text-xs font-bold flex items-center justify-center">
                    D
                  </span>
                  <span className="text-sm font-extrabold text-[#111111]">
                    Post-Impact Rest Position &amp; Emergency Deployment
                  </span>
                </div>
                {expandedPhases["Phase D"] ? <ChevronUp className="w-4 h-4 text-[#8A8A8A]" /> : <ChevronDown className="w-4 h-4 text-[#8A8A8A]" />}
              </div>
              {expandedPhases["Phase D"] && (
                <p className="text-xs sm:text-[13px] text-[#333333] leading-relaxed pt-1 pl-8">
                  {report.incidentStoryNarrative.postImpactRestAndEmergency}
                </p>
              )}
            </div>

            {/* Phase E */}
            <div className="p-5 rounded-[20px] bg-[#F0FDF4] border border-[#DCFCE7] space-y-2">
              <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => togglePhase("Phase E")}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#1A7A2E] text-white font-mono text-xs font-bold flex items-center justify-center">
                    E
                  </span>
                  <span className="text-sm font-extrabold text-[#111111]">
                    Investigative Synthesis &amp; Objective Ground Truth
                  </span>
                </div>
                {expandedPhases["Phase E"] ? <ChevronUp className="w-4 h-4 text-[#8A8A8A]" /> : <ChevronDown className="w-4 h-4 text-[#8A8A8A]" />}
              </div>
              {expandedPhases["Phase E"] && (
                <p className="text-xs sm:text-[13px] text-[#1E3A1E] leading-relaxed pt-1 pl-8">
                  {report.incidentStoryNarrative.investigativeSynthesis}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION II: INVESTIGATIVE PROGRESSION & INGESTION LOG ── */}
      {(activeChapter === "all" || activeChapter === "investigation") && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A66FF]">
                Chapter 02 &bull; Investigative Methodology
              </span>
              <h4 className="text-lg font-extrabold text-[#111111] mt-0.5 flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#0A66FF]" />
                How the Investigation Progressed
              </h4>
            </div>
            <span className="text-[11px] text-[#8A8A8A]">
              Sequential Evidence Acquisition
            </span>
          </div>

          <p className="text-xs text-[#555555] leading-relaxed">
            {report.investigationProgression.overview}
          </p>

          {/* Sequential Phases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {report.investigationProgression.phases.map((phase) => (
              <div key={phase.stepNumber} className="p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E4ECFB] text-[#0A66FF]">
                    {phase.stepNumber}
                  </span>
                  <span className="text-[11px] text-[#8A8A8A] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {phase.timestamp}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-[#111111]">
                  {phase.title}
                </h5>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  {phase.description}
                </p>
                <div className="pt-1 flex flex-wrap gap-1">
                  {phase.evidenceAcquired.map((fName, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white border border-[#E0E0DE] text-[#333333]">
                      {fName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Ingested Evidence Sources Table */}
          <div className="overflow-x-auto rounded-[18px] border border-[#EEEEEC] pt-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F9F7] border-b border-[#EEEEEC] text-[11px] font-bold text-[#666666]">
                  <th className="py-2.5 px-4">Evidence Asset</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-4">Extraction Finding</th>
                  <th className="py-2.5 px-4">Physical Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEC]">
                {report.investigationProgression.evidenceRecords.map((rec, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAFA] transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-[#111111]">
                      {rec.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0F0F0] text-[#444444]">
                        {rec.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#777777]">{rec.size}</td>
                    <td className="py-2.5 px-4 text-[#444444] leading-relaxed">{rec.observations}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-[#0A66FF]">{rec.telemetry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SECTION III: CROSS-SOURCE CONFLICT ANALYSIS & RESOLUTION ── */}
      {(activeChapter === "all" || activeChapter === "conflicts") && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A66FF]">
                Chapter 03 &bull; Cross-Source Conflict Resolution
              </span>
              <h4 className="text-lg font-extrabold text-[#111111] mt-0.5 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Cross-Evidence Corroboration &amp; Discrepancy Resolution
              </h4>
            </div>
            <span className="text-[11px] text-[#8A8A8A]">
              Subjective Testimonies vs Hardware Ground Truth
            </span>
          </div>

          <p className="text-xs text-[#555555] leading-relaxed">
            {report.conflictAnalysis.summary}
          </p>

          <div className="space-y-3">
            {report.conflictAnalysis.discrepancies.map((disc, idx) => (
              <div key={idx} className="p-5 rounded-[20px] bg-white border border-[#EAEAEA] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#E11D48] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
                    Contradiction #{idx + 1}: {disc.disputedTopic}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEAEA] text-[#E11D48]">
                    Flagged Discrepancy
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-[14px] bg-[#FFF8F7] border border-[#FFE7E5] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#B91C1C]">
                      Subjective Witness Deposition:
                    </span>
                    <p className="text-xs text-[#444444] leading-relaxed">
                      &ldquo;{disc.witnessClaim}&rdquo;
                    </p>
                  </div>

                  <div className="p-3.5 rounded-[14px] bg-[#F5F8FF] border border-[#E0EBFB] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#0A66FF]">
                      Empirical Optical &amp; Sensor Record:
                    </span>
                    <p className="text-xs text-[#1E3A8A] leading-relaxed">
                      {disc.opticalSensorReality}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-[14px] bg-[#F0FDF4] border border-[#DCFCE7] space-y-1">
                  <span className="text-[10px] font-bold uppercase text-[#1A7A2E] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Forensic Determination:
                  </span>
                  <p className="text-xs text-[#155724] leading-relaxed">
                    {disc.forensicConclusion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION IV: FINDINGS, LIABILITY & SIGNOFF ── */}
      {(activeChapter === "all" || activeChapter === "findings") && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0A66FF]">
                Chapter 04 &bull; Official Determination
              </span>
              <h4 className="text-lg font-extrabold text-[#111111] mt-0.5 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0A66FF]" />
                Forensic Causation, Liability &amp; Certification
              </h4>
            </div>
            <span className="text-[11px] text-[#8A8A8A]">
              Legal Admissibility Package
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Cause */}
            <div className="p-5 rounded-[20px] bg-[#F9F9F7] border border-[#EEEEEC] space-y-2">
              <span className="text-[11px] font-bold uppercase text-[#8A8A8A]">
                Primary Physical Causation
              </span>
              <p className="text-xs sm:text-[13px] font-bold text-[#111111] leading-relaxed">
                {report.findingsAndLiability.primaryCause}
              </p>
            </div>

            {/* Liability Assessment */}
            <div className="p-5 rounded-[20px] bg-[#F9F9F7] border border-[#EEEEEC] space-y-2">
              <span className="text-[11px] font-bold uppercase text-[#8A8A8A]">
                Liability Allocation
              </span>
              <p className="text-xs sm:text-[13px] font-bold text-[#111111] leading-relaxed">
                {report.findingsAndLiability.liabilityAssessment}
              </p>
            </div>
          </div>

          {/* Contributing Factors */}
          <div className="p-5 rounded-[20px] bg-[#F5F8FF] border border-[#E0EBFB] space-y-2">
            <span className="text-[11px] font-bold uppercase text-[#0A66FF]">
              Contributing Environmental &amp; Roadway Factors
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {report.findingsAndLiability.contributingFactors.map((factor, idx) => (
                <div key={idx} className="p-3 rounded-[14px] bg-white border border-[#E0EBFB] text-xs text-[#333333] leading-relaxed">
                  &bull; {factor}
                </div>
              ))}
            </div>
          </div>

          {/* Certification Signoff Card */}
          <div className="p-5 rounded-[20px] bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase text-[#64748B] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0A66FF]" /> Certified Digital Attestation
              </span>
              <div className="text-sm font-extrabold text-[#0F172A]">
                {report.findingsAndLiability.investigatorSignoff.officer}
              </div>
              <div className="text-xs text-[#64748B]">
                {report.findingsAndLiability.investigatorSignoff.credentials} &bull; Verified on {report.findingsAndLiability.investigatorSignoff.date}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right sm:block hidden">
                <div className="text-[10px] font-mono text-[#94A3B8]">HASH ID</div>
                <div className="text-[11px] font-mono font-bold text-[#0F172A]">REKISHI-SEAL-{caseData.caseNumber}</div>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="h-10 px-5 rounded-full text-xs font-bold text-white bg-[#0A66FF] hover:bg-[#0052D6] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


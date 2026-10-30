"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, 
  MoreHorizontal
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { getStoredCases, getRecentActivities, CaseDetail, ActivityFeedItem } from "@/lib/casesService";

export default function DashboardMetricsPage() {
  const [cases, setCases] = useState<CaseDetail[]>([]);
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBar, setActiveBar] = useState<number>(4); // Default selected bar (2025/latest)

  useEffect(() => {
    setCases(getStoredCases());
    setActivities(getRecentActivities());
  }, []);

  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.status === "In Review" || c.status === "Flagged Contradiction").length;
  const totalEvidence = cases.reduce((acc, c) => acc + c.evidenceList.length, 0);

  // Capsule bar data for the reference-style chart
  const intakeYears = [
    { label: "May", height: 45, value: "14 cases" },
    { label: "Jun", height: 65, value: "21 cases" },
    { label: "Jul", height: 50, value: "18 cases" },
    { label: "Aug", height: 80, value: "32 cases" },
    { label: "Sep", height: 95, value: "48 cases" },
    { label: "Oct", height: 70, value: "26 cases" },
    { label: "Nov", height: 60, value: "20 cases" }
  ];

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#111111] font-sans">
      
      {/* Fixed Sidebar touching screen edges */}
      <Sidebar currentTab="dashboard" casesCount={cases.length} />

      {/* Fixed Topbar touching screen edges */}
      <TopHeader 
        title="Dashboard" 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search incident records..."
      />

      {/* Main Content Area starting after sidebar (260px) and topbar (72px + 32px breathing room) */}
      <main 
        style={{ marginLeft: "260px", paddingTop: "104px" }}
        className="ml-[260px] pt-[104px] px-6 sm:px-8 pb-12 min-h-screen"
      >
        <div className="space-y-6">
            
            {/* ─────────────────────────────────────────────────────────────
                TOP CARDS ROW (3 Metric Cards matching Reference Image:
                - 24px Radius, pure white, 3-dot circular button on top-right,
                - 13px grey top-left label, 44px bold number, pill trend badge)
            ───────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Total Cases */}
              <div className="bg-white rounded-[24px] p-6 shadow-soft border border-[#F0F0F0] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] font-medium text-[#8A8A8A]">
                    Total Registered Cases
                  </span>
                  <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-[44px] font-extrabold tracking-tight text-[#111111] leading-none">
                    {totalCases}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCF5E3] text-[#1A7A2E]">
                    +12%
                  </span>
                </div>

                <div className="text-[12px] text-[#8A8A8A] mt-2">
                  Dossiers active in storage
                </div>
              </div>

              {/* Card 2: Active Investigations */}
              <div className="bg-white rounded-[24px] p-6 shadow-soft border border-[#F0F0F0] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] font-medium text-[#8A8A8A]">
                    Active Investigations
                  </span>
                  <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-[44px] font-extrabold tracking-tight text-[#111111] leading-none">
                    {activeCases}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCF5E3] text-[#1A7A2E]">
                    +4%
                  </span>
                </div>

                <div className="text-[12px] text-[#8A8A8A] mt-2">
                  Under ongoing reconstruction
                </div>
              </div>

              {/* Card 3: Evidence Files */}
              <div className="bg-white rounded-[24px] p-6 shadow-soft border border-[#F0F0F0] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] font-medium text-[#8A8A8A]">
                    Total Evidence Ingested
                  </span>
                  <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-[44px] font-extrabold tracking-tight text-[#111111] leading-none">
                    {totalEvidence}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCF5E3] text-[#1A7A2E]">
                    +24%
                  </span>
                </div>

                <div className="text-[12px] text-[#8A8A8A] mt-2">
                  Video, audio, sensor & PDF sources
                </div>
              </div>

            </div>

            {/* ─────────────────────────────────────────────────────────────
                MIDDLE SECTION:
                Left: Capsule-Shaped Bar Chart (Cloned from Reference Image)
                Right: "How Our System Works" & "Recent Activity" 24px cards
            ───────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Capsule Chart Card (Span 7) */}
              <div className="lg:col-span-7 bg-white rounded-[24px] p-6 shadow-soft border border-[#F0F0F0] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[13px] font-medium text-[#8A8A8A]">
                      Intake Volume Over Time
                    </span>
                    <h2 className="text-xl font-extrabold text-[#111111] mt-0.5">
                      Case Analysis Activity
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 bg-[#F5F5F3] rounded-full text-[#111111]">
                      Weekly
                    </span>
                    <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111]">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Capsule-shaped Bar Chart (Reference Design) */}
                <div className="h-60 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
                  {intakeYears.map((bar, i) => {
                    const isSelected = activeBar === i;
                    return (
                      <div 
                        key={i} 
                        onClick={() => setActiveBar(i)}
                        className="flex-1 flex flex-col items-center gap-2 cursor-pointer group"
                      >
                        {/* Tooltip on active */}
                        {isSelected && (
                          <div className="px-2 py-1 bg-[#121212] text-white text-[10px] font-bold rounded-full shadow-sm animate-in fade-in">
                            {bar.value}
                          </div>
                        )}

                        {/* The Capsule / Pill Bar (fully rounded top and bottom) */}
                        <div className="w-full max-w-[42px] bg-[#F5F5F3] rounded-full h-44 flex flex-col justify-end p-1 transition-all">
                          <div 
                            className={`w-full rounded-full transition-all duration-300 ${
                              isSelected ? "bg-[#0A66FF]" : "bg-[#EAEAEA] group-hover:bg-[#DFDFDF]"
                            }`}
                            style={{ height: `${bar.height}%` }}
                          />
                        </div>

                        <span className={`text-xs font-medium ${isSelected ? "text-[#111111] font-bold" : "text-[#8A8A8A]"}`}>
                          {bar.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#F5F5F3] text-xs text-[#8A8A8A]">
                  <span>Timeline synchronization efficiency</span>
                  <span className="font-bold text-[#111111]">99.4% precision</span>
                </div>
              </div>

              {/* Right Column: "How Our System Works" & "Recent Activity" (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* How Our System Works Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-soft border border-[#F0F0F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#8A8A8A]">
                      Platform Architecture
                    </span>
                    <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A]">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[#111111]">
                    How Our System Works
                  </h3>

                  <p className="text-xs text-[#8A8A8A] leading-relaxed">
                    Our system uses AI models to analyze various types of inputs (audio, video, text, PDF). As new evidence is uploaded, the summary is dynamically updated.
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="p-3 bg-[#F9F9F7] rounded-[16px] flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#121212] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        1
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-[#111111]">Multi-Source Ingest</div>
                        <div className="text-[11px] text-[#8A8A8A]">Dashcam, audio notes, police files</div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F9F9F7] rounded-[16px] flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#121212] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        2
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-[#111111]">Dynamic Reconstruction</div>
                        <div className="text-[11px] text-[#8A8A8A]">Automatic timeline synchronization</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real Activity Feed Card */}
                <div className="bg-white rounded-[24px] p-6 shadow-soft border border-[#F0F0F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#8A8A8A]">
                      Audit Trail
                    </span>
                    <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A]">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[#111111]">
                    Recent Activity
                  </h3>

                  {activities.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {activities.slice(0, 4).map((act) => (
                        <div key={act.id} className="flex items-start gap-2.5 text-xs pb-2 border-b border-[#F5F5F3] last:border-0">
                          <div className="w-2 h-2 rounded-full bg-[#0A66FF] mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[#111111] font-medium">{act.action}</div>
                            <div className="text-[10px] text-[#8A8A8A] mt-0.5">{act.timestamp}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-[#8A8A8A]">
                      No activity logged yet.
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Bottom Navigation CTA Card (24px radius, black button) */}
            <div className="bg-white rounded-[24px] p-6 shadow-soft border border-[#F0F0F0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111111]">Incident Dossiers</h3>
                <p className="text-xs text-[#8A8A8A] mt-0.5">Explore active accident records or register a new intake.</p>
              </div>
              <Link
                href="/cases"
                className="h-11 px-6 rounded-full bg-[#121212] text-white hover:bg-black text-xs font-semibold flex items-center gap-2 transition shadow-sm"
              >
                <span>View All Cases</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
      </main>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  MapPin, 
  User, 
  FileText,
  Plus
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { CaseItem, INITIAL_CASES } from "./data";
import CreateCaseModal from "./CreateCaseModal";

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>(INITIAL_CASES);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "FLAGGED" | "VERIFIED">("ALL");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filter & Search Logic
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.officer.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "FLAGGED") return c.status === "Flagged Contradiction";
    if (activeFilter === "VERIFIED") return c.status === "Verified Consistent";
    return true;
  });

  const handleCaseCreated = (newCase: CaseItem) => {
    setCases([newCase, ...cases]);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex font-sans">
      
      {/* Sidebar with 4 clean options */}
      <Sidebar currentTab="cases" casesCount={cases.length} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header with Search, Filter & Profile */}
        <TopHeader
          title="Cases"
          showSearchAndFilter={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          isFilterMenuOpen={isFilterMenuOpen}
          setIsFilterMenuOpen={setIsFilterMenuOpen}
        />

        {/* Content Area */}
        <main className="flex-1 w-full px-6 sm:px-8 py-6 max-w-6xl">
          
          {/* ─────────────────────────────────────────────────────────
              1. FIXED TOP '+ CREATE' RECTANGLE
              - Solid blue background (`bg-blue-600`)
              - White text
              - Plus icon on left + text
          ───────────────────────────────────────────────────────── */}
          <div
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full mb-5 px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-all duration-150 cursor-pointer flex items-center gap-3.5 select-none"
          >
            <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center text-white shrink-0">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-base font-semibold leading-tight">
                Create New Case
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Click to ingest new dashcam video, witness statements, or sensor data
              </p>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              2. VERTICAL LIST OF CASE RECTANGLES
          ───────────────────────────────────────────────────────── */}
          <div className="space-y-3.5">
            {filteredCases.map((caseItem) => (
              <Link
                key={caseItem.id}
                href={`/cases/${caseItem.id}`}
                className="group block w-full bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-5 shadow-2xs hover:shadow-xs transition-all duration-150"
              >
                {/* Top Row: Case Name (left) & Case ID Box (right) */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {caseItem.name}
                    </h2>
                  </div>

                  {/* Framed Case ID Box */}
                  <div className="px-3 py-1 rounded border border-slate-300 text-slate-700 text-xs font-mono font-semibold bg-slate-50 shrink-0">
                    {caseItem.id}
                  </div>
                </div>

                {/* Bottom Row: Additional Details (date, address, officer) */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{caseItem.date}</span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{caseItem.address}</span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Officer: <strong className="text-slate-700 font-medium">{caseItem.officer}</strong> ({caseItem.department})
                    </span>
                  </span>
                </div>
              </Link>
            ))}

            {filteredCases.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200 p-8">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-700">No matching incident cases found</h3>
                <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filter</p>
                <button
                  onClick={() => { setSearchQuery(""); setActiveFilter("ALL"); }}
                  className="mt-3 text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* CREATE CASE MODAL */}
      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCaseCreated={handleCaseCreated}
      />

    </div>
  );
}


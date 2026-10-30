"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, 
  MapPin, 
  User, 
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { getStoredCases, deleteCase, CaseDetail } from "@/lib/casesService";

export default function CasesPage() {
  const [cases, setCases] = useState<CaseDetail[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "FLAGGED" | "VERIFIED">("ALL");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  useEffect(() => {
    // Load persisted cases from local storage / API
    setCases(getStoredCases());
  }, []);

  // Filter & Search Logic
  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.filedBy.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "FLAGGED") return c.status === "Flagged Contradiction";
    if (activeFilter === "VERIFIED") return c.status === "Verified Consistent";
    return true;
  });

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
              - Direct navigation to /cases/new (NO MODAL)
              - Solid blue background (`bg-blue-600`)
              - White text
              - Plus icon on left + text to create a new case
          ───────────────────────────────────────────────────────── */}
          <Link
            href="/cases/new"
            className="w-full mb-5 px-5 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-all duration-150 cursor-pointer flex items-center gap-3.5 select-none block"
          >
            <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center text-white shrink-0">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-base font-semibold leading-tight">
                Create New Case
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Click to open case intake form and upload multi-source digital evidence
              </p>
            </div>
          </Link>

          {/* ─────────────────────────────────────────────────────────
              2. VERTICAL LIST OF CASE RECTANGLES
              - On clicking ANY case card, opens /cases/[caseId]
              - Clean layout:
                * Case Name on top left
                * Case ID in framed box on top right
                * Date, Address, Officer on bottom
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

                  {/* Framed Case ID Box & Delete Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-1 rounded border border-slate-300 text-slate-700 text-xs font-mono font-semibold bg-slate-50 shrink-0">
                      {caseItem.caseNumber}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`Delete case "${caseItem.name}" (${caseItem.caseNumber})?`)) {
                          const updated = deleteCase(caseItem.id);
                          setCases([...updated]);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition"
                      title="Delete Case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Additional Details (date, address, officer) */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Accident: {caseItem.accidentDate}</span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{caseItem.address}</span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Officer: <strong className="text-slate-700 font-medium">{caseItem.filedBy}</strong>
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

    </div>
  );
}

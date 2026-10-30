import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";

interface TopHeaderProps {
  title: string;
  showSearchAndFilter?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  activeFilter?: "ALL" | "FLAGGED" | "VERIFIED";
  onFilterChange?: (val: "ALL" | "FLAGGED" | "VERIFIED") => void;
  isFilterMenuOpen?: boolean;
  setIsFilterMenuOpen?: (val: boolean) => void;
}

export default function TopHeader({
  title,
  showSearchAndFilter = false,
  searchQuery = "",
  onSearchChange,
  activeFilter = "ALL",
  onFilterChange,
  isFilterMenuOpen = false,
  setIsFilterMenuOpen,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80">
      <div className="w-full px-6 sm:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Page Title */}
        <div>
          <h1 className="text-sm font-bold text-slate-800">
            {title}
          </h1>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          {showSearchAndFilter && (
            <>
              {/* Filter Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFilterMenuOpen && setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className={`flex items-center gap-2 h-9 px-3 rounded-md border text-xs font-medium transition ${
                    activeFilter !== "ALL"
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                  <span>Filter</span>
                </button>

                {isFilterMenuOpen && onFilterChange && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                    <button
                      onClick={() => { onFilterChange("ALL"); setIsFilterMenuOpen && setIsFilterMenuOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium ${
                        activeFilter === "ALL" ? "text-blue-600 bg-blue-50/70 font-semibold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      All Cases
                    </button>
                    <button
                      onClick={() => { onFilterChange("FLAGGED"); setIsFilterMenuOpen && setIsFilterMenuOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium ${
                        activeFilter === "FLAGGED" ? "text-rose-600 bg-rose-50/70 font-semibold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Flagged Contradictions
                    </button>
                    <button
                      onClick={() => { onFilterChange("VERIFIED"); setIsFilterMenuOpen && setIsFilterMenuOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-xs font-medium ${
                        activeFilter === "VERIFIED" ? "text-emerald-600 bg-emerald-50/70 font-semibold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Verified Consistent
                    </button>
                  </div>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-64 sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search cases, ID, officer..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange && onSearchChange("")}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </>
          )}

          {/* Demo Profile Account Icon */}
          <div className="flex items-center pl-1">
            <div 
              title="Demo Account" 
              className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs cursor-pointer hover:bg-slate-200 transition"
            >
              JD
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}


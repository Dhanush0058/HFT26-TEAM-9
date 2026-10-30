import React from "react";
import { Search, Bell } from "lucide-react";

interface TopHeaderProps {
  title: string;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
}

export default function TopHeader({
  title,
  showSearch = true,
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Start searching here...",
}: TopHeaderProps) {
  return (
    <header className="w-full flex items-center justify-between gap-4 mb-6">
      
      {/* Title / Section Name */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#111111] font-sans">
          {title}
        </h1>
      </div>

      {/* Right Search Bar & Utility Icons (Reference Style) */}
      <div className="flex items-center gap-3">
        {showSearch && onSearchChange && (
          <div className="relative w-72 sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#8A8A8A]" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-[#EAEAEA] rounded-full text-xs text-[#111111] placeholder-[#8A8A8A] focus:outline-none focus:border-[#111111] transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-[#8A8A8A] hover:text-[#111111]"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Action icons like in reference */}
        <div className="w-10 h-10 rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center text-[#111111] hover:bg-[#F9F9F7] cursor-pointer transition shadow-2xs">
          <Bell className="w-4 h-4 text-[#8A8A8A]" />
        </div>

        {/* User Avatar circle */}
        <div 
          title="Investigator Profile"
          className="w-10 h-10 rounded-full bg-[#121212] text-white flex items-center justify-center text-xs font-bold shadow-2xs cursor-pointer select-none"
        >
          JD
        </div>
      </div>

    </header>
  );
}

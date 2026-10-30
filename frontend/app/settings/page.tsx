"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { CheckCircle2, Save, MoreHorizontal } from "lucide-react";

export default function SettingsPage() {
  const [autoExtract, setAutoExtract] = useState(true);
  const [timeFormat, setTimeFormat] = useState("dual");
  const [auditLogging, setAuditLogging] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#111111] p-4 sm:p-6 font-sans">
      <div className="w-full flex gap-6">
        
        {/* Floating Sidebar */}
        <Sidebar currentTab="settings" />

        <div className="flex-1 min-w-0">
          
          <TopHeader title="Settings" showSearch={false} />

          <main className="max-w-5xl space-y-6">
            
            <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-soft border border-[#F0F0F0] space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-medium text-[#8A8A8A]">
                    Configuration & Preferences
                  </span>
                  <h2 className="text-xl font-extrabold text-[#111111] mt-0.5">
                    System Settings
                  </h2>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">
                    Configure processing behaviors and default forensic timeline presentation.
                  </p>
                </div>

                <button className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] transition">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 pt-2">
                
                {/* Auto Metadata Extraction */}
                <div className="flex items-center justify-between p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC] hover:border-[#111111] transition">
                  <div className="pr-4">
                    <label className="text-xs font-bold text-[#111111] block">
                      Automatic Evidence Extraction
                    </label>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">
                      Extract timestamps and file metadata immediately upon intake.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={autoExtract}
                      onChange={(e) => setAutoExtract(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#E5E5E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#121212]"></div>
                  </label>
                </div>

                {/* Timeline Display Mode */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC] hover:border-[#111111] transition">
                  <div>
                    <label className="text-xs font-bold text-[#111111] block">
                      Default Timeline Format
                    </label>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">
                      Choose how chronological incident records are formatted across case dossiers.
                    </p>
                  </div>
                  <select
                    value={timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="h-10 px-4 text-xs font-semibold bg-white border border-[#EEEEEC] rounded-full text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#121212] shrink-0"
                  >
                    <option value="dual">Dual Timelines (Accident Event + Upload Time)</option>
                    <option value="event">Event-Centric Only</option>
                    <option value="system">Upload Time Ordered</option>
                  </select>
                </div>

                {/* Audit Logging */}
                <div className="flex items-center justify-between p-4 rounded-[18px] bg-[#F9F9F7] border border-[#EEEEEC] hover:border-[#111111] transition">
                  <div className="pr-4">
                    <label className="text-xs font-bold text-[#111111] block">
                      Chain of Custody Audit Logging
                    </label>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">
                      Record all evidence intake, timeline alterations, and case modifications.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={auditLogging}
                      onChange={(e) => setAuditLogging(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[#E5E5E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#121212]"></div>
                  </label>
                </div>

              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-[#F0F0F0] flex items-center justify-between">
                <div>
                  {isSaved && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DCF5E3] text-[#1A7A2E] animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Preferences updated successfully
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  className="h-10 px-6 rounded-full bg-[#121212] hover:bg-black text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Preferences</span>
                </button>
              </div>

            </div>

          </main>

        </div>

      </div>
    </div>
  );
}

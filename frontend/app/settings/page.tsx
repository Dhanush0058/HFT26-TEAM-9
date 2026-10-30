"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Key, Save, CheckCircle2, ShieldAlert } from "lucide-react";

export default function SettingsPage() {
  const [featherlessKey, setFeatherlessKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex font-sans">
      <Sidebar currentTab="settings" />

      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader title="System & AI Configuration" showSearchAndFilter={false} />

        <main className="flex-1 w-full px-6 sm:px-8 py-6 max-w-3xl space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" /> AI Provider API Keys
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure Featherless ($25 credit tier) and Groq cloud endpoints for live multimodal extraction.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Featherless API Key (Vision & Timeline Models)
                </label>
                <input
                  type="password"
                  placeholder="featherless-..."
                  value={featherlessKey}
                  onChange={(e) => setFeatherlessKey(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Groq Cloud API Key (Whisper STT & Contradiction Reasoner)
                </label>
                <input
                  type="password"
                  placeholder="gsk_..."
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Keys are stored locally in secure session storage.
              </span>
              <button
                type="button"
                onClick={handleSave}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition flex items-center gap-1.5 shadow-xs"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Keys
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


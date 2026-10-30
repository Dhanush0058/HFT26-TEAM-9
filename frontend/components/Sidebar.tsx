import React from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  BarChart3, 
  FileText, 
  Settings
} from "lucide-react";

interface SidebarProps {
  currentTab: "dashboard" | "cases" | "docs" | "settings";
  casesCount?: number;
}

export default function Sidebar({ currentTab, casesCount = 3 }: SidebarProps) {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      href: "/dashboard",
    },
    {
      id: "cases",
      label: "Cases",
      icon: FolderKanban,
      href: "/cases",
      badge: casesCount,
    },
    {
      id: "docs",
      label: "Docs",
      icon: FileText,
      href: "/docs",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            R
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-950 font-sans">
            rekishi
          </span>
        </div>

        {/* 4 Clean Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? "bg-blue-100 text-blue-700 font-bold" : "bg-slate-100 text-slate-600"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom AI Status Indicator */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-800">Forensic Core</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Featherless VLM + Groq Active
          </p>
        </div>
      </div>
    </aside>
  );
}


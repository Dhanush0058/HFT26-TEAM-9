import React from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  BarChart3, 
  FileText, 
  Settings,
  Shield,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  currentTab: "dashboard" | "cases" | "docs" | "settings";
  casesCount?: number;
}

export default function Sidebar({ currentTab, casesCount = 0 }: SidebarProps) {
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
      badge: casesCount > 0 ? casesCount : undefined,
    },
    {
      id: "docs",
      label: "Documentation",
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
    <aside 
      style={{ position: "fixed", left: 0, top: 0, height: "100vh", width: "260px", margin: 0 }}
      className="fixed left-0 top-0 h-screen w-[260px] m-0 z-30 bg-white border-r border-[#F0F0F0] flex flex-col justify-between p-5 select-none"
    >
      <div>
        {/* Logo / Header in reference style */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#121212] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-[#111111]">
              RIKESHI
            </div>
            <div className="text-[11px] text-[#8A8A8A] font-medium">
              Forensics Intelligence
            </div>
          </div>
        </div>

        {/* Menu items list */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#121212] text-white shadow-sm"
                    : "text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F9F9F7]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#8A8A8A]"}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>

                {isActive ? (
                  <ChevronRight className="w-4 h-4 text-white/80" />
                ) : item.badge !== undefined ? (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#F5F5F3] text-[#8A8A8A]">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Minimalist Bottom Info Card */}
      <div className="pt-4 border-t border-[#F5F5F3] px-2">
        <div className="text-xs font-bold text-[#111111]">System Active</div>
        <div className="text-[11px] text-[#8A8A8A] mt-0.5">Version 2.0 • Online</div>
      </div>
    </aside>
  );
}

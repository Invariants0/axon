"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Activity,
  PackageOpen,
  Code2,
  GitMerge,
  BarChart2,
  History,
  Settings,
  BrainCircuit,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";

const navItems = [
  { name: "Control Room", href: "/dashboard", icon: LayoutDashboard },
  { name: "Task Execution", href: "/dashboard/execution", icon: Activity },
  { name: "Skills Registry", href: "/dashboard/skills", icon: PackageOpen },
  { name: "Code Evolution", href: "/dashboard/code", icon: Code2 },
  { name: "Evolution Log", href: "/dashboard/evolution", icon: GitMerge },
  { name: "System Metrics", href: "/dashboard/metrics", icon: BarChart2 },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { skills, isEvolutionActive, systemStatus } = useAppStore();

  return (
    <aside className="w-64 border-r border-white/[0.06] bg-black/30 backdrop-blur-xl flex-col hidden lg:flex shrink-0">
      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 mb-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30">
            Navigation
          </p>
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-white/[0.08] text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    isActive ? "text-primary" : "text-white/40 group-hover:text-white/60"
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom widgets */}
      <div className="p-3 space-y-3 border-t border-white/[0.06]">
        {/* Evolution Status Card */}
        <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`w-3.5 h-3.5 ${isEvolutionActive ? "text-primary animate-pulse" : "text-white/30"}`} />
              <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/40">
                Evolution
              </span>
            </div>
            <span className={`text-[10px] font-mono font-medium ${
              isEvolutionActive ? "text-primary" : "text-white/30"
            }`}>
              {isEvolutionActive ? "Active" : "Idle"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isEvolutionActive
                    ? "bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-pulse w-full"
                    : "bg-white/10 w-0"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Skills Count */}
        <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06] p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-emerald-400/70" />
              <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-white/40">
                Skills Loaded
              </span>
            </div>
            <span className="text-lg font-mono font-bold text-white/90">
              {skills.length}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

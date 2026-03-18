"use client";

import { useAppStore } from "@/store/app-store";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Activity,
  LayoutDashboard,
  GitMerge,
  Network,
  Code2,
  BarChart2,
  History,
  Settings,
  PackageOpen,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EtheralShadow } from "@/components/ui/etheral-shadow";
import { NotificationBar } from "@/components/ui/notifications";
import type { PersonaMode } from "@/types";

const navItems = [
  { name: "Control Room", href: "/dashboard", icon: LayoutDashboard },
  { name: "Task Execution", href: "/dashboard/execution", icon: Activity },
  { name: "Skills Registry", href: "/dashboard/skills", icon: PackageOpen },
  { name: "Code Evolution", href: "/dashboard/code", icon: Code2 },
  { name: "Evolution Versions", href: "/dashboard/evolution", icon: GitMerge },
  { name: "System Metrics", href: "/dashboard/metrics", icon: BarChart2 },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { version, systemStatus, activeAgents, persona, setPersona } =
    useAppStore();

  return (
    <EtheralShadow
      color="rgba(15, 15, 15, 1)"
      animation={{ scale: 80, speed: 20 }}
      noise={{ opacity: 0.5, scale: 1.2 }}
      sizing="fill"
      className="min-h-screen flex flex-col overflow-hidden selection:bg-primary/30 relative"
    >
      <div className="flex flex-col h-screen relative z-10 text-foreground">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-50 shrink-0">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                <BrainCircuit className="w-5 h-5 text-primary" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight">
                AXON
              </span>
            </Link>

            <div className="h-6 w-[1px] bg-white/10"></div>

            <AnimatePresence mode="wait">
              <motion.div
                key={version}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20"
              >
                <SparklesIcon className="w-3 h-3 text-primary" />
                <span className="text-sm font-mono font-medium text-primary">
                  {version}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-blue-500/80 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></span>
                  Agents:{" "}
                  <span className="text-foreground">{activeAgents}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="bg-[#0a0a0a] border-white/10 w-56 p-2"
                >
                  <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground px-2 py-1 mb-1">
                    Active Neural Nodes
                  </div>
                  {[
                    {
                      name: "Core-Reasoning-01",
                      status: "Optimal",
                      load: "12%",
                    },
                    { name: "File-Indexer-Alpha", status: "Idle", load: "2%" },
                    {
                      name: "Network-Sentinel",
                      status: "Scanning",
                      load: "45%",
                    },
                    {
                      name: "Evolution-Architect",
                      status: "Simulating",
                      load: "89%",
                    },
                  ].map((agent) => (
                    <div
                      key={agent.name}
                      className="p-2 rounded-md hover:bg-white/5 flex flex-col gap-1 border border-transparent hover:border-white/5 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">
                          {agent.name}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-mono">
                          {agent.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: agent.load }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono">
                          {agent.load}
                        </span>
                      </div>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2 text-muted-foreground">
                <span
                  className={`w-2 h-2 rounded-full ${systemStatus === "Live" ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : systemStatus === "Evolving" ? "bg-primary animate-pulse shadow-[0_0_5px_rgba(168,85,247,0.5)]" : "bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]"}`}
                ></span>
                Status: <span className="text-foreground">{systemStatus}</span>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-white/10 bg-white/5 hover:bg-white/10 h-9 px-4 py-2 outline-none">
                {persona}{" "}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#0a0a0a] border-white/10"
              >
                {([
                  "Engineer",
                  "Research Scientist",
                  "Startup Hacker",
                  "Minimal Agent",
                ] as PersonaMode[]).map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onClick={() => setPersona(p)}
                    className="hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                  >
                    {p}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>


          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar */}
          <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-md flex-col hidden lg:flex shrink-0">
            <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? "bg-primary/10 text-primary font-medium border border-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"}`}
                    >
                      <item.icon
                        className={`w-5 h-5 ${isActive ? "text-primary" : ""}`}
                      />
                      {item.name}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/5">
              <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">
                  System Load
                </div>
                <div className="flex items-end gap-2">
                  <div className="text-2xl font-mono font-bold">24%</div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full mb-1.5 overflow-hidden">
                    <div className="h-full bg-primary w-[24%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden bg-transparent relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>
            {children}
          </main>
        </div>
      </div>

      {/* Global Notification Toast Bar */}
      <NotificationBar />
    </EtheralShadow>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

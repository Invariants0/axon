"use client";

import { EtheralShadow } from "@/components/ui/etheral-shadow";
import { NotificationBar } from "@/components/ui/notifications";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EtheralShadow
      color="rgba(12, 12, 12, 1)"
      animation={{ scale: 80, speed: 18 }}
      noise={{ opacity: 0.4, scale: 1.2 }}
      sizing="fill"
      className="min-h-screen flex flex-col overflow-hidden selection:bg-primary/30 relative"
    >
      <div className="flex flex-col h-screen relative z-10 text-foreground">
        {/* Top Bar */}
        <DashboardHeader />

        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Sidebar */}
          <DashboardSidebar />

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden bg-transparent relative">
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.03] blur-[120px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-blue-500/[0.02] blur-[100px] rounded-full pointer-events-none -z-10" />
            {children}
          </main>
        </div>
      </div>

      {/* Global Notification Toast */}
      <NotificationBar />
    </EtheralShadow>
  );
}

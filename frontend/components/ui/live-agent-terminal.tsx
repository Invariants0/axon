"use client";

import { useAppStore } from "@/store/app-store";
import { Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

export function LiveAgentTerminal() {
  const { logs } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <Card className="flex flex-col border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl shrink-0 group">
      <CardHeader className="py-3 px-5 border-b border-white/5 bg-white/5">
        <CardTitle className="text-xs font-semibold flex items-center justify-between tracking-tight">
          <div className="flex items-center gap-2 text-white/90">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            Live Agent Logs
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] text-primary/70 font-mono tracking-widest uppercase">
              Streaming
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative">
        <ScrollArea className="h-64 sm:h-auto sm:absolute sm:inset-0 w-full rounded-b-xl border border-white/[0.02]">
          <div className="p-4 sm:p-5 flex flex-col gap-1.5 font-mono text-xs cursor-text font-medium antialiased">
            {logs.length === 0 ? (
              <div className="text-white/30 italic py-2 text-[11px]">
                Waiting for backend event stream...
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className="leading-relaxed break-words whitespace-pre-wrap select-text selection:bg-primary/30 selection:text-white"
                >
                  <span className="text-white/30 mr-3 select-none">
                    {String(i + 1).padStart(3, "0")}
                  </span>
                  <span className="text-zinc-300">{log}</span>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

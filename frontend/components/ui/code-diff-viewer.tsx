"use client";

import { useTheme } from "next-themes";
import { DiffEditor } from "@monaco-editor/react";
import { Copy, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeDiffViewerProps {
  originalCode: string;
  modifiedCode: string;
  language?: string;
  filename?: string;
}

export function CodeDiffViewer({
  originalCode,
  modifiedCode,
  language = "python",
  filename = "generated_skill.py",
}: CodeDiffViewerProps) {
  const { theme } = useTheme();

  return (
    <div className="w-full flex flex-col border border-white/10 rounded-xl overflow-hidden bg-[#0A0A0A] h-[600px] shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <div className="h-4 w-px bg-white/20 mx-2"></div>
          <span className="font-mono text-xs text-white/70">{filename}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white">
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 relative">
        <DiffEditor
          original={originalCode}
          modified={modifiedCode}
          language={language}
          theme={theme === "light" ? "light" : "vs-dark"}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 22,
            fontFamily: "JetBrains Mono, Menlo, monospace",
            renderSideBySide: true,
            scrollbar: {
              vertical: "hidden",
              horizontal: "hidden"
            },
            padding: { top: 16 }
          }}
        />
      </div>
    </div>
  );
}

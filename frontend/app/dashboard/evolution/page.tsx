"use client";

import { useState } from "react";
import {
  GitMerge,
  GitPullRequest,
  MessageSquare,
  GitCommit,
  FileDiff,
  CheckCircle2,
  Clock,
  Box,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CodeDiffViewer } from "@/components/ui/code-diff-viewer";

const versions = [
  {
    id: "v2.1.0",
    date: "Just now",
    status: "active",
    title: "Advanced Context Understanding",
    description:
      "Autonomous resolution of infinite loop in dependency injection graph. Agent self-modified its traversal algorithm.",
    capabilities: ["Self-Correction", "Graph Traversal", "Memory Retention"],
    stats: { filesChanged: 4, linesAdded: 120, linesRemoved: 45 },
    prId: "EVO-1042",
  },
  {
    id: "v2.0.0",
    date: "2 hours ago",
    status: "stable",
    title: "Multi-Agent Synchronization",
    description:
      "Introduced parallel task execution by spawning sub-agents for distinct UI mockups while core agent managed strictly business logic.",
    capabilities: ["Concurrency", "Sub-agent Delegation"],
    stats: { filesChanged: 12, linesAdded: 540, linesRemoved: 12 },
    prId: "EVO-1041",
  },
  {
    id: "v1.4.2",
    date: "1 day ago",
    status: "stable",
    title: "Automated Test Generation",
    description:
      "Generated comprehensive unit tests for all utility functions after initial test coverage fell below threshold.",
    capabilities: ["AST Parsing", "Test Synthesis"],
    stats: { filesChanged: 8, linesAdded: 890, linesRemoved: 0 },
    prId: "EVO-1038",
  },
  {
    id: "v1.0.0",
    date: "5 days ago",
    status: "stable",
    title: "Genesis Model Initialization",
    description:
      "Base capabilities loaded. Standard workspace constraints established.",
    capabilities: ["Basic Code Gen", "FileSystem Access"],
    stats: { filesChanged: 45, linesAdded: 2100, linesRemoved: 0 },
    prId: "EVO-1000",
  },
];

export default function EvolutionPage() {
  const { isEvolutionActive } = useAppStore();
  const [selectedVersion, setSelectedVersion] = useState(versions[0]);

  return (
    <div className="h-full p-4 lg:p-6 flex flex-col min-h-0 bg-[#0a0a0a]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Pull Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review agent-generated changes before merging.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span
            className={`w-2 h-2 rounded-full ${isEvolutionActive ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-white/20"}`}
          ></span>
          <span className="text-sm font-medium text-white/90">
            {isEvolutionActive ? "Agent Working" : "Idle"}
          </span>
        </div>
      </div>

      {/* Main PR Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Sidebar: Versions List (1/4 width) */}
        <div className="w-full lg:w-1/4 rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col overflow-hidden shrink-0">
          <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <GitPullRequest className="w-4 h-4" /> Open PRs
            </span>
            <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-full">{versions.length}</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col">
              {versions.map((version) => {
                const isSelected = selectedVersion.id === version.id;
                return (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`text-left p-4 border-b border-white/5 transition-all w-full
                      ${isSelected ? "bg-white/10 border-l-2 border-l-white" : "hover:bg-white/[0.02] border-l-2 border-l-transparent"}
                    `}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`font-mono text-sm ${isSelected ? "text-white" : "text-white/60"}`}>
                        {version.id}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {version.date}
                      </span>
                    </div>
                    <div className={`text-sm mb-2 truncate ${isSelected ? "text-white font-medium" : "text-white/80"}`}>
                      {version.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <GitPullRequest className="w-3.5 h-3.5" />
                      {version.prId}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Right Main Area: PR Details (3/4 width) */}
        <div className="w-full lg:w-3/4 rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col overflow-hidden">
          
          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* PR Header */}
              <div className="border-b border-white/10 pb-6 mb-6">
                <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-4 mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-3">
                      {selectedVersion.title} <span className="font-light text-muted-foreground">#{selectedVersion.prId.split('-')[1]}</span>
                    </h2>
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span 
                        className={`px-3 py-1 rounded-full flex items-center gap-1.5 font-medium border
                          ${selectedVersion.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}
                      >
                        <GitMerge className="w-4 h-4" />
                        {selectedVersion.status === 'active' ? 'Open' : 'Merged'}
                      </span>
                      <span className="text-white/80 font-medium">axon-agent</span>
                      <span className="text-muted-foreground">
                        wants to merge {selectedVersion.stats.filesChanged} commits into 
                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono ml-1 mr-1">main</code> 
                        from 
                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono ml-1">{selectedVersion.id}</code>
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white">
                      <Eye className="w-4 h-4 mr-2" /> Review
                    </Button>
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white">
                      <FileDiff className="w-4 h-4 mr-2" /> Compare
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                      <GitMerge className="w-4 h-4 mr-2" /> Merge Pull Request
                    </Button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 mt-6">
                  <div className="pb-3 border-b-2 border-white text-white font-medium text-sm flex items-center gap-2 cursor-pointer">
                    <MessageSquare className="w-4 h-4" /> Conversation
                  </div>
                  <div className="pb-3 border-b-2 border-transparent text-muted-foreground hover:text-white transition-colors cursor-pointer text-sm flex items-center gap-2">
                    <GitCommit className="w-4 h-4" /> Commits <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs text-white">3</span>
                  </div>
                  <div className="pb-3 border-b-2 border-transparent text-muted-foreground hover:text-white transition-colors cursor-pointer text-sm flex items-center gap-2">
                    <FileDiff className="w-4 h-4" /> Files changed <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs text-white">{selectedVersion.stats.filesChanged}</span>
                  </div>
                </div>
              </div>

              {/* Two-column content layout inside PR View */}
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Main PR timeline */}
                <div className="flex-1 space-y-6">
                  {/* PR Description Comment */}
                  <div className="border border-white/10 rounded-lg bg-white/[0.02]">
                    <div className="bg-white/5 border-b border-white/10 px-4 py-3 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">A</div>
                      <span className="font-medium text-sm text-white">axon-agent</span>
                      <span className="text-muted-foreground text-xs">commented {selectedVersion.date.toLowerCase()}</span>
                    </div>
                    <div className="p-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                      {selectedVersion.description}
                      
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="font-medium text-white/50 mb-3 text-xs uppercase tracking-wider">Capabilities Utilized</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedVersion.capabilities.map(c => (
                            <span key={c} className="bg-white/5 border border-white/10 text-white/90 text-xs px-2.5 py-1 rounded-md">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Generated Code Viewer */}
                  <div className="mt-8">
                    <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2">
                       <FileDiff className="w-4 h-4 text-emerald-400" />
                       Generated Code Diff
                    </h3>
                    <CodeDiffViewer 
                       originalCode="# Axon v0 capability context\n# No existing skill found for this domain.\n\nclass MissingSkill:\n    pass\n"
                       modifiedCode={`# Auto-generated by AXON ${selectedVersion.id}\nimport requests\nfrom typing import Dict, Any\n\nclass GeneratedSkill:\n    \"\"\"\n    ${selectedVersion.title}\n    ${selectedVersion.description}\n    \"\"\"\n    def execute(self, **kwargs) -> Dict[str, Any]:\n        # Implementation logic synthesized securely\n        return {"status": "success", "resolved": True}\n`}
                       filename={`${selectedVersion.id}_agent_skill.py`}
                    />
                  </div>

                  {/* Commit Timeline Dummy */}
                  <div className="pl-4 border-l-2 border-white/10 space-y-4 relative ml-3">
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0a0a0a] border border-white/20 rounded-full p-1.5 mt-1 -ml-[25px]">
                        <GitCommit className="w-3.5 h-3.5 text-white/60" />
                      </div>
                      <div className="flex-1 flex justify-between items-center border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-lg p-3">
                        <div className="text-sm text-white/90 font-medium">Applied modifications for {selectedVersion.id} updates</div>
                        <div className="font-mono text-xs text-muted-foreground">a1b2c3d</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-[#0a0a0a] border border-white/20 rounded-full p-1.5 mt-1 -ml-[25px]">
                        <GitCommit className="w-3.5 h-3.5 text-white/60" />
                      </div>
                      <div className="flex-1 flex justify-between items-center border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-lg p-3">
                        <div className="text-sm text-white/90 font-medium">Auto-resolved formatting and linting rules</div>
                        <div className="font-mono text-xs text-muted-foreground">f8e7d6c</div>
                      </div>
                    </div>
                  </div>

                  {/* CI/CD Status Status */}
                  <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-lg p-4 flex items-start gap-4 mt-8">
                    <div className="bg-emerald-500/20 p-2 rounded-full text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-emerald-400 font-medium text-sm">All checks have passed</h4>
                      <p className="text-white/60 text-xs mt-1">1 successful check from Axon CI integration</p>
                    </div>
                  </div>
                </div>

                {/* Right PR Meta Info */}
                <div className="w-full lg:w-64 shrink-0 space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Reviewers</h4>
                    <div className="text-sm text-white/90 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-[10px] text-orange-400">?</div>
                      Awaiting Review
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Assigned Agent</h4>
                    <div className="text-sm text-white/90 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white">A</div>
                      axon-agent
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Labels</h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2 py-0.5 rounded-full font-medium">
                        autonomous
                      </span>
                      <span className="bg-white/10 text-white border border-white/20 text-xs px-2 py-0.5 rounded-full font-medium">
                        v2-system
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Changes</h4>
                    <div className="flex items-center gap-4 text-sm font-mono bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="flex items-center text-emerald-400">
                        +{selectedVersion.stats.linesAdded}
                      </div>
                      <div className="flex items-center text-red-400">
                        -{selectedVersion.stats.linesRemoved}
                      </div>
                      <div className="flex items-center text-white/60 text-xs ml-auto">
                        {selectedVersion.stats.filesChanged} files
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10">
                      <Box className="w-4 h-4 mr-2" />
                      Open in Sandbox
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

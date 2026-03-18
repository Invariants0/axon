"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  Search,
  RefreshCw,
  Package,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { skillsService } from "@/lib/services/skills.service";
import { useAppStore } from "@/store/app-store";
import type { Skill } from "@/types";

const CORE_SKILLS = ["reasoning", "planning", "coding"];

function SkillCard({ skill }: { skill: Skill }) {
  const [expanded, setExpanded] = useState(false);
  const isNew = !CORE_SKILLS.includes(skill.name);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-xl border transition-all duration-200 ${
        isNew
          ? "border-emerald-500/20 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
          : "border-white/5 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isNew ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-white/30"
            }`}
          />
          <span className={`font-mono text-sm font-semibold truncate ${isNew ? "text-emerald-400" : "text-white/90"}`}>
            {skill.name}
          </span>
          {isNew && (
            <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              New
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-white/30">{skill.version}</span>
          {skill.parameters && Object.keys(skill.parameters).length > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-white/30 hover:text-white/70 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {skill.description && (
        <p className="text-xs text-white/50 mt-2 leading-relaxed">{skill.description}</p>
      )}

      <AnimatePresence>
        {expanded && skill.parameters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-white/5"
          >
            <div className="text-[10px] uppercase tracking-wider text-white/30 mb-2">
              Parameters
            </div>
            <div className="space-y-1.5">
              {Object.entries(skill.parameters).map(([name, param]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-primary/70">{name}</span>
                  <span className="text-white/30">({param.type}</span>
                  {param.required && (
                    <span className="text-red-400/70 text-[9px]">required</span>
                  )}
                  <span className="text-white/30">)</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {skill.created_at && (
        <div className="mt-2 text-[10px] text-white/20 font-mono">
          {new Date(skill.created_at).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  );
}

// Fallback placeholder card for skills without full details
function SkillNameCard({ name }: { name: string }) {
  const isNew = !CORE_SKILLS.includes(name);
  return (
    <div
      className={`p-3 rounded-lg border flex items-center gap-2 ${
        isNew
          ? "border-emerald-500/20 bg-emerald-950/20"
          : "border-white/5 bg-white/[0.03]"
      }`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          isNew ? "bg-emerald-400" : "bg-white/30"
        }`}
      />
      <span className={`font-mono text-sm ${isNew ? "text-emerald-400" : "text-white/80"}`}>
        {name}
      </span>
      {isNew && (
        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Generated
        </span>
      )}
    </div>
  );
}

export function SkillsCatalog() {
  const { skillDetails, skills: storeSkills, setSkillDetails } = useAppStore();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await skillsService.list();
      if (Array.isArray(data) && data.length > 0) {
        setSkillDetails(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skills");
    } finally {
      setIsLoading(false);
    }
  }, [setSkillDetails]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const displaySkills = skillDetails.length > 0 ? skillDetails : null;
  const fallbackSkills = storeSkills;

  const filteredSkillDetails = useMemo(() => {
    if (!displaySkills) return null;
    if (!query) return displaySkills;
    return displaySkills.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [displaySkills, query]);

  const filteredFallback = useMemo(() => {
    if (!query) return fallbackSkills;
    return fallbackSkills.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
  }, [fallbackSkills, query]);

  const totalCount = displaySkills ? displaySkills.length : fallbackSkills.length;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Skill Registry</h2>
          <p className="text-sm text-white/50 mt-0.5">
            {totalCount} capability module{totalCount !== 1 ? "s" : ""} installed
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchSkills}
          disabled={isLoading}
          className="text-white/40 hover:text-white border border-white/10"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <Input
          placeholder="Search skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/50"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchSkills} className="ml-auto underline">
            Retry
          </button>
        </div>
      )}

      {/* Skills Grid */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-3">
          <AnimatePresence>
            {isLoading && !displaySkills ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-white/5 border border-white/5 animate-pulse"
                />
              ))
            ) : filteredSkillDetails ? (
              filteredSkillDetails.length > 0 ? (
                filteredSkillDetails.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))
              ) : (
                <EmptyState query={query} />
              )
            ) : filteredFallback.length > 0 ? (
              filteredFallback.map((name) => <SkillNameCard key={name} name={name} />)
            ) : (
              <EmptyState query={query} />
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="py-20 flex flex-col items-center gap-3 text-white/30">
      <Package className="w-8 h-8 opacity-30" />
      <p className="text-sm">
        {query ? `No skills match "${query}"` : "No skills installed yet"}
      </p>
    </div>
  );
}

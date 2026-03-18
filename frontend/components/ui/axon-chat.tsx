"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Terminal, Sparkles, User, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMessage } from "@/types";
import { tasksService } from "@/lib/services/tasks.service";
import { useAppStore } from "@/store/app-store";

export function AxonChat() {
  const { isEvolutionActive, setEvolutionActive } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "system",
      content: "AXON Orchestrator initialized. Awaiting commands...",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userCmd = input;
    setInput("");

    // 1. Add User Message
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        role: "user",
        content: userCmd,
        timestamp: Date.now(),
      },
    ]);

    // 2. Add Optimistic Agent Response
    const agentMsgId = Math.random().toString(36).substr(2, 9);
    setMessages((prev) => [
      ...prev,
      {
        id: agentMsgId,
        role: "agent",
        content: "Acknowledged. Dispatching to inference pipeline...",
        timestamp: Date.now(),
        isStreaming: true,
      },
    ]);

    if (!isEvolutionActive) setEvolutionActive(true);

    try {
      // 3. Trigger actual POST /tasks
      await tasksService.create({ title: userCmd, description: "Dispatched via Control Room Chat" });

      // Update streaming message state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? { ...msg, content: "Task is now active. Monitoring event stream for outputs.", isStreaming: false }
            : msg
        )
      );

    } catch (error: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? { ...msg, content: `Error dispatching task: ${error.message}`, isStreaming: false }
            : msg
        )
      );
    }
  };

  return (
    <div className="flex flex-col h-full border border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl relative">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0" />
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.02] z-10">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-white/90">AXON Control Terminal</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="relative flex h-2 w-2">
             {isEvolutionActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
             <span className={`relative inline-flex rounded-full h-2 w-2 ${isEvolutionActive ? 'bg-emerald-500' : 'bg-white/20'}`}></span>
           </span>
           <span className="text-[10px] text-white/50 uppercase tracking-widest">{isEvolutionActive ? 'Active' : 'Standby'}</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 z-10 w-full">
        <div className="space-y-6 flex flex-col w-full">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex w-full gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border 
                    ${msg.role === 'system' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-primary/10 border-primary/30 text-primary'}`}>
                    {msg.role === 'system' ? <Terminal className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4" />}
                  </div>
                )}
                
                <div
                  className={`relative p-3 rounded-2xl max-w-[85%] text-sm ${
                    msg.role === "user"
                      ? "bg-white text-black font-medium rounded-tr-sm"
                      : msg.role === "system"
                      ? "bg-white/5 text-white/60 font-mono text-xs border border-white/10"
                      : "bg-[#111] text-white/90 border border-white/10 rounded-tl-sm shadow-[0_0_15px_rgba(255,255,255,0.02)]"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-3 bg-primary ml-2 animate-pulse align-middle" />
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Form */}
      <div className="p-3 bg-[#0a0a0a] border-t border-white/10 z-10 w-full">
        <form
          className="relative flex items-center w-full"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <Sparkles className="w-4 h-4 absolute left-4 text-primary pointer-events-none" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command AXON to execute a task..."
            className="w-full bg-white/5 border-white/10 placeholder:text-white/30 text-white pl-10 pr-12 py-6 rounded-xl hover:bg-white/[0.07] focus:bg-white/[0.07] transition-colors focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
          />
          <Button
            type="submit"
            disabled={!input.trim()}
            size="icon"
            className="absolute right-2 h-[34px] w-[34px] rounded-lg bg-white hover:bg-white/90 text-black transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

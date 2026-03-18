"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Activity, Code2, Network } from "lucide-react";
import Link from "next/link";
import { GlowyWavesHero } from "@/components/ui/glowy-waves-hero-shadcnui";
import { SkewCard } from "@/components/ui/gradient-card-showcase";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-white/30">
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-white">
                AXON
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <Link
                href="#features"
                className="hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="#developers"
                className="hover:text-white transition-colors"
              >
                Developers
              </Link>
              <Link
                href="#company"
                className="hover:text-white transition-colors"
              >
                Company
              </Link>
              <Link href="#blog" className="hover:text-white transition-colors">
                Blog
              </Link>
            </div>
            <Button
              className="rounded-full px-6 bg-white hover:bg-white/90 text-black font-medium"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Enter System
            </Button>
          </div>
        </nav>

        {/* Hero Section */}
        <GlowyWavesHero />

        {/* Features Section */}
        <section id="features" className="py-32 px-6 relative">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 max-w-3xl mx-auto leading-tight text-white">
                Harness the power of an AI that writes its own code.
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                AXON is a self-improving system. When it hits a wall, it
                doesn&apos;t stop. It researches, writes a new module, tests it,
                and upgrades itself.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <SkewCard
                title="Self-Evolving Architecture"
                description="Convert your projects into self-evolving systems. Constantly review, overlook, and upgrade the entire codebase autonomously."
                icon={Network}
                gradientFrom="#ffffff"
                gradientTo="#d1dceb"
              />

              <SkewCard
                title="Real-Time Reasoning"
                description="Watch the system's thought process unfold live. Transparent logs reveal exactly how decisions are made, hypotheses are formed, and failures are analyzed."
                icon={Activity}
                gradientFrom="#d1dceb"
                gradientTo="#94a3b8"
              />

              <SkewCard
                title="Autonomous Skill Creation"
                description="When faced with a novel problem, AXON writes, tests, and integrates new code modules dynamically. It expands its own capability graph without human intervention."
                icon={Code2}
                gradientFrom="#94a3b8"
                gradientTo="#475569"
              />
            </div>
          </div>
        </section>


        {/* Footer CTA */}
        <section className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-8 text-white">
              Ready to observe the evolution?
            </h2>
            <Button
              size="lg"
              className="rounded-full px-10 h-14 text-lg bg-white text-black hover:bg-white/90 font-medium"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Enter the System
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

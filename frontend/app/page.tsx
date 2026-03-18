"use client";

import { Button } from "@/components/ui/button";
import {
  BrainCircuit,
  Activity,
  Code2,
  Network,
  Cpu,
  Database,
  Globe,
  Layers,
  ShieldCheck,
  Zap,
  Github,
  Linkedin,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { GlowyWavesHero } from "@/components/ui/glowy-waves-hero-shadcnui";
import { SkewCard } from "@/components/ui/gradient-card-showcase";
import {
  FeatureCard,
  AnimatedContainer,
} from "@/components/ui/grid-feature-cards";
import VisionBentoGrid from "@/components/ui/vision-bento-grid";
import { Footer } from "@/components/ui/modem-animated-footer";

const techStack = [
  {
    title: "Next.js & TypeScript",
    icon: Globe,
    description:
      "Type-safe, high-performance frontend architecture with React 19 and Next.js 15 for a seamless developer experience.",
  },
  {
    title: "FastAPI Backend",
    icon: Cpu,
    description:
      "Asynchronous Python core designed for high-concurrency agent orchestration and low-latency system responses.",
  },
  {
    title: "Qdrant Vector DB",
    icon: Database,
    description:
      "Long-term semantic memory and high-dimensional vector retrieval for autonomous reasoning and knowledge persistence.",
  },
  {
    title: "Multi-LLM Routing",
    icon: Layers,
    description:
      "Dynamic orchestration across Gemini, HuggingFace, and custom models to balance reasoning power, speed, and cost.",
  },
  {
    title: "Self-Evolving Skills",
    icon: Zap,
    description:
      "Autonomous Python module generation and hot-loading, allowing the system to expand its capability graph live.",
  },
  {
    title: "Distributed Infrastructure",
    icon: ShieldCheck,
    description:
      "Dockerized microservices architecture with automated CI/CD and secure cloud orchestration on DigitalOcean.",
  },
];

export default function LandingPage() {
  const socialLinks = [
    {
      icon: <Github className="w-6 h-6" />,
      href: "https://github.com/Invariants0/axon",
      label: "GitHub",
    },
    {
      icon: <Linkedin className="w-6 h-6" />,
      href: "https://www.linkedin.com/company/112679037/",
      label: "LinkedIn",
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      href: "https://discord.gg/Q36RGfCbew",
      label: "Discord",
    },
  ];

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Technology", href: "#technology" },
    { label: "Vision", href: "#vision" },
    { label: "Enter System", href: "/dashboard" },
  ];

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
                href="#technology"
                className="hover:text-white transition-colors"
              >
                Technology
              </Link>
              <Link
                href="#vision"
                className="hover:text-white transition-colors"
              >
                Vision
              </Link>
              <Link
                href="#architecture"
                className="hover:text-white transition-colors"
              >
                Architecture
              </Link>
              <Link
                href="#company"
                className="hover:text-white transition-colors"
              >
                Company
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
                gradientFrom="#e2e8f0"
                gradientTo="#94a3b8"
              />

              <SkewCard
                title="Real-Time Reasoning"
                description="Watch the system's thought process unfold live. Transparent logs reveal exactly how decisions are made, hypotheses are formed, and failures are analyzed."
                icon={Activity}
                gradientFrom="#f8fafc"
                gradientTo="#cbd5e1"
              />

              <SkewCard
                title="Autonomous Skill Creation"
                description="When faced with a novel problem, AXON writes, tests, and integrates new code modules dynamically. It expands its own capability graph without human intervention."
                icon={Code2}
                gradientFrom="#ffffff"
                gradientTo="#e2e8f0"
              />
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section
          id="technology"
          className="py-32 px-6 bg-white/[0.02] border-y border-white/5 relative"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="mx-auto w-full space-y-12">
              <AnimatedContainer className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl mb-6">
                  The Neural Infrastructure
                </h2>
                <p className="text-muted-foreground mt-4 text-lg md:text-xl">
                  AXON is built on a foundation of high-performance, distributed
                  technologies designed for autonomous evolution.
                </p>
              </AnimatedContainer>

              <AnimatedContainer
                delay={0.3}
                className="grid grid-cols-1 divide-x divide-y divide-white/5 border border-white/5 sm:grid-cols-2 md:grid-cols-3 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-xl"
              >
                {techStack.map((tech, i) => (
                  <FeatureCard key={i} feature={tech} />
                ))}
              </AnimatedContainer>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <VisionBentoGrid />

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

        <Footer
          className="bg-black"
          brandName="AXON"
          brandDescription="Autonomous AI engineering platform that researches, writes, tests, and deploys evolving capabilities in production."
          socialLinks={socialLinks}
          navLinks={navLinks}
          creatorName="Invariants"
          creatorUrl="https://github.com/Invariants0/axon"
          brandIcon={
            <BrainCircuit className="w-8 sm:w-10 md:w-14 h-8 sm:h-10 md:h-14 text-background drop-shadow-lg" />
          }
        />
      </div>
    </div>
  );
}

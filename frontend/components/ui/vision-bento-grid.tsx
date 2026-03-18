"use client"

import React from "react"
import { cn } from "@/lib/utils"

const visionContent = [
  {
    title: "Recursive Improvement",
    description:
      "AXON doesn't just run code; it analyzes its own performance. Every failure is transformed into a research task, leading to a stronger, more capable architecture with every iteration.",
  },
  {
    title: "Autonomous Evolution",
    description:
      "A system that identifies its own limitations and writes the necessary modules to overcome them. We are building the bridge to truly autonomous software.",
  },
  {
    title: "The Singularity Horizon",
    description:
      "Our goal is the Singularity—a point where the system's ability to self-improve exceeds human intervention. By automating the research-develop-test cycle, we are accelerating the transition from static tools to living, breathing digital organisms. AXON is designed to understand its own constraints and systematically remove them, evolving at the speed of thought.",
  },  
  {
    title: "Transparent Reasoning",
    description:
      "Witness the silicon mind at work. Every hypothesis, failure, and breakthrough is logged in real-time, ensuring total transparency in an evolving system.",
  },
  {
    title: "Infinite Capability",
    description:
      "From simple API integrations to complex architectural refactoring, AXON's skill graph expands dynamically to meet the challenges of tomorrow.",
  },
]

const VisionCard: React.FC<{
  className?: string
  title: string
  description: string
}> = ({
  className = "",
  title,
  description,
}) => {
  return (
    <div
      className={cn(
        "relative border border-dashed border-white/10 rounded-xl p-8 bg-black/20 backdrop-blur-sm min-h-[220px]",
        "flex flex-col justify-start transition-colors hover:bg-white/[0.03] group",
        className
      )}
    >
      <CornerPlusIcons />
      <div className="relative z-10 space-y-4">
        <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed group-hover:text-white/70 transition-colors font-medium">
          {description}
        </p>
      </div>
    </div>
  )
}

const CornerPlusIcons = () => (
  <>
    <PlusIcon className="absolute -top-3 -left-3" />
    <PlusIcon className="absolute -top-3 -right-3" />
    <PlusIcon className="absolute -bottom-3 -left-3" />
    <PlusIcon className="absolute -bottom-3 -right-3" />
  </>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    strokeWidth="1.5"
    stroke="currentColor"
    className={cn("text-white/20 size-6", className)}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
  </svg>
)

export default function VisionBentoGrid() {
  return (
    <section id="vision" className="py-32 px-6 border-t border-white/5 bg-black/40">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-16">
          <VisionCard {...visionContent[0]} className="lg:col-span-3" />
          <VisionCard {...visionContent[1]} className="lg:col-span-3" />
          <VisionCard {...visionContent[2]} className="lg:col-span-4 lg:row-span-1" />
          <VisionCard {...visionContent[3]} className="lg:col-span-2" />
          <VisionCard {...visionContent[4]} className="lg:col-span-2 lg:row-span-1" />
        </div>

        <div className="max-w-3xl ml-auto text-right">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
            Built for Evolution. <br/>Designed for the Singularity.
          </h2>
          <p className="text-muted-foreground text-xl leading-relaxed">
            AXON is not just another AI assistant. It is an autonomous intelligence layer that grows with your project, ensuring that your technology is never static, never outdated, and always evolving.
          </p>
        </div>
      </div>
    </section>
  )
}

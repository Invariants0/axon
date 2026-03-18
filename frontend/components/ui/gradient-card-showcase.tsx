import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface SkewCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  className?: string;
}

export const SkewCard = ({
  title,
  description,
  icon: Icon,
  gradientFrom,
  gradientTo,
  className
}: SkewCardProps) => {
  return (
    <div
      className={cn(
        "group relative w-full h-[400px] transition-all duration-500",
        className
      )}
    >
      {/* Skewed gradient panels */}
      <span
        className="absolute top-0 left-[20px] md:left-[50px] w-1/2 h-full rounded-3xl transform skew-x-[10deg] md:skew-x-[15deg] transition-all duration-500 group-hover:skew-x-0 group-hover:left-[10px] md:group-hover:left-[20px] group-hover:w-[calc(100%-20px)] md:group-hover:w-[calc(100%-40px)]"
        style={{
          background: `linear-gradient(315deg, ${gradientFrom}, ${gradientTo})`,
        }}
      />
      <span
        className="absolute top-0 left-[20px] md:left-[50px] w-1/2 h-full rounded-3xl transform skew-x-[10deg] md:skew-x-[15deg] blur-[30px] opacity-50 transition-all duration-500 group-hover:skew-x-0 group-hover:left-[10px] md:group-hover:left-[20px] group-hover:w-[calc(100%-20px)] md:group-hover:w-[calc(100%-40px)]"
        style={{
          background: `linear-gradient(315deg, ${gradientFrom}, ${gradientTo})`,
        }}
      />

      {/* Animated blurs */}
      <span className="pointer-events-none absolute inset-0 z-10">
        <span className="absolute top-0 left-0 w-0 h-0 rounded-full opacity-0 bg-[rgba(255,255,255,0.15)] backdrop-blur-[10px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-all duration-100 animate-blob group-hover:top-[-40px] group-hover:left-[40px] group-hover:w-[80px] group-hover:h-[80px] group-hover:opacity-100" />
        <span className="absolute bottom-0 right-0 w-0 h-0 rounded-full opacity-0 bg-[rgba(255,255,255,0.15)] backdrop-blur-[10px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-all duration-500 animate-blob animation-delay-1000 group-hover:bottom-[-40px] group-hover:right-[40px] group-hover:w-[80px] group-hover:h-[80px] group-hover:opacity-100" />
      </span>

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-center p-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl text-white transition-all duration-500 group-hover:left-[-15px] group-hover:bg-black/20">
        <Icon className="w-12 h-12 text-white mb-6 transition-transform duration-500 group-hover:scale-110" />
        <h3 className="text-2xl font-bold mb-4">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-lg">{description}</p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob {
          0%, 100% { transform: translateY(10px); }
          50% { transform: translate(-10px); }
        }
        .animate-blob { animation: blob 4s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: -2s; }
      `}} />
    </div>
  );
};

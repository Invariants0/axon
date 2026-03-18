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
        "group relative w-full h-[420px] transition-all duration-700 ease-out",
        className
      )}
    >
      {/* Subtle Glow Layers */}
      <span
        className="absolute top-0 left-[20px] md:left-[40px] w-3/4 h-full rounded-[2rem] transform skew-x-[12deg] transition-all duration-700 group-hover:skew-x-0 group-hover:left-[10px] md:group-hover:left-[20px] group-hover:w-[calc(100%-20px)] md:group-hover:w-[calc(100%-40px)] opacity-20 blur-xl"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }}
      />
      <span
        className="absolute top-4 left-[30px] md:left-[50px] w-1/2 h-[90%] rounded-[2rem] transform skew-x-[12deg] transition-all duration-700 group-hover:skew-x-0 group-hover:left-[20px] group-hover:w-[calc(100%-40px)] opacity-10 blur-3xl"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }}
      />

      {/* Main Content Card */}
      <div className="relative z-20 h-full flex flex-col justify-center p-10 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] text-white transition-all duration-700 group-hover:translate-x-[-10px] group-hover:translate-y-[-5px] group-hover:bg-black/40 group-hover:border-white/20 shadow-2xl overflow-hidden">
        
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-8 transition-all duration-700 group-hover:scale-110 group-hover:bg-white/10 group-hover:border-white/20">
                <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            
            <h3 className="text-2xl font-bold mb-4 tracking-tight text-white group-hover:text-white transition-colors duration-500">
                {title}
            </h3>
            
            <p className="text-white/70 font-medium leading-relaxed text-lg group-hover:text-white/90 transition-colors duration-500">
                {description}
            </p>
        </div>

        {/* Dynamic Gradient Accent */}
        <div 
            className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-20 transition-opacity duration-700 group-hover:opacity-40"
            style={{
                background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            }}
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .group:hover .relative.z-20 {
            animation: subtle-float 6s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

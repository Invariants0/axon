import Link from "next/link";
import { BrainCircuit, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center text-white p-8">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
      </div>

      <div className="relative text-center space-y-8 max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
            <BrainCircuit className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">AXON</span>
        </div>

        {/* 404 */}
        <div className="space-y-3">
          <p className="text-[120px] font-mono font-black leading-none text-white/[0.06] select-none">
            404
          </p>
          <div className="-mt-8 space-y-2">
            <h1 className="text-2xl font-display font-bold text-white/90">
              Page not found
            </h1>
            <p className="text-sm text-white/40 leading-relaxed">
              The resource you requested doesn&apos;t exist or has been moved.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.08] text-white/60 text-sm font-medium hover:bg-white/[0.04] hover:text-white/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}

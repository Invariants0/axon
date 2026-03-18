import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary/40 animate-spin mx-auto" />
        <p className="text-xs text-white/25 font-mono uppercase tracking-widest">
          Loading…
        </p>
      </div>
    </div>
  );
}

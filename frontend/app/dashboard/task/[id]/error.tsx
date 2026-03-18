"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <XCircle className="w-10 h-10 text-red-400/50 mx-auto" />
        <h2 className="text-lg font-display font-bold text-white/80">Something went wrong</h2>
        <p className="text-sm text-white/40">{error?.message ?? "An unexpected error occurred."}</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="outline" className="border-white/10 text-white/60 hover:text-white/90 hover:bg-white/5">
            Try again
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" className="text-white/40 hover:text-white/70">
              ← Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

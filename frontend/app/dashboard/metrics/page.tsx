'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Activity, Cpu, Database, Network } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MetricsPage() {
  return (
    <div className="h-full p-6 flex flex-col gap-6 overflow-hidden min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold">System Metrics</h1>
          <p className="text-muted-foreground text-sm">Real-time performance and resource utilization.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          {[
            { title: 'CPU Usage', value: '42%', icon: Cpu, color: 'text-blue-400' },
            { title: 'Memory', value: '16.4 GB', icon: Database, color: 'text-emerald-500' },
            { title: 'Network I/O', value: '1.2 GB/s', icon: Network, color: 'text-primary' },
            { title: 'Active Agents', value: '4', icon: Activity, color: 'text-yellow-500' },
          ].map((metric) => (
            <Card key={metric.title} className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
              <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5">
                <CardTitle className={`text-sm font-medium flex items-center gap-2`}>
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                  {metric.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className={`text-3xl font-display font-bold ${metric.color}`}>{metric.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="flex-1 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl min-h-[400px]">
          <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Performance History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 h-[320px] relative">
            <div className="absolute inset-0 p-6">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid Lines */}
                {[0, 50, 100, 150, 200].map((y) => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                ))}
                {/* Data Path */}
                <motion.path
                  d="M 0 150 Q 50 120 100 140 T 200 80 T 300 110 T 400 60 L 400 200 L 0 200 Z"
                  fill="url(#gradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                />
                <motion.path
                  d="M 0 150 Q 50 120 100 140 T 200 80 T 300 110 T 400 60"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                {/* Data Points */}
                {[
                  { x: 0, y: 150 }, { x: 100, y: 140 }, { x: 200, y: 80 }, { x: 300, y: 110 }, { x: 400, y: 60 }
                ].map((p, i) => (
                  <motion.circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="3"
                    fill="var(--color-primary)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + i * 0.2 }}
                  />
                ))}
              </svg>
            </div>
            <div className="absolute bottom-4 left-6 right-6 flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>Now</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

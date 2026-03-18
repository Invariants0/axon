'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Cpu, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { SystemMetricsWidget } from '@/components/ui/system-metrics-widget';
import { useEffect, useState } from 'react';
import { systemService } from '@/lib/services/system.service';
import type { SystemMetrics } from '@/types';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    systemService.metrics().then(setMetrics).catch(() => {});
    const interval = setInterval(() => {
      systemService.metrics().then(setMetrics).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Tasks Completed',
      value: metrics?.tasks_completed != null ? String(metrics.tasks_completed) : '—',
      icon: BarChart2,
      color: 'text-emerald-500',
    },
    {
      title: 'Tasks Failed',
      value: metrics?.tasks_failed != null ? String(metrics.tasks_failed) : '—',
      icon: Cpu,
      color: 'text-red-400',
    },
    {
      title: 'Skills Generated',
      value: metrics?.skills_generated != null ? String(metrics.skills_generated) : '—',
      icon: Database,
      color: 'text-primary',
    },
    {
      title: 'Evolutions Run',
      value: metrics?.evolutions_run != null ? String(metrics.evolutions_run) : '—',
      icon: BarChart2,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="h-full p-6 flex flex-col gap-6 overflow-hidden min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-display font-bold">System Metrics</h1>
          <p className="text-muted-foreground text-sm">Real-time performance and resource utilization.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 min-h-0">
        {/* Top Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
          <div className="h-48">
            <SystemMetricsWidget />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {statCards.slice(0, 2).map((metric) => (
              <Card key={metric.title} className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col">
                <CardHeader className="py-2 px-3 border-b border-white/5 bg-white/5 flex-shrink-0">
                  <CardTitle className="text-xs font-medium flex items-center gap-2">
                    <metric.icon className={`w-3 h-3 ${metric.color}`} />
                    {metric.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 flex-1 flex items-center justify-center">
                  <div className={`text-2xl font-display font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stat Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          {statCards.map((metric, i) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <metric.icon className={`w-3.5 h-3.5 ${metric.color}`} />
                    <span className="text-[10px] uppercase tracking-wider text-white/40">
                      {metric.title}
                    </span>
                  </div>
                  <div className={`text-3xl font-mono font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Performance History Chart */}
        <Card className="flex-1 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl min-h-[300px]">
          <CardHeader className="py-4 px-5 border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Performance History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 h-[280px] relative">
            <div className="absolute inset-0 p-6">
              <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 50, 100, 150, 200].map((y) => (
                  <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="white" strokeOpacity="0.05" strokeWidth="1" />
                ))}
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
                {[{ x: 0, y: 150 }, { x: 100, y: 140 }, { x: 200, y: 80 }, { x: 300, y: 110 }, { x: 400, y: 60 }].map((p, i) => (
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

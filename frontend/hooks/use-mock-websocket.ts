'use client';

import { useAppStore } from '@/store/app-store';
import { useEffect, useRef } from 'react';
import { mockLogs } from '@/lib/mock-data';

export const useMockWebSocket = () => {
  const { addLog, isEvolutionActive } = useAppStore();
  const indexRef = useRef(0);

  useEffect(() => {
    if (!isEvolutionActive) {
      indexRef.current = 0;
      return;
    }

    const interval = setInterval(() => {
      // Get current mock log
      const log = mockLogs[indexRef.current % mockLogs.length];
      
      // Occasionally inject a "system jitter" or random status log
      const shouldInjectExtra = Math.random() > 0.8;
      if (shouldInjectExtra) {
        const systems = ['MEMORY', 'CPU', 'NETWORK', 'KERNEL'];
        const sys = systems[Math.floor(Math.random() * systems.length)];
        addLog(`[SYSTEM][${sys}] Pulse check: OK - Latency ${Math.floor(Math.random() * 20)}ms`);
      }

      addLog(log);
      indexRef.current++;
      
    }, 1500 + Math.random() * 1000); // Varied timing for realism

    return () => clearInterval(interval);
  }, [isEvolutionActive, addLog]);
};

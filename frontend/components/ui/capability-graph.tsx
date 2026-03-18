"use client";

import { useMemo } from 'react';
import { ReactFlow, Background, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAppStore } from '@/store/app-store';

export function CapabilityGraph() {
  const { skills } = useAppStore();

  const { nodes, edges } = useMemo(() => {
    // Determine base layout based on skill array
    // E.g. core skills at top, generated skills branch off
    
    // Default node config
    const nds: any[] = [
      {
        id: 'core',
        position: { x: 100, y: 10 },
        data: { label: 'AXON Core' },
        style: { 
          background: '#0a0a0a', 
          color: '#fff', 
          border: '1px solid rgba(168, 85, 247, 0.5)', 
          borderRadius: '8px',
          boxShadow: '0 0 10px rgba(168, 85, 247, 0.2)'
        } as React.CSSProperties
      }
    ];
    
    const egs: any[] = [];

    skills.forEach((skill, idx) => {
      // Basic layout logic
      const x = (idx % 3) * 120 + 20;
      const y = Math.floor(idx / 3) * 60 + 80;
      
      const isNew = !['reasoning', 'planning', 'coding'].includes(skill);

      nds.push({
        id: skill,
        position: { x, y },
        data: { label: skill },
        style: {
          background: isNew ? 'rgba(16, 185, 129, 0.1)' : '#0a0a0a',
          color: isNew ? '#10b981' : '#a1a1aa',
          border: isNew ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          fontSize: '10px',
          padding: '6px 10px'
        }
      });

      egs.push({
        id: `e-core-${skill}`,
        source: 'core',
        target: skill,
        animated: true,
        style: { stroke: isNew ? '#10b981' : 'rgba(255, 255, 255, 0.2)' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isNew ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
        },
      });
    });

    return { nodes: nds, edges: egs };
  }, [skills]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={12} size={1} color="rgba(255,255,255,0.05)" />
      </ReactFlow>
    </div>
  );
}

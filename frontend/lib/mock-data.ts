export const mockLogs = [
  "[SYSTEM] Initializing AXON core...",
  "[AGENT] Task received: Analyze market trends.",
  "[REASONING] Current models lack real-time data access.",
  "[FAILURE] Task failed: Insufficient capabilities.",
  "[EVOLUTION] Initiating self-upgrade sequence...",
  "[RESEARCH] Scanning web for real-time API integrations.",
  "[BUILD] Generating new skill module: WebSearchV2.",
  "[VALIDATION] Testing WebSearchV2... Success.",
  "[UPGRADE] AXON upgraded to v1.1.",
  "[RETRY] Re-executing task: Analyze market trends.",
  "[SUCCESS] Task completed successfully."
];

export const mockNodes = [
  { id: '1', position: { x: 250, y: 50 }, data: { label: 'Core Engine' } },
  { id: '2', position: { x: 100, y: 150 }, data: { label: 'NLP Module' } },
  { id: '3', position: { x: 400, y: 150 }, data: { label: 'Vision Module' } },
];

export const mockEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
];

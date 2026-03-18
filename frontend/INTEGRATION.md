# AXON Frontend Integration Guide

This document outlines how to connect the AXON frontend to a real backend (e.g., FastAPI).

## 1. Environment Variables

Create a `.env.local` file in the root of the frontend project and add the following variables:

```env
# The base URL for your backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# The WebSocket URL for real-time logs and events
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## 2. Replacing Mock Data

The frontend currently uses mock data located in `lib/mock-data.ts` and a mock WebSocket hook in `hooks/use-mock-websocket.ts`.

### A. Real-time Logs (WebSocket)

1.  **Update `hooks/use-websocket.ts` (Create this file):**

    Replace `use-mock-websocket.ts` with a real WebSocket implementation.

    ```typescript
    import { useEffect, useRef } from 'react';
    import { useAppStore } from '@/store/app-store';

    export const useWebSocket = () => {
      const { addLog, isEvolutionActive } = useAppStore();
      const ws = useRef<WebSocket | null>(null);

      useEffect(() => {
        if (!isEvolutionActive) {
          if (ws.current) {
            ws.current.close();
          }
          return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
        ws.current = new WebSocket(wsUrl);

        ws.current.onmessage = (event) => {
          // Assuming the backend sends JSON: { type: 'log', message: '[SYSTEM] ...' }
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'log') {
              addLog(data.message);
            }
            // Handle other event types (e.g., 'graph_update', 'code_update') here
          } catch (e) {
             // Fallback if it's just a plain string
             addLog(event.data);
          }
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          addLog('[ERROR] WebSocket connection failed.');
        };

        ws.current.onclose = () => {
          console.log('WebSocket connection closed.');
        };

        return () => {
          if (ws.current) {
            ws.current.close();
          }
        };
      }, [isEvolutionActive, addLog]);
    };
    ```

2.  **Update `app/dashboard/page.tsx`:**

    Change the import from `useMockWebSocket` to `useWebSocket`.

    ```typescript
    // import { useMockWebSocket } from '@/hooks/use-mock-websocket';
    import { useWebSocket } from '@/hooks/use-websocket';

    export default function DashboardPage() {
      // ...
      // useMockWebSocket();
      useWebSocket();
      // ...
    }
    ```

### B. Fetching Graph Data (REST API)

If your graph data (nodes and edges) comes from a REST API rather than the WebSocket, you should use React Query to fetch it.

1.  **Install React Query (if not already installed):**
    ```bash
    npm install @tanstack/react-query
    ```

2.  **Setup QueryClient in `app/layout.tsx`:**
    Wrap your application with `QueryClientProvider`.

3.  **Fetch Data in `app/dashboard/page.tsx`:**

    ```typescript
    import { useQuery } from '@tanstack/react-query';
    // ... other imports

    const fetchGraphData = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graph`);
      if (!res.ok) throw new Error('Failed to fetch graph data');
      return res.json();
    };

    export default function DashboardPage() {
      // ...
      const { data: graphData, isLoading } = useQuery({
        queryKey: ['graphData'],
        queryFn: fetchGraphData,
        // Optional: Refetch interval if you want polling instead of WS for the graph
        // refetchInterval: 5000,
      });

      const nodes = graphData?.nodes || [];
      const edges = graphData?.edges || [];

      // ... use `nodes` and `edges` in the ReactFlow component instead of `mockNodes` and `mockEdges`
    }
    ```

### C. Fetching Code (REST API)

Similar to the graph data, fetch the code for the Monaco Editor from your backend.

```typescript
    const fetchCode = async (moduleId: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/modules/${moduleId}/code`);
      if (!res.ok) throw new Error('Failed to fetch code');
      const data = await res.json();
      return data.code;
    };

    // Inside component:
    const { data: code } = useQuery({
        queryKey: ['code', currentModuleId],
        queryFn: () => fetchCode(currentModuleId),
        enabled: !!currentModuleId,
    });

    // Pass `code` to the Editor component's `value` prop.
```

## 3. Backend API Contract Expectations

To ensure smooth integration, the backend (FastAPI) should ideally provide the following endpoints/connections:

*   **`WS /ws`**: A WebSocket endpoint that streams real-time events.
    *   Expected message format (JSON):
        *   `{ "type": "log", "message": "[SYSTEM] ..." }`
        *   `{ "type": "status", "status": "evolving" | "idle" }`
        *   `{ "type": "graph_update", "nodes": [...], "edges": [...] }` (Optional, if pushing graph updates via WS)
*   **`GET /api/graph`**: Returns the current state of the capability graph.
    *   Expected response: `{ "nodes": [...], "edges": [...] }`
*   **`GET /api/modules/{module_id}/code`**: Returns the source code for a specific module.
    *   Expected response: `{ "code": "export class..." }`
*   **`POST /api/tasks`**: Submits a new task to the system.
    *   Expected payload: `{ "task": "Analyze market trends" }`
*   **`POST /api/control/halt`**: Stops the current evolution sequence.
*   **`POST /api/control/start`**: Starts the evolution sequence.

By following this guide, you can replace the mock implementations with real connections to your AXON backend engine.

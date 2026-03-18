# AXON Frontend

This is the frontend application for AXON, an autonomous AI system that builds and evolves its own next versions.

## Tech Stack

*   **Runtime:** [Bun](https://bun.sh/)
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS 4
*   **UI Components:** shadcn/ui
*   **Animations:** Framer Motion / Motion
*   **Graphs:** React Flow (XYFlow)
*   **Code Viewer:** Monaco Editor
*   **State Management:** Zustand
*   **Data Fetching:** React Query

## Getting Started

1.  **Install dependencies:**
    ```bash
    bun install
    ```

2.  **Run the development server:**
    ```bash
    bun run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

*   `app/`: Next.js App Router pages and layouts.
    *   `page.tsx`: Landing page.
    *   `dashboard/page.tsx`: Main control room dashboard.
*   `components/`: Reusable UI components (shadcn/ui and custom).
*   `hooks/`: Custom React hooks (e.g., `use-mock-websocket`).
*   `lib/`: Utility functions and mock data.
*   `store/`: Zustand state management.
*   `styles/`: Global CSS and Tailwind configuration.
*   `docs/`: Additional documentation.

## Integration

See `INTEGRATION.md` for instructions on connecting this frontend to the AXON backend.

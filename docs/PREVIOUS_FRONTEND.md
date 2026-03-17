# AXON Previous Frontend Implementation Guide

This document captures the full design of the **original Next.js frontend** that was in place before the migration to vanilla HTML/CSS/JavaScript. It is intended as a historical reference so contributors can understand what was built, how it was structured, why certain decisions were made, and what patterns existed before the rewrite.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Configuration Files](#4-configuration-files)
   - [package.json](#41-packagejson)
   - [tsconfig.json](#42-tsconfigjson)
   - [next.config.ts](#43-nextconfigts)
   - [tailwind.config.ts](#44-tailwindconfigts)
   - [postcss.config.js](#45-postcssconfigjs)
   - [biome.json](#46-biomejson)
   - [.env.example](#47-envexample)
5. [Application Entry Points](#5-application-entry-points)
   - [Root Layout](#51-root-layout)
   - [Global CSS](#52-global-css)
   - [Home Page](#53-home-page)
6. [Components](#6-components)
   - [UI Primitives](#61-ui-primitives)
   - [Dashboard Components](#62-dashboard-components)
   - [Task Component](#63-task-component)
7. [Services](#7-services)
   - [REST API Client](#71-rest-api-client)
   - [WebSocket Client](#72-websocket-client)
8. [State Management](#8-state-management)
   - [Axon State](#81-axon-state)
   - [Version Store](#82-version-store)
9. [Docker & Build Pipeline](#9-docker--build-pipeline)
   - [frontend.Dockerfile](#91-frontenddockerfile)
   - [nginx.Dockerfile (two-stage variant)](#92-nginxdockerfile-two-stage-variant)
10. [Development Workflow](#10-development-workflow)
11. [Linting & Formatting](#11-linting--formatting)
12. [Why the Stack Was Chosen](#12-why-the-stack-was-chosen)
13. [Known Limitations and Reasons for Migration](#13-known-limitations-and-reasons-for-migration)

---

## 1. Overview

The original AXON frontend was a **Next.js 15** application written in **TypeScript** and styled with **Tailwind CSS**. It used the Next.js **App Router** introduced in Next.js 13+ and was managed via **Bun** as both the package manager and JavaScript runtime. Code quality was enforced with **Biome** (a Rust-based all-in-one linter + formatter).

The application was scaffolded as a dashboard for the AXON self-evolving AI agent system. At the time it was replaced, all components were stubs intended to be filled in as the backend API matured.

---

## 2. Technology Stack

| Concern | Tool / Library | Version |
|---|---|---|
| Framework | Next.js | 15.2.0 |
| UI library | React + ReactDOM | 19.0.0 |
| Language | TypeScript | 5.7.2 |
| CSS framework | Tailwind CSS | 3.4.16 |
| PostCSS | postcss + autoprefixer | 8.4.49 / 10.4.20 |
| Package manager / runtime | Bun | 1.x |
| Linter + formatter | Biome | 1.9.4 |
| Type stubs | @types/node, @types/react, @types/react-dom | 22.x / 19.x |

---

## 3. Project Structure

```
frontend/
├── .env.example                   # Environment variable template
├── biome.json                     # Biome linter/formatter config
├── bun.lock / bun.lockb           # Bun lockfile (text + binary)
├── next-env.d.ts                  # Auto-generated Next.js TS reference
├── next.config.ts                 # Next.js configuration (static export)
├── package.json                   # Dependencies and scripts
├── postcss.config.js              # PostCSS plugins (Tailwind + autoprefixer)
├── tailwind.config.ts             # Tailwind content paths
├── tsconfig.json                  # TypeScript compiler options
└── src/
    ├── app/
    │   ├── globals.css            # Tailwind base + utility injections
    │   ├── layout.tsx             # Root layout — <html>, <body>, metadata
    │   └── page.tsx               # Home page (/)
    ├── components/
    │   ├── dashboard/
    │   │   ├── brain_logs.tsx     # Brain Logs panel stub
    │   │   ├── capability_graph.tsx  # Capability graph stub
    │   │   ├── code_viewer.tsx    # Code viewer stub
    │   │   └── evolution_timeline.tsx  # Evolution timeline stub
    │   ├── task/
    │   │   └── task_input.tsx     # Task input form stub
    │   └── ui/
    │       ├── button.tsx         # Generic <button> wrapper
    │       ├── card.tsx           # Card container component
    │       └── layout.tsx         # Full-height wrapper layout
    ├── services/
    │   ├── api.ts                 # REST fetch wrapper
    │   └── websocket.ts           # WebSocket factory
    └── state/
        ├── axon_state.ts          # Agent status type + initial state
        └── version_store.ts       # Version tracking type + initial state
```

---

## 4. Configuration Files

### 4.1 `package.json`

```json
{
  "name": "axon-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "check": "biome check .",
    "format": "biome format --write ."
  },
  "dependencies": {
    "next": "15.2.0",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "@types/node": "22.10.2",
    "@types/react": "19.0.2",
    "@types/react-dom": "19.0.2",
    "autoprefixer": "10.4.20",
    "postcss": "8.4.49",
    "tailwindcss": "3.4.16",
    "typescript": "5.7.2"
  }
}
```

**Key points:**
- `dev` starts the Next.js development server with HMR on `http://localhost:3000`.
- `build` generates a static export (`out/`) because `next.config.ts` sets `output: "export"`.
- `check` runs Biome's combined lint + format check.
- `format` applies Biome's auto-formatter in-place.

### 4.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Key points:**
- `strict: true` enables all strict type checks (`strictNullChecks`, `noImplicitAny`, etc.).
- `noEmit: true` — TypeScript is used only for type-checking; Next.js (via Bun/SWC) handles transpilation.
- `moduleResolution: "bundler"` is the modern setting for bundler-aware module resolution.
- `@/*` path alias maps to `./src/*`, allowing clean imports like `import Button from "@/components/ui/button"`.
- `jsx: "preserve"` lets Next.js/SWC handle JSX transformation.

### 4.3 `next.config.ts`

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
};

export default nextConfig;
```

**Key point:** `output: "export"` instructs Next.js to emit a fully static site into the `out/` directory after `next build`. This means no Node.js server is required at runtime — the built artefact is plain HTML/CSS/JS that can be served by any static file server (nginx in this case). Server-side rendering, API routes, and middleware are all disabled in this mode.

### 4.4 `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

**Key point:** The `content` array tells Tailwind which files to scan for class names. Tailwind performs dead-code elimination — only the utility classes actually used in these files are emitted into the final CSS bundle. No custom theme extensions or plugins were added.

### 4.5 `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

PostCSS is the CSS processing pipeline. Two plugins are used:
- `tailwindcss` — runs the Tailwind compiler, which processes `@tailwind` directives in `globals.css`.
- `autoprefixer` — automatically adds vendor prefixes (e.g. `-webkit-`) for browser compatibility.

### 4.6 `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

**Key points:**
- Biome replaces both ESLint and Prettier in a single tool.
- Indent: 2 spaces, max line width: 100 characters.
- JavaScript/TypeScript: double quotes, always use semicolons.
- `recommended: true` enables Biome's curated set of lint rules covering correctness, performance, style, and accessibility.

### 4.7 `.env.example`

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_WS_BASE_URL=ws://127.0.0.1:8000
```

Environment variables prefixed with `NEXT_PUBLIC_` are inlined into the client bundle at build time by Next.js. Two variables were defined:
- `NEXT_PUBLIC_API_BASE_URL` — base URL for the FastAPI REST backend (default: local dev).
- `NEXT_PUBLIC_WS_BASE_URL` — base URL for WebSocket connections (default: local dev).

In Docker, these would be set as build-time ARGs in the Dockerfile to point to `/api` and `/ws` respectively, so nginx could proxy them.

---

## 5. Application Entry Points

### 5.1 Root Layout

**File:** `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AXON",
  description: "Self-evolving AI agent system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

This is the **App Router root layout**. In Next.js 13+, every page is wrapped by the nearest `layout.tsx` in its directory tree. The root layout:
- Sets the HTML `lang` attribute.
- Declares `<head>` metadata (title, description) that Next.js injects automatically.
- Imports the global CSS so Tailwind base styles apply everywhere.
- Renders `{children}` inside `<body>`, where any nested page or layout will appear.

### 5.2 Global CSS

**File:** `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  @apply bg-slate-50 text-slate-900;
}
```

- `@tailwind base` — injects Tailwind's [Preflight](https://tailwindcss.com/docs/preflight) CSS reset.
- `@tailwind components` — reserved layer for Tailwind component classes (empty here).
- `@tailwind utilities` — generates all utility classes used in the project.
- `color-scheme: light` pins the browser to light mode.
- `body` uses Tailwind's `@apply` directive to set the default background and text colours.

### 5.3 Home Page

**File:** `src/app/page.tsx`

```tsx
export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold">AXON Dashboard</h1>
      <p className="mt-2 text-slate-600">Frontend scaffold is ready.</p>
    </main>
  );
}
```

This was the `/` route. It is a **React Server Component** (the default in the Next.js App Router). All Tailwind utility classes here are JIT-compiled at build time. It was a placeholder — the final dashboard composition was intended to import and arrange the dashboard components.

---

## 6. Components

All components were **stub implementations** — they rendered a labelled `<div>` and were intended to be fleshed out as the backend APIs and data models were finalised.

### 6.1 UI Primitives

These live under `src/components/ui/` and formed the reusable design-system building blocks.

#### `layout.tsx`

```tsx
import type { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return <div className="min-h-screen">{children}</div>;
}
```

A thin wrapper that ensures the page is at least full-viewport height. Intended to wrap page content within the dashboard shell.

#### `card.tsx`

```tsx
import type { PropsWithChildren } from "react";

export default function Card({ children }: PropsWithChildren) {
  return <div className="rounded border border-slate-200 bg-white p-4">{children}</div>;
}
```

A basic card surface: rounded corners, a subtle border in `slate-200`, white background, and `1rem` padding on all sides. Intended as the container for each dashboard panel.

#### `button.tsx`

```tsx
import type { ButtonHTMLAttributes } from "react";

export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} />;
}
```

A thin wrapper around the native `<button>` that spreads all standard HTML button attributes. Sets `type="button"` by default (preventing accidental form submission). Styling was intentionally left to call sites via `className`.

### 6.2 Dashboard Components

These live under `src/components/dashboard/` and represent the main panels of the AXON interface.

#### `brain_logs.tsx`

```tsx
export default function BrainLogs() {
  return <div>Brain Logs</div>;
}
```

Intended to display a real-time scrolling feed of internal agent reasoning logs, streamed via the WebSocket `/ws/events` endpoint.

#### `capability_graph.tsx`

```tsx
export default function CapabilityGraph() {
  return <div>Capability Graph</div>;
}
```

Intended to render an interactive capability graph (planned using **React Flow**) showing the set of skills registered by the AXON agent system and the relationships between them.

#### `code_viewer.tsx`

```tsx
export default function CodeViewer() {
  return <div>Code Viewer</div>;
}
```

Intended to display code snippets generated or evolved by the AXON system, likely with syntax highlighting.

#### `evolution_timeline.tsx`

```tsx
export default function EvolutionTimeline() {
  return <div>Evolution Timeline</div>;
}
```

Intended to show a chronological timeline of agent evolution events — version bumps, skill additions/removals, parameter updates — streamed from the backend.

### 6.3 Task Component

#### `task/task_input.tsx`

```tsx
export default function TaskInput() {
  return <div>Task Input</div>;
}
```

Intended to be the primary input form allowing users to submit natural-language task descriptions to the AXON agent. Would POST to the backend `/tasks` REST endpoint and reflect submission status.

---

## 7. Services

### 7.1 REST API Client

**File:** `src/services/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}
```

**Design decisions:**
- `NEXT_PUBLIC_API_BASE_URL` is read at **build time** and inlined into the bundle. There is no runtime configuration. For Docker, the build ARG `NEXT_PUBLIC_API_BASE_URL=/api` ensured nginx could proxy the request transparently.
- Falls back to `http://127.0.0.1:8000` for local development where nginx is not present.
- Only `getHealth` was implemented; task submission, evolution queries, etc., were planned but not yet added.

### 7.2 WebSocket Client

**File:** `src/services/websocket.ts`

```typescript
export function createEventSocket() {
  const base = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://127.0.0.1:8000";
  return new WebSocket(`${base}/ws/events`);
}
```

**Design decisions:**
- Returns a raw `WebSocket` instance — the caller was responsible for attaching event listeners (`onmessage`, `onclose`, `onerror`).
- `NEXT_PUBLIC_WS_BASE_URL` was similarly inlined at build time.
- Only a single event channel (`/ws/events`) was defined; the backend supports this endpoint for broadcasting agent activity.

---

## 8. State Management

No third-party state management library (Redux, Zustand, Jotai, etc.) was used. State was managed as plain TypeScript types and initial-value constants, to be consumed by React context or component-local `useState` hooks as the app grew.

### 8.1 Axon State

**File:** `src/state/axon_state.ts`

```typescript
export type AxonState = {
  status: "idle" | "running";
};

export const initialAxonState: AxonState = {
  status: "idle",
};
```

Tracks whether the AXON agent is idle or currently executing a task. The discriminated union `"idle" | "running"` was chosen to make status checks exhaustive and prevent invalid states.

### 8.2 Version Store

**File:** `src/state/version_store.ts`

```typescript
export type VersionStore = {
  currentVersion: string;
};

export const initialVersionStore: VersionStore = {
  currentVersion: "0.0.1",
};
```

Tracks the current agent version string. Intended to be updated from a backend version endpoint or WebSocket event as the evolution engine bumped versions.

---

## 9. Docker & Build Pipeline

### 9.1 `frontend.Dockerfile`

**File:** `docker/frontend.Dockerfile`

```dockerfile
# Stage 1: Build stage
FROM oven/bun:1 as builder

WORKDIR /app

COPY frontend/package.json frontend/bun.lockb* ./

RUN bun install --frozen-lockfile

COPY frontend/ ./

RUN bun run build

# Stage 2: Final stage
FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "start"]
```

This was the standalone frontend Dockerfile for running the Next.js production server on port 3000.

- **Stage 1 (builder):** Uses `oven/bun:1`, installs dependencies with `--frozen-lockfile` (reproducible installs), then runs `bun run build` to compile TypeScript and generate the `.next/` output.
- **Stage 2:** Copies only the runtime artefacts (`.next/`, `node_modules/`, `package.json`, `next.config.ts`) into a fresh image, reducing image size by excluding source files and build tooling.

> **Note:** Because `next.config.ts` set `output: "export"`, a fully static `out/` directory was also generated. The `frontend.Dockerfile` served the `.next/` server output; the `nginx.Dockerfile` (see below) was the intended production path that served the static `out/` directory.

### 9.2 `nginx.Dockerfile` (two-stage variant)

**File:** `docker/nginx.Dockerfile` (before migration)

```dockerfile
# Stage 1: Build the Next.js static files
FROM oven/bun:1 AS builder

WORKDIR /app

COPY frontend/package.json frontend/bun.lockb* ./

RUN bun install --frozen-lockfile

COPY frontend/ ./

ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_WS_BASE_URL=/ws
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_WS_BASE_URL=${NEXT_PUBLIC_WS_BASE_URL}

RUN bun run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

This was the **production** container image. It:
1. Accepted `NEXT_PUBLIC_API_BASE_URL=/api` and `NEXT_PUBLIC_WS_BASE_URL=/ws` as build-time ARGs, inlining them into the bundle so that all API and WebSocket calls would use relative paths (proxied by nginx to the backend container).
2. Built the static export into `out/`.
3. Copied `out/` into `nginx:alpine`'s web root and applied the nginx reverse-proxy configuration.

---

## 10. Development Workflow

### Prerequisites

- [Bun](https://bun.sh) 1.x installed globally.
- Node.js is **not** required; Bun replaces it entirely.

### Install dependencies

```bash
cd frontend
bun install
```

### Start dev server

```bash
bun dev
```

Starts Next.js with **Fast Refresh** (hot module replacement) on `http://localhost:3000`.

### Build static export

```bash
bun build
# equivalent to: bun run build
```

Outputs a fully static site to `frontend/out/`.

### Start production server (from .next/)

```bash
bun start
```

Serves the compiled Next.js output (used by `frontend.Dockerfile`).

### Environment setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_WS_BASE_URL` to match your backend URLs. These values are **baked in at build time** — rerunning `bun build` is required after changing them.

---

## 11. Linting & Formatting

Biome handled both linting and formatting in a single pass.

### Check (lint + format check)

```bash
bun check
# equivalent to: bun run check
```

Exits with a non-zero code if any lint violations or formatting differences are found. Suitable for CI.

### Auto-format

```bash
bun format
# equivalent to: bun run format
```

Rewrites files in place to match the configured style. Should be run before committing.

### Biome rules in effect

With `"recommended": true`, the following rule categories were active:

| Category | Example rules |
|---|---|
| Correctness | `noUnusedVariables`, `noConstantCondition` |
| Style | `useConst`, `useTemplate` |
| Suspicious | `noExplicitAny`, `noDebugger` |
| Performance | `noAccumulatingSpread` |
| Accessibility | `useAltText`, `useKeyWithClickEvents` |

---

## 12. Why the Stack Was Chosen

| Decision | Rationale |
|---|---|
| **Next.js App Router** | Provides file-system routing, React Server Components, metadata APIs, and `output: "export"` for static site generation — all without manual Webpack configuration. |
| **React 19** | Latest stable release; concurrent features (Suspense, transitions) would be useful once data fetching was implemented. |
| **TypeScript (strict)** | Type safety across the codebase reduces runtime errors and makes refactoring safer as the dashboard grows. |
| **Tailwind CSS** | Utility-first CSS eliminates the need to write custom class names; the JIT compiler removes unused styles, keeping bundle size small. |
| **Bun** | Significantly faster installs and builds than npm/yarn/pnpm; direct TypeScript execution without a separate transpile step in dev mode. |
| **Biome** | One tool instead of ESLint + Prettier; written in Rust, so it runs much faster on large codebases. Avoids versioning conflicts between eslint plugins. |
| **Static export (`output: "export"`)** | Removes the need for a Node.js server in production; the entire frontend is a folder of HTML/CSS/JS served by nginx. Simplifies the Docker topology. |

---

## 13. Known Limitations and Reasons for Migration

The following factors drove the decision to replace the Next.js stack with plain vanilla HTML/CSS/JavaScript:

1. **All components were stubs.** The React component tree provided no functionality beyond labelled `<div>` elements. The overhead of the full Next.js/React/TypeScript/Bun toolchain was disproportionate to the value delivered.

2. **Build-time environment variable baking.** `NEXT_PUBLIC_*` variables are inlined at build time, not runtime. Changing the backend URL required rebuilding the entire Docker image — a friction point in deployment pipelines.

3. **Toolchain complexity for a simple dashboard.** The project required Bun, Node module resolution, TypeScript compilation, PostCSS, Tailwind JIT, Biome, and the Next.js build pipeline just to produce a static page. A vanilla approach achieves the same output with zero tooling.

4. **Cold build time.** Even with Bun's speed advantage, a full `next build` takes seconds to tens of seconds. Serving static files directly from nginx eliminates this step entirely.

5. **Dependency surface.** `node_modules/` for a minimal Next.js app is hundreds of megabytes. A vanilla frontend has zero runtime or build-time JavaScript dependencies.

6. **Alignment with project direction.** The decision was made to keep the frontend as simple as possible until the backend APIs, data models, and UX requirements are fully defined, at which point a framework can be introduced deliberately rather than speculatively.

---

*This document was written retrospectively at the time of the vanilla migration. For the current frontend implementation, see `frontend/index.html`, `frontend/css/styles.css`, and `frontend/js/`.*

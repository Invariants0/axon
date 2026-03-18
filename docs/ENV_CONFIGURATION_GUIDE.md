# AXON Environment Configuration Guide

**Last Updated:** March 18, 2026  
**Version:** 1.0

---

## Table of Contents

1. [Core Configuration](#core-configuration)
2. [AI Providers](#ai-providers)
3. [Storage & Database](#storage--database)
4. [Vector Database Configuration](#vector-database-configuration)
5. [API Configuration](#api-configuration)
6. [Runtime & Logging](#runtime--logging)
7. [Hackathon Mode & Security](#hackathon-mode--security)
8. [Phase-2: Concurrency & Worker Management](#phase-2-concurrency--worker-management)
9. [DigitalOcean / Gradient Agent Integration](#digitalocean--gradient-agent-integration)
10. [Phase-3: Distributed Infrastructure](#phase-3-distributed-infrastructure)

---

## Core Configuration

### `APP_NAME`
- **Value:** `AXON`
- **Purpose:** Identifies the application name used in logs, headers, and error messages
- **Type:** String
- **Usage:** Header identification, logging, branding

### `ENV`
- **Value:** `development` | `staging` | `production`
- **Purpose:** Sets the execution environment affecting error verbosity, debugging, and feature flags
- **Type:** String
- **Usage:** Controls behavior based on environment (e.g., error stack traces shown in dev, hidden in prod)
- **Current:** `development`

### `TEST_MODE`
- **Value:** `true` | `false`
- **Purpose:** Enables testing mode with mock responses and bypass of certain validations
- **Type:** Boolean
- **Usage:** Used during automated testing and development; prevents real API calls to external services
- **Current:** `true`

---

## AI Providers

### Google Gemini

#### `GEMINI_API_KEY`
- **Value:** (empty - needs to be filled)
- **Purpose:** API key for Google Gemini (advanced AI model)
- **Type:** String
- **Obtained From:** Google AI Studio → https://aistudio.google.com/app/apikeys
- **Usage:** Authenticate requests to Google's Gemini API
- **When Used:** When `AXON_MODE=gemini`
- **Security:** Keep secret; never commit to version control

#### `GEMINI_MODEL`
- **Value:** `gemini-2.5-flash`
- **Purpose:** Specifies which Gemini model version to use
- **Type:** String
- **Model Details:** Gemini 2.5 Flash - fast, multimodal model optimized for latency
- **Usage:** Used for real-time AI planning and canvas instruction generation
- **Current:** Gemini 2.5 Flash (selected for hackathon demos)
- **Note:** This is the primary AI provider in current setup

---

## Storage & Database

### `DATABASE_URL`
- **Value:** `postgresql+asyncpg://postgres:postgres@localhost:5432/axon`
- **Purpose:** Connection string for PostgreSQL database
- **Type:** Connection URI
- **Format:** `postgresql+asyncpg://[user]:[password]@[host]:[port]/[database]`
  - `user`: postgres (default superuser)
  - `password`: postgres (default password - CHANGE IN PRODUCTION!)
  - `host`: localhost (local development)
  - `port`: 5432 (default PostgreSQL port)
  - `database`: axon (database name)
- **Usage:** 
  - Store board metadata, user profiles, permissions
  - Alembic migrations tracked here
  - Async connection pool via asyncpg driver
- **Security:** Never use default credentials in production

### `EMBEDDING_MODEL`
- **Value:** `sentence-transformers/all-MiniLM-L6-v2`
- **Purpose:** Specifies which embedding model converts text into vectors
- **Type:** Hugging Face model identifier
- **Model Details:** MiniLM L6 - lightweight semantic embeddings (384-dimensional)
- **Usage:** Convert board descriptions, canvas content into searchable vectors
- **Performance:** Fast inference, suitable for real-time embedding generation
- **Dimension:** 384 features (see `EMBEDDING_DIMENSION` below)

### `VECTOR_DB_PATH`
- **Value:** `.chroma`
- **Purpose:** Local file path for Chroma vector database storage
- **Type:** Relative file path
- **Usage:** When using local Chroma (not cloud Qdrant)
- **Note:** Creates `.chroma/` directory in project root for persistent embeddings
- **When Used:** Fallback if Qdrant is unavailable

---

## Vector Database Configuration

### `VECTOR_DB_PROVIDER`
- **Value:** `chroma` | `qdrant`
- **Purpose:** Selects which vector database backend to use
- **Type:** String enum
- **Options:**
  - `chroma`: Local/in-memory vector store (simple, good for dev)
  - `qdrant`: Cloud-hosted vector database (scalable, production-ready)
- **Current:** `qdrant` (cloud-based)
- **Usage:** Determines where board embeddings and semantic search results are stored
- **Impact:** Affects performance, scalability, and data persistence

### `EMBEDDING_DIMENSION`
- **Value:** `384`
- **Purpose:** Dimensionality of embedding vectors
- **Type:** Integer
- **Relationship:** Must match the embedding model's output dimension
  - MiniLM L6 outputs 384-dimensional vectors
  - Must align with Qdrant collection dimension
- **Usage:** Validates embedding shapes before storage
- **Note:** Changing this requires recreating embeddings

### Qdrant Cloud Configuration

#### `QDRANT_URL`
- **Value:** `https://1d209353-05ed-4c56-8f05-c375bb5c308d.eu-west-1-0.aws.cloud.qdrant.io:6333`
- **Purpose:** HTTPS endpoint for Qdrant cloud vector database
- **Type:** URL
- **Obtained From:** Qdrant Cloud console → Cluster URLs
- **Usage:** Connect to managed Qdrant instance for storing/retrieving embeddings
- **Region:** eu-west-1 (AWS Ireland)
- **Port:** 6333 (Qdrant REST API port)
- **Security:** Uses HTTPS encryption in transit

#### `QDRANT_API_KEY`
- **Value:** JWT token (shown in config)
- **Purpose:** Authentication token for Qdrant Cloud API
- **Type:** JWT string
- **Obtained From:** Qdrant Cloud → API Keys section
- **Usage:** Authenticate all requests to the Qdrant cluster
- **Scope:** "m" = full management access on this token
- **Security:** Keep secret; treat like database password
- **Expiry:** Check in Qdrant console for token expiration date

#### `QDRANT_COLLECTION`
- **Value:** `axon_memory`
- **Purpose:** Name of the vector collection storing embeddings
- **Type:** String
- **Usage:** Groups all board embeddings under one logical collection
- **Contains:** 
  - Board descriptions as vectors
  - Canvas semantic search indices
  - AI context memory embeddings
- **Schema:** Auto-created with 384-dimensional vectors

---

## API Configuration

### `CORS_ORIGINS`
- **Value:** `["http://localhost:3000"]`
- **Purpose:** Whitelist of origins allowed to make cross-origin requests
- **Type:** JSON array of URLs
- **Usage:** 
  - Frontend at `http://localhost:3000` can call backend APIs
  - Prevents CSRF attacks by rejecting unauthorized origins
  - Set in backend Express CORS middleware
- **Production Example:** `["https://app.axon.com", "https://www.axon.com"]`
- **Security:** Never use `"*"` in production

### `RATE_LIMIT_PER_MIN`
- **Value:** `120`
- **Purpose:** Maximum API requests allowed per minute per client
- **Type:** Integer
- **Usage:** Prevent abuse, DDoS attacks, and excessive API costs
- **Applied To:** Global rate limiter (all endpoints)
  - 120 requests/minute = 2 requests/second average
  - Burst capacity higher (usually 20-30 burst)
- **Current Setting:** Suitable for development and hackathon
- **Production:** May need adjustment based on user load

---

## Runtime & Logging

### `AXON_MODE`
- **Value:** `gemini` | `gradient` | `huggingface` | `mock`
- **Purpose:** Selects which AI backend to use for planning
- **Type:** String enum
- **Current:** `gemini` (primary for hackathon)
- **Usage:** 
  - `gemini`: Use Google Gemini API (recommended, fastest)
  - `gradient`: Use DigitalOcean Gradient (cost-effective)
  - `huggingface`: Use open-source models (privacy-focused)
  - `mock`: Return fake responses (testing without API calls)
- **Impact:** Changes which AI model processes canvas instructions
- **Runtime Decision:** Backend reads this at startup

### `LOG_LEVEL`
- **Value:** `DEBUG` | `INFO` | `WARN` | `ERROR`
- **Purpose:** Minimum severity level for logs to be recorded
- **Type:** String enum
- **Current:** `INFO` (balanced verbosity)
- **Levels:**
  - `DEBUG`: Everything (very verbose, for development)
  - `INFO`: Normal operation info + errors (standard production)
  - `WARN`: Warnings and errors only (minimal output)
  - `ERROR`: Only errors (silent operation)
- **Usage:** Reduces noise, improves debugging relevance

### `LOG_JSON`
- **Value:** `true` | `false`
- **Purpose:** Output logs as structured JSON vs. human-readable text
- **Type:** Boolean
- **Current:** `false` (human-readable)
- **Usage:**
  - `false`: Pretty-printed logs (great for development/debugging)
  - `true`: JSON format (great for log aggregation services like Datadog, Splunk)
- **Production Recommendation:** `true` when using centralized logging

---

## Hackathon Mode & Security

### `AXON_API_KEY`
- **Value:** (empty - leave empty for production without frontend auth)
- **Purpose:** Optional API key for endpoint protection in restricted environments
- **Type:** String (should be complex/random if used)
- **Usage:** Add `X-AXON-KEY` header to requests when this is set
- **When Needed:** Only if running without OAuth/JWT (e.g., isolated networks, testing)
- **Note:** Leave empty in production; JWT is primary auth mechanism
- **Security:** Should be a long, random string if enabled

### `AXON_DEBUG_PIPELINE`
- **Value:** `true` | `false`
- **Purpose:** Enable detailed logging of AI planning pipeline
- **Type:** Boolean
- **Current:** `true` (debugging enabled)
- **Usage:**
  - Logs each stage of plan processing
  - Shows Gemini prompts and responses
  - Useful for understanding why plans fail or succeed
  - Can output sensitive data (prompts, canvas state) to logs
- **Security:** Set to `false` in production to prevent data leaks

### `SKILL_EXECUTION_TIMEOUT`
- **Value:** `20`
- **Purpose:** Maximum seconds to wait for a skill to complete
- **Type:** Integer (seconds)
- **Current:** 20 seconds
- **Usage:** 
  - Prevents hanging requests if skill execution stalls
  - Applies to all canvas action executions
  - If exceeded, plan execution fails and user is notified
- **Tuning:** Increase for complex boards, decrease for responsive UX

---

## Phase-2: Concurrency & Worker Management

### `AXON_WORKER_COUNT`
- **Value:** `1`
- **Purpose:** Number of concurrent workers processing tasks
- **Type:** Integer
- **Current:** `1` (single worker, backward compatible)
- **Usage:**
  - Controls horizontal parallelism
  - `1`: Sequential processing (simpler, better debugging)
  - `2-4`: Safe concurrent processing (good for medium load)
  - `8+`: High throughput (requires load balancing)
- **Note:** Works with `AXON_QUEUE_BACKEND` for task distribution
- **Scaling:** Increase for higher concurrent plan generation demands

---

## DigitalOcean / Gradient Agent Integration

### `DIGITALOCEAN_API_TOKEN`
- **Value:** (empty - needs to be filled)
- **Purpose:** Authentication token for DigitalOcean API
- **Type:** String (personal access token)
- **Obtained From:** DigitalOcean console → API → Tokens → Generate New Token
- **Usage:** 
  - Authenticate calls to DigitalOcean services (Droplets, spaces, etc.)
  - Required for Gradient agent mode operations
  - Allows backend to manage infrastructure
- **Permissions Needed:** Read/Write on Droplet, App Platform, Spaces
- **When Used:** When `AXON_MODE=gradient` with agent features

### `GRADIENT_MODEL_ACCESS_KEY`
- **Value:** (empty - needs to be filled)
- **Purpose:** Alternative credentials for Gradient API access
- **Type:** String
- **Relationship:** Works alongside `GRADIENT_API_KEY`
- **Usage:** Secondary authentication method for Gradient requests
- **Note:** May be used for key rotation or high-security deployments

### `DIGITALOCEAN_KB_UUID`
- **Value:** (empty - needs to be filled)
- **Purpose:** Unique identifier for DigitalOcean Knowledge Base
- **Type:** UUID string
- **Usage:** Routes knowledge/skill requests to specific KB instance
- **When Used:** When agents need to fetch domain-specific knowledge
- **Example Format:** `550e8400-e29b-41d4-a716-446655440000`

### `AXON_AGENT_TIMEOUT`
- **Value:** `120`
- **Purpose:** Maximum seconds for remote agent operations to complete
- **Type:** Integer (seconds)
- **Current:** 120 seconds (2 minutes)
- **Usage:**
  - Prevents indefinite waiting for planner, researcher, reasoner, builder agents
  - Each agent call fails gracefully if timeout exceeded
  - Higher for complex research tasks, lower for quick iterations
- **Tuning:** 60s for hackathon, 180s+ for production agents

### Agent URLs (Remote Agent Endpoints)

#### `AXON_PLANNER_AGENT_URL`
- **Purpose:** Endpoint for planning agent (breaks down tasks into steps)
- **Type:** URL
- **Value:** (empty - requires remote agent deployment)
- **Usage:** POST requests to generate task decomposition plans

#### `AXON_RESEARCH_AGENT_URL`
- **Purpose:** Endpoint for research agent (gathers context, searches docs)
- **Type:** URL
- **Value:** (empty - requires remote agent deployment)
- **Usage:** POST requests to research questions and contextual data

#### `AXON_REASONING_AGENT_URL`
- **Purpose:** Endpoint for reasoning agent (logical problem-solving)
- **Type:** URL
- **Value:** (empty - requires remote agent deployment)
- **Usage:** POST requests to reason through complex decisions

#### `AXON_BUILDER_AGENT_URL`
- **Purpose:** Endpoint for builder agent (executes code/infrastructure tasks)
- **Type:** URL
- **Value:** (empty - requires remote agent deployment)
- **Usage:** POST requests to build/modify systems

**Note:** These are optional; AXON falls back to direct Gemini if agents are unavailable.

---

## Phase-3: Distributed Infrastructure

### `AXON_QUEUE_BACKEND`
- **Value:** `inmemory` | `redis`
- **Purpose:** Selects task queue backend for distributed task processing
- **Type:** String enum
- **Current:** `inmemory` (single-process only)
- **Options:**
  - `inmemory`: In-memory queue (fast, no persistence, single-server only)
    - Good for: Development, single-server deployment
    - Bad for: Horizontal scaling, task durability
  - `redis`: Distributed Redis queue (durable, multi-server)
    - Good for: Production, horizontal scaling, resilience
    - Bad for: Additional Redis infrastructure dependency
- **Usage:** Determines how tasks are queued and distributed across workers
- **Migration Path:** Start with `inmemory`, switch to `redis` at scale

### `AXON_REDIS_URL`
- **Value:** `redis://localhost:6379`
- **Purpose:** Connection string for Redis instance (task queue and cache)
- **Type:** Connection URI
- **Format:** `redis://[host]:[port]`
  - `host`: localhost (local dev) or Redis Cloud endpoint (production)
  - `port`: 6379 (default Redis port)
- **Obtained From:** 
  - Local: Install Redis locally or via Docker
  - Cloud: Redis Cloud (https://redis.com/cloud/) or AWS ElastiCache
- **Usage:**
  - Task queue for distributed job processing
  - Caching layer for frequently accessed data
  - Session store for circuit breaker state (if `AXON_BREAKER_BACKEND=redis`)
- **When Needed:** Only if `AXON_QUEUE_BACKEND=redis` or `AXON_BREAKER_BACKEND=redis`

### `AXON_REDIS_QUEUE_NAME`
- **Value:** `axon:tasks`
- **Purpose:** Namespace/key prefix for task queues in Redis
- **Type:** String
- **Usage:** Isolates AXON tasks from other applications using same Redis instance
- **Format:** `axon:` prefix for namespace cleanliness
- **Benefit:** Prevents key collisions if Redis is shared infrastructure

### `AXON_BREAKER_BACKEND`
- **Value:** `memory` | `redis`
- **Purpose:** Backend for circuit breaker state management
- **Type:** String enum
- **Current:** `memory` (single-process)
- **Options:**
  - `memory`: In-memory state (per-process, no sync across servers)
    - Good for: Single-server deployment
    - Bad for: Distributed systems (each server has own state)
  - `redis`: Distributed circuit breaker state (synchronized)
    - Good for: Multi-server deployment, consistent failure handling
    - Bad for: Adds Redis dependency
- **Usage:**
  - Tracks failing services (API failures, timeouts)
  - Opens/closes circuit when threshold exceeded
  - Prevents cascading failures
- **Example Flow:**
  - Service fails 5 times → Circuit opens
  - Circuit open → All requests fail fast (no retry)
  - After cooldown → Circuit half-open
  - Success → Circuit closes

---

## Quick Reference Table

| Section | Key Variables | Purpose |
|---------|---------------|---------|
| **Core** | APP_NAME, ENV, TEST_MODE | Application identity & mode |
| **AI Providers** | GEMINI_API_KEY | LLM service credentials (primary) |
| **Database** | DATABASE_URL, EMBEDDING_MODEL | Data persistence & embeddings |
| **Vector DB** | QDRANT_URL, QDRANT_API_KEY, VECTOR_DB_PROVIDER | Semantic search & memory |
| **API** | CORS_ORIGINS, RATE_LIMIT_PER_MIN | Security & access control |
| **Auth** | AXON_API_KEY | Optional endpoint protection (leave empty for prod) |
| **Runtime** | AXON_MODE, LOG_LEVEL, LOG_JSON | Behavior & observability |
| **Concurrency** | AXON_WORKER_COUNT, AXON_QUEUE_BACKEND | Parallel processing |
| **Infrastructure** | AXON_REDIS_URL, AXON_BREAKER_BACKEND | Distributed systems |

---

## Security Best Practices

✅ **DO:**
- [ ] Rotate API keys regularly
- [ ] Use environment-specific keys (dev keys ≠ prod keys)
- [ ] Store secrets in `.env` (never commit to git)
- [ ] Use HTTPS for all remote connections
- [ ] Enable rate limiting on public endpoints
- [ ] Set `AXON_DEBUG_PIPELINE=false` in production
- [ ] Use strong database passwords
- [ ] Enable SQL authentication encryption

❌ **DO NOT:**
- [ ] Commit `.env` to version control
- [ ] Use default credentials in production
- [ ] Set `CORS_ORIGINS = "*"` in production
- [ ] Log sensitive data with `LOG_JSON=true` + `LOG_LEVEL=DEBUG`
- [ ] Use `TEST_MODE=true` in production
- [ ] Share API keys in chat, email, or tickets
- [ ] Use `gemini-2.5-flash` without API key restrictions

---

## Environment Setup Checklist

### Development Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Populate `GEMINI_API_KEY` from Google AI Studio
- [ ] Set `ENV=development`
- [ ] Set `TEST_MODE=true` if running tests
- [ ] Ensure PostgreSQL runs on localhost:5432
- [ ] Create Qdrant account (free tier available: https://cloud.qdrant.io/)
- [ ] Add Qdrant credentials (`QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_COLLECTION`) to `.env`

### Production Deployment
- [ ] Use `.env.production` with prod-only secrets
- [ ] Set `ENV=production`
- [ ] Set `TEST_MODE=false`
- [ ] Set `AXON_DEBUG_PIPELINE=false`
- [ ] Set `LOG_JSON=true`
- [ ] Set `LOG_LEVEL=INFO` or `WARN`
- [ ] Use managed PostgreSQL (AWS RDS, Cloud SQL, etc.)
- [ ] Use managed Redis (Redis Cloud, ElastiCache, etc.)
- [ ] Set `AXON_QUEUE_BACKEND=redis`
- [ ] Set `AXON_BREAKER_BACKEND=redis`
- [ ] Enable Qdrant Cloud with backups
- [ ] Rotate all API keys

---

## Troubleshooting Guide

| Issue | Check These Variables |
|-------|----------------------|
| "API key invalid" | `GEMINI_API_KEY` |
| "Cannot connect to database" | `DATABASE_URL`, PostgreSQL service running |
| "CORS blocked from frontend" | `CORS_ORIGINS`, frontend URL matches exactly |
| "Timeout errors" | `SKILL_EXECUTION_TIMEOUT`, `AXON_AGENT_TIMEOUT` |
| "Redis connection refused" | `AXON_REDIS_URL`, Redis service running |
| "Circuit breaker stuck open" | `AXON_BREAKER_BACKEND`, check for service failures |
| "Cannot find embeddings" | `VECTOR_DB_PROVIDER`, `QDRANT_URL`, `QDRANT_API_KEY` |

---

## Related Documentation

- [Backend Architecture](ARCHITECTURE_CHANGES.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Database Setup](../backend/alembic.ini)
- [API Routes](../backend/src/api/)

---

**Generated:** 2026-03-18  
**Version:** 1.0  
**Status:** Complete

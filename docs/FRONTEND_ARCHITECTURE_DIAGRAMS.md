# Frontend-Backend Integration Architecture

## Current vs Desired State

### CURRENT ARCHITECTURE (Incomplete)

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vanilla JS)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐     ┌──────────────┐                          │
│  │  index.html  │────▶│  DOM Layout  │                          │
│  └──────────────┘     └──────────────┘                          │
│         │                     │                                  │
│         └─────┬─────┬─────────┘                                  │
│               │     │                                             │
│         ┌─────▼─┐ ┌──▼─────┐                                     │
│         │app.js │ │axon.js │  (UI Logic, Synthetic Data)        │
│         └─────┬─┘ └──┬─────┘                                     │
│               │      │                                            │
│         ┌─────▼──┴───▼──┐                                         │
│         │  api.js ✓     │  (API Client - Complete!)             │
│         ├───────────────┤                                         │
│         │✓ getHealth    │                                         │
│         │✓ getTasks     │                                         │
│         │✓ getSkills    │                                         │
│         │✓ getEvolution │                                         │
│         │✓ getSystem    │                                         │
│         └────────┬──────┘                                         │
│                  │                                                │
│         ┌────────▼────────┐                                       │
│         │ websocket.js ⚠️  │  (Connected, No Handlers)           │
│         └────────┬────────┘                                       │
│                  │                                                │
└──────────────────┼────────────────────────────────────────────────┘
                   │
                   │ HTTP + WS
                   │
        ┌──────────▼──────────┐
        │  NGINX PROXY        │ (/api/* → backend:8000/)
        │  (/ws/* → backend:  │ 
        └──────────┬──────────┘
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  GET  /health                        ✓ Used by frontend        │
│  POST /tasks/                        ⚠️ API exists, UI missing  │
│  GET  /tasks/                        ⚠️ API exists, UI missing  │
│  GET  /tasks/{id}                    ⚠️ API exists, UI missing  │
│  GET  /tasks/{id}/timeline           ⚠️ API exists, UI missing  │
│  GET  /evolution/                    ❌ NOT used              │
│  POST /evolution/run                 ❌ NOT used              │
│  GET  /skills/                       ❌ NOT used              │
│  GET  /system/                       ❌ NOT used              │
│  GET  /system/pipeline               ❌ NOT used              │
│  GET  /system/metrics                ❌ NOT used              │
│  WS   /ws/events                     ⚠️ Partial handlers       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### DESIRED ARCHITECTURE (After Integration)

```
┌──────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Vanilla JS + Components)            │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              DASHBOARD LAYOUT                               │ │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │ Sidebar  │  │ Main Content │  │  Right Panel         │ │ │
│  │  │ · Tasks  │  │  [TAB VIEW]  │  │  · Task Timeline    │ │ │
│  │  │ · Chat   │  ├──────────────┤  │  · Evolution Graph  │ │ │
│  │  │ · Skills │  │ Active Tab:  │  │  · System Status    │ │ │
│  │  │ · System │  │             │  │                      │ │ │
│  │  │          │  │ ┌─────────────┐ │                      │ │ │
│  │  │          │  │ │Tasks View   │ │                      │ │ │
│  │  │          │  │ │ ┌─────────┐ │ │                      │ │ │
│  │  │          │  │ │ │Task List│ │ │                      │ │ │
│  │  │          │  │ │ │         │ │ │                      │ │ │
│  │  │          │  │ │ └─────────┘ │ │                      │ │ │
│  │  │          │  │ └─────────────┘ │                      │ │ │
│  │  │          │  │                 │                      │ │ │
│  │  │          │  │ ┌─────────────┐ │                      │ │ │
│  │  │          │  │ │Evolution    │ │                      │ │ │
│  │  │          │  │ │ Status      │ │                      │ │ │
│  │  │          │  │ │ [Trigger]   │ │                      │ │ │
│  │  │          │  │ └─────────────┘ │                      │ │ │
│  │  │          │  │                 │                      │ │ │
│  │  │          │  │ ┌─────────────┐ │                      │ │ │
│  │  │          │  │ │Skills List  │ │                      │ │ │
│  │  │          │  │ │ [Searchable]│ │                      │ │ │
│  │  │          │  │ └─────────────┘ │                      │ │ │
│  │  │          │  │                 │                      │ │ │
│  │  │          │  │ ┌─────────────┐ │                      │ │ │
│  │  │          │  │ │System Metrics│ │                      │ │ │
│  │  │          │  │ │ [Live Data] │ │                      │ │ │
│  │  │          │  │ └─────────────┘ │                      │ │ │
│  │  │          │  │                 │                      │ │ │
│  │  └──────────┘  └─────────────────┘                      │ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           STATE MANAGEMENT (state.js)                    │ │
│  │ ┌─────────────────────────────────────────────────────┐  │ │
│  │ │ Centralized app state with selectors & updaters   │  │ │
│  │ └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │          COMPONENTS (Organized by Feature)             │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ components/                                              │  │
│  │  ├── api-key-manager.js      ✓ Manages auth             │  │
│  │  ├── task-list.js            ✓ Task table + detail      │  │
│  │  ├── task-detail.js          ✓ Modal with timeline      │  │
│  │  ├── evolution-control.js    ✓ Status + trigger button  │  │
│  │  ├── skills-catalog.js       ✓ Searchable list          │  │
│  │  ├── system-status.js        ✓ Live metrics              │  │
│  │  ├── pipeline-graph.js       ✓ DAG visualization        │  │
│  │  ├── notifications.js        ✓ Toast/alerts             │  │
│  │  └── real-time-updates.js    ✓ WebSocket handlers       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              API CLIENT (Enhanced api.js)              │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ ✓ All REST endpoints                                     │  │
│  │ ✓ Auto-retry with exponential backoff                   │  │
│  │ ✓ Request/Response caching                              │  │
│  │ ✓ Error normalization                                   │  │
│  │ ✓ API key management                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        WEBSOCKET CLIENT (Enhanced websocket.js)        │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ ✓ Reliable connection                                   │  │
│  │ ✓ Automatic reconnection                                │  │
│  │ ✓ Event routing to components                           │  │
│  │ ✓ Event type handlers                                   │  │
│  │   - task.* events → task list updates                  │  │
│  │   - evolution.* events → evolution panel updates        │  │
│  │   - skill.* events → skills catalog updates             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (REST)
                              │ WS (WebSocket)
                              │
                    ┌─────────▼─────────┐
                    │  NGINX PROXY      │
                    │  (/api/*, /ws/*)  │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                  BACKEND (FastAPI)                                 │
├──────────────────────────────────────────────────────────────────--┤
│                                                                     │
│  REST ENDPOINTS:                       WEBSOCKET:                 │
│  ✓ GET  /health                        ✓ WS /ws/events           │
│  ✓ POST /tasks/                        │ ├─ task.created         │
│  ✓ GET  /tasks/                        │ ├─ task.updated         │
│  ✓ GET  /tasks/{id}                    │ ├─ task.completed       │
│  ✓ GET  /tasks/{id}/timeline           │ ├─ evolution.started    │
│  ✓ GET  /evolution/                    │ ├─ evolution.completed  │
│  ✓ POST /evolution/run                 │ └─ skill.created        │
│  ✓ GET  /skills/                       │                         │
│  ✓ GET  /system/                       │ EVENT BUS (Internal)    │
│  ✓ GET  /system/pipeline               ├─ Task events           │
│  ✓ GET  /system/metrics                ├─ Evolution events      │
│                                         ├─ Skill events          │
│                                         └─ System events         │
│                                                                    │
│  DATABASE                                                          │
│  ├─ Tasks table                                                   │
│  ├─ Tasks timeline/metrics                                        │
│  └─ Skills registry                                               │
│                                                                    │
│  SERVICES                                                          │
│  ├─ Agent pipeline (4-stage)                                      │
│  │ ├─ Planning                                                    │
│  │ ├─ Research                                                    │
│  │ ├─ Reasoning                                                   │
│  │ └─ Builder                                                     │
│  ├─ Evolution engine                                              │
│  ├─ Skills registry                                               │
│  └─ Circuit breaker                                               │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Task Submission & Monitoring Flow

```
USER BROWSING                    FRONTEND              BACKEND
┌──────────────┐
│ Types task  │
│ description │
└──────┬───────┘
       │
       │ Click "Submit"
       │
       │                ┌──────────────────────┐
       │────POST /tasks/│  api.js/createTask()│
       │                └─────────┬────────────┘
       │                          │
       │                          │ POST {title, desc}
       │                          │──────────────────▶
       │                          │
       │                          │
       │                          │           ┌─────────────────┐
       │                          │           │ Add to database │
       │                          │           └────────┬────────┘
       │                          │                    │
       │                          │           ┌────────▼────────┐
       │                          │           │ Start pipeline  │
       │                          │           │ (4-stage agent) │
       │                          │           └────────┬────────┘
       │                          │                    │
       │                          │◀──201 + task data──┤
       │                          │                    │
       │◀─────201 + task data─────┤                    │
       │                          │         ┌──────────▼────┐
       │ Show success +ID         │         │ Emit event    │
       │                          │         │task.created   │
       │ Start listening          │         └────────┬──────┘
       │ (via WebSocket)          │                  │
       │                          │                  │
       │               ┌──────────▼─────────┐        │
       │               │ WS /ws/events      │        │
       │◀──────────────┤ {"event":         │        │
       │ Real-time     │   "task.created",  │        │
       │ updates:      │  "data": {...}}    │◀───────┤
       │ - Progress    │                    │        │
       │ - Stage times │                    │        │
       │ - Log output  └────────────────────┘        │
       │                                             │
       │                    [Pipeline runs...]       │
       │                    [Emits updates every     │
       │                     stage transition]       │
       │                                             │
       │               ┌──────────────────┐          │
       │               │ WS task.completed│          │
       │◀──────────────┤ {result: "..."}  │◀─────────┤
       │ Show result   └──────────────────┘          │
       │            ┌────────────────────┐
       │            │ GET /tasks/{id} to │
       │            │ fetch final state  │
       └────────────┤ and full result    │
                    └────────────────────┘
```

### 2. Real-Time WebSocket Event Flow

```
BACKEND EVENTS          WEBSOCKET              FRONTEND COMPONENTS
(EventBus)              (WebSocket Server)     (Event Handlers)

┌─────────────────────┐
│ Task events:        │
│- pending            │  JSON stream to WS    ┌──────────────────┐
│- running            │◀─────────────────────▶│  task-list.js    │
│- completed          │    {event: "task.*"} │ Updates list     │
│- failed             │                       └──────────────────┘
└─────────────────────┘
                      │
┌─────────────────────┐
│ Evolution events:   │
│- started            │  JSON stream to WS    ┌──────────────────┐
│- progress           │◀─────────────────────▶│evolution-control │
│- completed          │  {event: "evolution.*│ Updates status   │
│- failed             │                       └──────────────────┘
└─────────────────────┘
                      │
┌─────────────────────┐
│ Skill events:       │
│- created            │  JSON stream to WS    ┌──────────────────┐
│- registered         │◀─────────────────────▶│skills-catalog.js │
│- error              │  {event: "skill.*"}  │ Adds to list     │
└─────────────────────┘                       └──────────────────┘
                      │
                      │ Central event router
                      │ (real-time-updates.js)
                      │
                      └ Broadcasts to all registered listeners

HANDLERS IN EACH COMPONENT:
- Parse event type
- Extract data
- Update local state
- Re-render affected UI
- Set loading states
- Handle errors gracefully
```

### 3. Evolution Cycle with Real-Time Updates

```
USER ACTION                 FRONTEND            BACKEND          WEBSOCKET
┌──────────────────┐
│ Click:           │
│ "Trigger         │
│  Evolution"      │
└────────┬─────────┘
         │
         │ Confirm
         │         ┌──────────────────────┐
         │─POST────▶│evolution/run (POST) │
         │         └──────────┬───────────┘
         │                    │
         │                    │    ┌──────────────────┐
         │                    └───▶│Set status:       │
         │                         │"running"         │
         │                         │                  │
         │                         │Emit WS event     │
         │                         │"evolution.start" │
         │                         └─────────┬────────┘
         │                                   │
         │                 ┌─────────────────▼─────┐
         │                 │  ["planning",          │
         │                 │   "research",          │
         │                 │   "reasoning",         │
         │                 │   "builder"]           │
         │                 │                       │
         │                 │  Each stage:           │
         │                 │  1. Run tasks          │
         │                 │  2. Emit "task.*"      │
         │                 │  3. Track failures     │
         │                 │  4. Generate metrics   │
         │                 └──────────┬─────────────┘
         │                            │
         │                    ┌───────▼────────┐
         │                    │ Generate skills│
         │                    │ Emit "skill.*" │
         │                    └─────────┬──────┘
         │                              │
         │◀─────WS evolution.started────┤
         │ Turn on progress bar         │
         │ Disable trigger button       │
         │                              │
         │◀─────WS task.* events────────┤
         │ Update task count            │ [Pipeline running...]
         │                              │
         │◀─────WS skill.* events───────┤
         │ Increment skill counter      │
         │                              │
         │◀─────WS evolution.completed──┤
         │ Show final stats             │
         │ Enable trigger button        │
         │ Update last_run timestamp    │
         │                              │
         │                    ┌─────────▼────────┐
         │                    │Update status:    │
         │                    │"completed"       │
         │                    │               │ │
         │                    │Results:         │ │
         │                    │- skills_gen: 5  │ │
         │                    │- failed_tasks: 0│ │
         │                    │- duration: 45s  │ │
         │                    └──────────────────┘
```

---

## Component Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                      APP ENTRY POINT                        │
│                      (index.html)                            │
└────────────┬────────────────────────────────────────────────┘
             │
      ┌──────▼──────┐
      │  app.js     │  Bootstrap, initialize components
      │ (Enhanced)  │
      └──────┬──────┘
             │
      ┌──────▼────────────────────────────────────────┐
      │          STATE MANAGEMENT (state.js)          │
      │  ┌─────────────────────────────────────────┐  │
      │  │ - Current API key                       │  │
      │  │ - Task list cache                       │  │
      │  │ - Evolution status                      │  │
      │  │ - Skills cache                          │  │
      │  │ - System metrics                        │  │
      │  └─────────────────────────────────────────┘  │
      └──────┬────────────────────────────────────────┘
             │
      ┌──────▴──────────────────────────────────────────────┐
      │                                                     │
   ┌──▼──────┐  ┌────────────┐  ┌──────────────┐         
   │ api.js  │  │websocket.js│  │ auth.js      │
   │ (REST)  │  │ (Real-time)│  │ (API Key)    │
   └──┬──────┘  └────────────┘  └──────────────┘
      │              │
      ├──────┬───────┴─────┬──────────────┬─────────┐
      │      │             │              │         │
   ┌──▼───┐ ◀─┼─────────────┼──────────────┼─────────┼──┐ Subscribes
   │      │ │ │ WS events   │              │         │  │ to events
   │      │ │ │ routed to   │              │         │  │
   │      │◀┴─┴──────────────┴──────────────┴─────────┴──┘
   │      │  Event type router
   │      │  (real-time-updates.js)
   │      │
      │
      └─── Dispatches to Components:
           │
           ├─► ┌──────────────────┐  task.* events
           │   │  task-list.js    │◀─ task.*
           │   │                  │   Updates task table
           │   └──────────────────┘
           │
           ├─► ┌──────────────────┐  task detail modal
           │   │ task-detail.js   │◀─ task.*
           │   │                  │   Shows timeline
           │   └──────────────────┘
           │
           ├─► ┌──────────────────┐  evolution.* events
           │   │evolution-control │◀─ evolution.*
           │   │                  │   Updates status
           │   └──────────────────┘
           │
           ├─► ┌──────────────────┐  skill.* events
           │   │ skills-catalog   │◀─ skill.*
           │   │                  │   Updates list
           │   └──────────────────┘
           │
           ├─► ┌──────────────────┐  system.* events
           │   │ system-status    │◀─ system.*
           │   │                  │   Updates metrics
           │   └──────────────────┘
           │
           └─► ┌──────────────────┐  notifications
               │notifications    │
               │                  │   Toast alerts
               └──────────────────┘
```

---

## Integration Priority Matrix

```
                    HIGH IMPACT
                         │
        HIGH      ···┌────┼────┐···
        EFFORT    ··┌┴────┼────┴┐··
                  ┌─┤     │     ├─┐
              ┌──┤System │Task  ├──┐
              │ ││Metrics│List  │  │     Evolution │
              │ ├│Graph  │Timeline  ├─┤  Trigger   │
        MEDIUM│ ││       │Modal ├──┤  │            │
        EFFORT│ ├┴───────┼──────┤  │  ├─────────┤
              │ │         │      │  ├──┤Skills   │
              │ │   API   │Real- ├──┤  │Catalog  │
              │ │  Keys   │time  │  │  ├─────────┤
              │ │         │Chat  ├──┤  │
              └─└─────────┴──────┘  │  │
                └──┐           ┌────┘  │
                   │           │       │
                LOW            ├───────┘
                IMPACT         │
                           Notifications
                           Profile UI

QUADRANT ANALYSIS:

HIGH PRIORITY (DO FIRST):
├─ Task List Component (high impact, medium effort)
├─ API Key Manager (high impact, low effort)
└─ Evolution Trigger (high impact, medium effort)

MEDIUM PRIORITY (DO SECOND):
├─ System Metrics Display (medium impact, medium effort)
├─ Skills Catalog (medium impact, medium effort)
├─ Real-time Updates (medium impact, high effort)
└─ Pipeline Visualization (medium impact, high effort)

LOW PRIORITY (NICE TO HAVE):
├─ Notifications System (low impact, low effort)
├─ Profile Management (requires backend)
└─ Chat Integration (requires backend work)
```

---

## Current Implementation Gaps Analysis

### Missing in Frontend

| Category | Missing | Impact | Effort |
|----------|---------|--------|--------|
| **UI Components** | | | |
| · Task table/list | Complete rendering | High | 2hrs |
| · Task detail modal | Fetch + display | High | 2hrs |
| · Evolution status widget | Real-time updates | High | 1.5hrs |
| · Evolution trigger button | Form + events | High | 1hr |
| · Skills table | Search + filtering | Medium | 2hrs |
| · System status indicators | Live data | Medium | 1.5hrs |
| · Pipeline DAG | Graph visualization | Medium | 3hrs |
| **State Management** | | | |
| · Centralized state | Replace scattered vars | Medium | 2hrs |
| · State selectors | Query functions | Low | 1hr |
| · State mutations | Update functions | Low | 1hr |
| **Event Handling** | | | |
| · Event router | Dispatch to components | Medium | 1.5hrs |
| · Task event handlers | Update list/detail | Medium | 1.5hrs |
| · Evolution handlers | Update status | Low | 1hr |
| · Skill handlers | Update catalog | Low | 1hr |
| **API Integration** | | | |
| · Auth/API key storage | localStorage | Low | 0.5hrs |
| · Error handling | Retry + user feedback | Medium | 2hrs |
| · Request caching | Avoid duplicate calls | Low | 1hr |
| **UX** | | | |
| · Loading states | Spinners/skeletons | Low | 1.5hrs |
| · Error states | User feedback | Medium | 1.5hrs |
| · Empty states | Helpful messages | Low | 1hr |
| · Notifications | Toast alerts | Low | 1.5hrs |

**Total Estimated Effort:** ~32 hours

**Recommended Timeline:**
- Phase 1 (Core): 1 week (Task list + API keys + event handling)
- Phase 2 (Features): 1 week (Evolution + Skills + System)
- Phase 3 (Polish): 3-4 days (UX, errors, notifications)

---

## Quick Reference: What's Needed Where

```javascript
// WHERE TO ADD EACH COMPONENT
window.AXON = {
  // State management (new)
  state: {},
  getState(path) { ... },
  updateState(path, value) { ... },
  
  // Initialized components (to create)
  components: {
    apiKeyManager: null,      // ← NEW
    taskList: null,            // ← NEW
    taskDetail: null,          // ← NEW
    evolutionControl: null,    // ← NEW
    skillsCatalog: null,       // ← NEW
    systemStatus: null,        // ← NEW
    pipelineGraph: null,       // ← NEW
    realTimeUpdates: null,     // ← NEW
  },
  
  // Enhanced helpers
  api: {
    // Existing functions (use as-is)
    getHealth() { ... },
    createTask(title, desc) { ... },
    // ... etc, already work
  },
  
  ws: {
    socket: null,
    // Set up listener in real-time-updates.js
    on(eventType, handler) { ... },
    off(eventType, handler) { ... },
  },
};

// INITIALIZATION SEQUENCE (in app.js)
async function initialize() {
  // 1. Load API key from storage
  const key = localStorage.getItem('axon.apiKey');
  if (key) window.AXON_API_KEY = key;
  
  // 2. Init state management
  window.AXON.state = initializeState();
  
  // 3. Init components
  window.AXON.components.apiKeyManager = new APIKeyManager();
  window.AXON.components.taskList = new TaskList('task-list-container');
  window.AXON.components.evolutionControl = new EvolutionControl('evolution-container');
  // ... etc
  
  // 4. Init WebSocket
  window.AXON.ws.socket = createEventSocket();
  window.AXON.components.realTimeUpdates = new RealTimeUpdates();
  
  // 5. Health check
  try {
    const health = await getHealth();
    console.log('Backend connected:', health);
  } catch (err) {
    console.warn('Backend unreachable:', err);
  }
}

initialize();
```

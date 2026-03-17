# Frontend Integration - Quick Start Guide

## 1. API Key Management (HIGH PRIORITY)

### Current Problem
- API key hardcoded or missing
- No UI to input/store key
- No validation

### Solution: Add Settings Panel Integration

**File:** `/frontend/js/components/api-key-manager.js`

```javascript
class APIKeyManager {
  constructor() {
    this.storageKey = 'axon.apiKey';
    this.init();
  }

  init() {
    const settingsBody = document.querySelector('.settings-modal-body');
    const keySection = document.createElement('div');
    keySection.innerHTML = `
      <div class="settings-section-title">API Configuration</div>
      <label class="settings-field" for="api-key-input">
        <span>API Key</span>
        <input id="api-key-input" type="password" placeholder="Enter your API key">
      </label>
      <div class="settings-actions">
        <button id="api-key-save-btn" class="primary-btn" type="button">Save Key</button>
        <button id="api-key-test-btn" class="secondary-btn" type="button">Test Connection</button>
      </div>
      <div id="api-key-status" class="status-message"></div>
    `;
    settingsBody.insertBefore(keySection, settingsBody.firstChild);
    this.attachListeners();
  }

  attachListeners() {
    document.getElementById('api-key-save-btn').addEventListener('click', 
      () => this.saveKey());
    document.getElementById('api-key-test-btn').addEventListener('click', 
      () => this.testConnection());
  }

  saveKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) {
      this.showStatus('API key cannot be empty', 'error');
      return;
    }
    
    localStorage.setItem(this.storageKey, key);
    window.AXON_API_KEY = key;
    this.showStatus('API key saved successfully', 'success');
  }

  async testConnection() {
    try {
      const health = await getHealth();
      this.showStatus(`Connected: ${health.status}`, 'success');
    } catch (err) {
      this.showStatus(`Connection failed: ${err.message}`, 'error');
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById('api-key-status');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
  }

  loadKey() {
    const key = localStorage.getItem(this.storageKey);
    if (key) {
      window.AXON_API_KEY = key;
      document.getElementById('api-key-input').value = key;
    }
  }
}

// Initialize on page load
const apiKeyMgr = new APIKeyManager();
apiKeyMgr.loadKey();
```

---

## 2. Task List Component (HIGH PRIORITY)

### Current Problem
- No UI to display tasks
- API functions exist but unused
- No real-time updates

### Solution: Task List Component

**File:** `/frontend/js/components/task-list.js`

```javascript
class TaskList {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.tasks = [];
    this.selectedTaskId = null;
    this.websocket = null;
    this.init();
  }

  async init() {
    await this.loadTasks();
    this.renderTasks();
    this.setupWebSocket();
  }

  async loadTasks() {
    try {
      const response = await getTasks();
      this.tasks = response.items || [];
    } catch (err) {
      console.error('Failed to load tasks:', err);
      this.tasks = [];
    }
  }

  renderTasks() {
    this.container.innerHTML = '';
    
    if (this.tasks.length === 0) {
      this.container.innerHTML = '<p class="placeholder">No tasks yet. Submit one to get started.</p>';
      return;
    }

    const table = document.createElement('table');
    table.className = 'tasks-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Status</th>
          <th>Created</th>
          <th>Duration</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${this.tasks.map(task => this.renderTaskRow(task)).join('')}
      </tbody>
    `;
    
    this.container.appendChild(table);
    this.attachRowListeners();
  }

  renderTaskRow(task) {
    const createdTime = new Date(task.created_at).toLocaleString();
    const statusClass = `status-${task.status}`;
    
    return `
      <tr class="task-row" data-task-id="${task.id}">
        <td><code>${task.id.substring(0, 8)}</code></td>
        <td>${task.title}</td>
        <td><span class="badge ${statusClass}">${task.status}</span></td>
        <td>${createdTime}</td>
        <td><small>${this.getDuration(task)}</small></td>
        <td>
          <button class="task-detail-btn" data-task-id="${task.id}">View</button>
        </td>
      </tr>
    `;
  }

  getDuration(task) {
    if (!task.updated_at || !task.created_at) return '--';
    const ms = new Date(task.updated_at) - new Date(task.created_at);
    return `${(ms / 1000).toFixed(1)}s`;
  }

  attachRowListeners() {
    document.querySelectorAll('.task-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const taskId = e.target.dataset.taskId;
        this.showTaskDetail(taskId);
      });
    });
  }

  async showTaskDetail(taskId) {
    try {
      const task = await getTask(taskId);
      const timeline = await getTaskTimeline(taskId);
      
      const modal = this.createDetailModal(task, timeline);
      document.body.appendChild(modal);
      
      modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
      });
    } catch (err) {
      alert(`Failed to load task details: ${err.message}`);
    }
  }

  createDetailModal(task, timeline) {
    const modal = document.createElement('div');
    modal.className = 'modal task-detail-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${task.title}</h2>
          <button class="modal-close" type="button">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-field">
            <label>Task ID</label>
            <code>${task.id}</code>
          </div>
          <div class="detail-field">
            <label>Status</label>
            <span class="badge status-${task.status}">${task.status}</span>
          </div>
          <div class="detail-field">
            <label>Description</label>
            <p>${task.description || 'No description'}</p>
          </div>
          ${task.result ? `
            <div class="detail-field">
              <label>Result</label>
              <pre><code>${task.result}</code></pre>
            </div>
          ` : ''}
          
          <div class="timeline-section">
            <h3>Execution Timeline</h3>
            <div class="timeline">
              ${timeline.stages.map(stage => `
                <div class="timeline-item">
                  <div class="stage-name">${stage.name}</div>
                  <div class="stage-time">
                    ${stage.duration_ms > 0 ? `${stage.duration_ms}ms` : 'pending'}
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="timeline-total">
              Total: ${timeline.total_duration_ms}ms
            </div>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  setupWebSocket() {
    this.websocket = createEventSocket(
      (data) => this.handleWebSocketEvent(data),
      (err) => console.error('WebSocket error:', err)
    );
  }

  handleWebSocketEvent(data) {
    if (data.event === 'task.created') {
      this.tasks.push(data.data);
      this.renderTasks();
    } else if (data.event === 'task.updated') {
      const idx = this.tasks.findIndex(t => t.id === data.data.id);
      if (idx >= 0) {
        this.tasks[idx] = data.data;
        this.renderTasks();
      }
    } else if (data.event === 'task.completed') {
      const idx = this.tasks.findIndex(t => t.id === data.data.id);
      if (idx >= 0) {
        this.tasks[idx] = data.data;
        this.renderTasks();
      }
    }
  }

  // Add new task
  addTask(title, description = '') {
    this.loadTasks().then(() => this.renderTasks());
  }
}

// Initialize
const taskList = new TaskList('task-list-container');
```

---

## 3. Evolution Control Panel (HIGH PRIORITY)

### Current Problem
- No UI to trigger or monitor evolution
- Evolution API completely unused

### Solution: Evolution Component

**File:** `/frontend/js/components/evolution-control.js`

```javascript
class EvolutionControl {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentStatus = null;
    this.updateInterval = null;
    this.init();
  }

  async init() {
    this.render();
    await this.updateStatus();
    this.setupWebSocket();
    // Update status every 5 seconds
    this.updateInterval = setInterval(() => this.updateStatus(), 5000);
  }

  render() {
    this.container.innerHTML = `
      <div class="evolution-panel">
        <h2>Self-Evolution</h2>
        
        <div class="evolution-status">
          <div class="status-indicator">
            <span id="evolution-status-badge" class="badge badge-idle">idle</span>
          </div>
          <div class="status-stats">
            <div class="stat-item">
              <span class="stat-label">Generated Skills</span>
              <span id="evolution-skills-count" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Failed Tasks</span>
              <span id="evolution-failed-count" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Last Run</span>
              <span id="evolution-last-run" class="stat-value">Never</span>
            </div>
          </div>
        </div>

        <div class="evolution-progress" id="evolution-progress" style="display: none;">
          <div class="progress-bar">
            <div id="evolution-progress-fill" class="progress-fill"></div>
          </div>
          <p id="evolution-progress-text">Evolution in progress...</p>
        </div>

        <div class="evolution-controls">
          <button 
            id="evolution-trigger-btn" 
            class="primary-btn" 
            type="button"
          >
            Trigger Evolution Cycle
          </button>
        </div>

        <div id="evolution-message" class="message"></div>
      </div>
    `;
    
    this.attachListeners();
  }

  attachListeners() {
    document.getElementById('evolution-trigger-btn').addEventListener('click', 
      () => this.trigger());
  }

  async updateStatus() {
    try {
      const status = await getEvolutionStatus();
      this.currentStatus = status;
      this.renderStatus(status);
    } catch (err) {
      console.error('Failed to fetch evolution status:', err);
    }
  }

  renderStatus(status) {
    document.getElementById('evolution-status-badge').textContent = status.status;
    document.getElementById('evolution-status-badge').className = 
      `badge badge-${status.status}`;
    document.getElementById('evolution-skills-count').textContent = 
      status.generated_skills || 0;
    document.getElementById('evolution-failed-count').textContent = 
      status.failed_tasks || 0;
    
    if (status.last_run) {
      const date = new Date(status.last_run);
      document.getElementById('evolution-last-run').textContent = 
        date.toLocaleString();
    }

    const progressEl = document.getElementById('evolution-progress');
    if (status.status === 'running') {
      progressEl.style.display = 'block';
      document.getElementById('evolution-trigger-btn').disabled = true;
    } else {
      progressEl.style.display = 'none';
      document.getElementById('evolution-trigger-btn').disabled = false;
    }
  }

  async trigger() {
    const btn = document.getElementById('evolution-trigger-btn');
    const msgEl = document.getElementById('evolution-message');
    
    if (!confirm('Start a new evolution cycle? This may take several minutes.')) {
      return;
    }

    btn.disabled = true;
    msgEl.textContent = 'Starting evolution...';
    msgEl.className = 'message info';

    try {
      const result = await triggerEvolution();
      msgEl.textContent = 'Evolution cycle started';
      msgEl.className = 'message success';
      await this.updateStatus();
    } catch (err) {
      msgEl.textContent = `Error: ${err.message}`;
      msgEl.className = 'message error';
      btn.disabled = false;
    }
  }

  setupWebSocket() {
    createEventSocket((data) => {
      if (data.event === 'evolution.started') {
        this.updateStatus();
      } else if (data.event === 'evolution.completed') {
        this.updateStatus();
        document.getElementById('evolution-message').textContent = 
          'Evolution cycle completed!';
        document.getElementById('evolution-message').className = 'message success';
      }
    });
  }
}

// Initialize
const evolutionControl = new EvolutionControl('evolution-panel-id');
```

---

## 4. System Status Widget (MEDIUM PRIORITY)

### Solution: System Status Component

**File:** `/frontend/js/components/system-status.js`

```javascript
class SystemStatus {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
  }

  async init() {
    await this.load();
    this.updateInterval = setInterval(() => this.load(), 10000);
  }

  async load() {
    try {
      const status = await getSystemStatus();
      const metrics = await getSystemMetrics();
      this.render(status, metrics);
    } catch (err) {
      console.error('Failed to load system status:', err);
    }
  }

  render(status, metrics) {
    const sections = this.formatStatus(status, metrics);
    this.container.innerHTML = `
      <div class="system-status-widget">
        <h3>System Status</h3>
        <div class="status-grid">
          ${sections.map(s => `
            <div class="status-item">
              <span class="status-label">${s.label}</span>
              <span class="status-value ${s.className}">${s.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  formatStatus(status, metrics) {
    const dbClass = status.database === 'ok' ? 'ok' : 'error';
    const vsClass = status.vector_store === 'ok' ? 'ok' : 'error';
    
    return [
      { label: 'Database', value: status.database, className: dbClass },
      { label: 'Vector Store', value: status.vector_store, className: vsClass },
      { label: 'Skills Loaded', value: status.skills_loaded },
      { label: 'Agents Ready', value: status.agents_ready ? '✓' : '✗' },
      { label: 'Queue Size', value: metrics.queue_size },
      { label: 'Circuit Breaker', value: metrics.circuit_breaker },
      { label: 'Uptime', value: `${Math.floor(metrics.uptime_seconds / 60)}m` }
    ];
  }
}

const systemStatus = new SystemStatus('system-status-container');
```

---

## 5. Skills Catalog (MEDIUM PRIORITY)

### Solution: Skills Component

**File:** `/frontend/js/components/skills-catalog.js`

```javascript
class SkillsCatalog {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.skills = [];
    this.filteredSkills = [];
    this.init();
  }

  async init() {
    await this.loadSkills();
    this.render();
  }

  async loadSkills() {
    try {
      const response = await getSkills();
      this.skills = response.items || [];
      this.filteredSkills = this.skills;
    } catch (err) {
      console.error('Failed to load skills:', err);
      this.skills = [];
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="skills-catalog">
        <div class="skills-header">
          <h2>Skills Catalog</h2>
          <div class="skills-search">
            <input 
              type="text" 
              id="skills-search-input" 
              placeholder="Search skills..."
              class="search-input"
            >
          </div>
        </div>
        <div class="skills-count">
          Total: <strong>${this.filteredSkills.length}</strong>
        </div>
        <div class="skills-grid">
          ${this.filteredSkills.map(skill => this.renderSkillCard(skill)).join('')}
        </div>
      </div>
    `;
    
    this.attachListeners();
  }

  renderSkillCard(skill) {
    return `
      <div class="skill-card" data-skill-id="${skill.id}">
        <h3>${skill.name}</h3>
        <p class="skill-description">${skill.description}</p>
        <div class="skill-meta">
          <span class="skill-version">v${skill.version}</span>
          <span class="skill-created">
            ${new Date(skill.created_at).toLocaleDateString()}
          </span>
        </div>
        ${skill.parameters && Object.keys(skill.parameters).length > 0 ? `
          <div class="skill-params">
            <strong>Parameters:</strong>
            <ul>
              ${Object.entries(skill.parameters).map(([name, param]) => `
                <li><code>${name}</code> (${param.type})</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  attachListeners() {
    document.getElementById('skills-search-input').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      this.filteredSkills = this.skills.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query)
      );
      this.render();
    });
  }
}

const skillsCatalog = new SkillsCatalog('skills-catalog-container');
```

---

## CSS Additions Needed

**File:** `/frontend/css/components.css`

```css
/* Task List */
.tasks-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.tasks-table th,
.tasks-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-divider);
}

.tasks-table th {
  background-color: var(--color-panel);
  font-weight: 600;
}

.task-row:hover {
  background-color: var(--color-panel);
}

.task-detail-btn {
  padding: 0.4rem 0.8rem;
  background-color: var(--theme-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

/* Evolution Panel */
.evolution-panel {
  padding: 1.5rem;
  background-color: var(--color-panel);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.evolution-status {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin: 1.5rem 0;
}

.status-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-fg);
  opacity: 0.7;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--theme-color);
}

.evolution-progress {
  margin: 1rem 0;
}

.progress-bar {
  height: 8px;
  background-color: var(--color-divider);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 30%;
  background-color: var(--theme-color);
  animation: progress-pulse 1.5s ease-in-out infinite;
}

@keyframes progress-pulse {
  0%, 100% { width: 30%; }
  50% { width: 70%; }
}

/* Skills Grid */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.skill-card {
  padding: 1rem;
  background-color: var(--color-panel);
  border: 1px solid var(--color-divider);
  border-radius: 8px;
  transition: all 0.2s;
}

.skill-card:hover {
  border-color: var(--theme-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skill-card h3 {
  margin: 0 0 0.5rem 0;
  color: var(--theme-color);
}

.skill-description {
  font-size: 0.9rem;
  color: var(--color-fg);
  opacity: 0.8;
  margin: 0.5rem 0;
}

.skill-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 0.5rem;
}

/* Messages */
.message {
  padding: 0.75rem 1rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}
```

---

## Integration Checklist

### Phase 1: Setup (Week 1)
- [ ] Add API key manager component
- [ ] Create `components/` directory structure
- [ ] Add `state.js` for client state management
- [ ] Test API connectivity

### Phase 2: Core Dashboard (Week 2-3)
- [ ] Implement task list component
- [ ] Add task detail modal
- [ ] Setup WebSocket event handlers
- [ ] Add real-time task updates

### Phase 3: Feature Dashboards (Week 3-4)
- [ ] Implement evolution control panel
- [ ] Add skills catalog
- [ ] Add system status widget
- [ ] Add pipeline visualization

### Phase 4: Polish (Week 4)
- [ ] Add error handling & retry logic
- [ ] Implement loading states
- [ ] Add notifications/toasts
- [ ] Performance optimization

---

## Testing Commands

```bash
# Test health endpoint
curl -H "X-API-Key: $AXON_API_KEY" http://localhost:8000/health

# Test task creation
curl -X POST \
  -H "X-API-Key: $AXON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Testing"}' \
  http://localhost:8000/tasks/

# Test WebSocket
wscat -c "ws://localhost:8000/ws/events"
```

---

## References

- [API Documentation](./docs/api/README.md)
- [Previous Frontend Guide](./docs/PREVIOUS_FRONTEND.md)
- [WebSocket API](./docs/api/websocket.md)
- [Tasks API](./docs/api/tasks.md)
- [Evolution API](./docs/api/evolution.md)
- [Skills API](./docs/api/skills.md)
- [System API](./docs/api/system.md)

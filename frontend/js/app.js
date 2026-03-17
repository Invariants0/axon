/**
 * AXON Dashboard — main application logic
 */

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  status: "idle",
  currentVersion: "0.0.1",
  logs: [],
  events: [],
  capabilities: [],
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const statusBadge = document.getElementById("status-badge");
const taskInput = document.getElementById("task-input");
const submitBtn = document.getElementById("submit-task");
const taskFeedback = document.getElementById("task-feedback");
const brainLogsEl = document.getElementById("brain-logs");
const codeViewerEl = document.getElementById("code-viewer");
const evolutionEl = document.getElementById("evolution-timeline");
const capabilityEl = document.getElementById("capability-graph");

// ── Render helpers ────────────────────────────────────────────────────────────
function setStatus(status) {
  state.status = status;
  statusBadge.textContent = status;
  statusBadge.className = `badge badge-${status}`;
}

function appendLog(message) {
  state.logs.push(message);
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = message;
  // Remove placeholder if present
  const placeholder = brainLogsEl.querySelector(".placeholder");
  if (placeholder) placeholder.remove();
  brainLogsEl.appendChild(entry);
  brainLogsEl.scrollTop = brainLogsEl.scrollHeight;
}

function showCode(code) {
  codeViewerEl.querySelector("code").textContent = code;
}

function appendEvent(label, timestamp) {
  state.events.push({ label, timestamp });
  const placeholder = evolutionEl.querySelector(".placeholder");
  if (placeholder) placeholder.remove();
  const item = document.createElement("div");
  item.className = "timeline-event";
  item.innerHTML = `
    <div class="timeline-dot"></div>
    <div class="timeline-content">
      <div>${label}</div>
      <div class="ts">${timestamp}</div>
    </div>`;
  evolutionEl.appendChild(item);
}

function renderCapabilities(capabilities) {
  state.capabilities = capabilities;
  capabilityEl.innerHTML = "";
  if (!capabilities.length) {
    capabilityEl.innerHTML = '<p class="placeholder">No capabilities registered.</p>';
    return;
  }
  for (const cap of capabilities) {
    const node = document.createElement("span");
    node.className = "capability-node";
    node.textContent = cap;
    capabilityEl.appendChild(node);
  }
}

function setFeedback(message, type = "") {
  taskFeedback.textContent = message;
  taskFeedback.className = `feedback${type ? " " + type : ""}`;
}

// ── WebSocket event handler ───────────────────────────────────────────────────
function handleWsMessage(data) {
  if (data.type === "log") {
    appendLog(data.message ?? JSON.stringify(data));
  } else if (data.type === "status") {
    setStatus(data.status ?? "idle");
  } else if (data.type === "evolution") {
    appendEvent(data.label ?? "Event", data.timestamp ?? new Date().toISOString());
  } else if (data.type === "capabilities") {
    renderCapabilities(data.capabilities ?? []);
  } else if (data.type === "code") {
    showCode(data.code ?? "");
  } else {
    appendLog(JSON.stringify(data));
  }
}

// ── Task submission ───────────────────────────────────────────────────────────
submitBtn.addEventListener("click", async () => {
  const description = taskInput.value.trim();
  if (!description) {
    setFeedback("Please enter a task description.", "error");
    return;
  }

  submitBtn.disabled = true;
  setFeedback("Submitting…");
  setStatus("running");

  try {
    const result = await submitTask(description);
    taskInput.value = "";
    setFeedback(`Task submitted (id: ${result.id ?? "unknown"}).`, "success");
    appendLog(`Task submitted: ${description}`);
  } catch (err) {
    setFeedback(`Error: ${err.message}`, "error");
    setStatus("idle");
  } finally {
    submitBtn.disabled = false;
  }
});

// ── Initialise ────────────────────────────────────────────────────────────────
async function init() {
  // Health check
  try {
    const health = await getHealth();
    appendLog(`Backend status: ${health.status ?? "ok"}`);
  } catch {
    appendLog("Backend unreachable — running in offline mode.");
  }

  // Connect WebSocket (best-effort)
  try {
    createEventSocket(handleWsMessage, (err) => {
      appendLog("WebSocket error — real-time updates unavailable.");
    });
  } catch {
    appendLog("WebSocket unavailable.");
  }
}

init();

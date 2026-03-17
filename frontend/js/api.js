/**
 * REST API client
 * Routes through nginx /api/* → backend:8000/
 * Authenticated endpoints use Bearer token from auth.js
 */
const API_BASE_URL = "/api";

// Get API key from environment or use empty string (backend will return 403 if missing)
const API_KEY = typeof AXON_API_KEY !== 'undefined' ? AXON_API_KEY : '';

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  
  // Try to get auth token from auth module first
  if (typeof getAuthToken === 'function') {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      return headers;
    }
  }
  
  // Fallback to API key
  if (API_KEY) {
    headers["X-AXON-KEY"] = API_KEY;
    headers["X-API-Key"] = API_KEY;
  }
  return headers;
}

async function apiFetch(path, options = {}) {
  const mergedOptions = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };
  const response = await fetch(`${API_BASE_URL}${path}`, mergedOptions);
  
  // If unauthorized, clear auth and redirect to login
  if (response.status === 401) {
    if (typeof handleLogout === 'function') {
      await handleLogout();
    }
    throw new Error('Unauthorized. Please log in.');
  }
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

async function getHealth() {
  return apiFetch("/health");
}

// Tasks API
async function getTasks(chatId = null) {
  const query = chatId ? `?chat_id=${encodeURIComponent(chatId)}` : "";
  return apiFetch(`/tasks/${query}`);
}

async function getTask(taskId) {
  return apiFetch(`/tasks/${taskId}`);
}

async function getTaskTimeline(taskId) {
  return apiFetch(`/tasks/${taskId}/timeline`);
}

async function createTask(title, description = "", chatId = null) {
  const payload = { title, description };
  if (chatId) payload.chat_id = chatId;
  return apiFetch("/tasks/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Deprecated: use createTask instead
async function submitTask(description) {
  return createTask(description, "");
}

// Chats API
async function getChats() {
  return apiFetch("/chats/");
}

async function createChat(title = "New Chat") {
  return apiFetch("/chats/", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

async function getChat(chatId) {
  return apiFetch(`/chats/${chatId}`);
}

async function updateChat(chatId, title) {
  return apiFetch(`/chats/${chatId}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });
}

async function deleteChat(chatId) {
  return apiFetch(`/chats/${chatId}`, {
    method: "DELETE",
  });
}

// System API
async function getSystemStatus() {
  return apiFetch("/system/");
}

async function getPipelineGraph() {
  return apiFetch("/system/pipeline");
}

async function getSystemMetrics() {
  return apiFetch("/system/metrics");
}

// Evolution API
async function getEvolutionStatus() {
  return apiFetch("/evolution/");
}

async function triggerEvolution() {
  return apiFetch("/evolution/run", {
    method: "POST",
  });
}

// Skills API
async function getSkills() {
  return apiFetch("/skills/");
}

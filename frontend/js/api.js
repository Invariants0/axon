/**
 * REST API client
 * Routes through nginx /api/* → backend:8000/
 */
const API_BASE_URL = "/api";

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function getHealth() {
  return apiFetch("/health");
}

async function submitTask(description) {
  return apiFetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
}

async function getTasks() {
  return apiFetch("/tasks");
}

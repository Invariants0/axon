export function createEventSocket() {
  const base = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://127.0.0.1:8000";
  return new WebSocket(`${base}/ws/events`);
}

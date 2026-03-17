/**
 * WebSocket client
 * Routes through nginx /ws/* → backend:8000/ws/
 */
function createEventSocket(onMessage, onError) {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${location.host}/ws/events`);

  socket.addEventListener("open", () => {
    console.log("[ws] connected");
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (typeof onMessage === "function") onMessage(data);
    } catch (err) {
      console.warn("[ws] non-JSON message", event.data);
    }
  });

  socket.addEventListener("close", () => {
    console.log("[ws] disconnected");
  });

  socket.addEventListener("error", (err) => {
    console.error("[ws] error", err);
    if (typeof onError === "function") onError(err);
  });

  return socket;
}

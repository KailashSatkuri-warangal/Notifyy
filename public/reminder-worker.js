// Notifyy Background Reminder Web Worker
// Runs in background thread - not throttled by minimized tabs or device screen locks

let checkInterval = null;

self.onmessage = function (e) {
  const { type, interval } = e.data;

  if (type === "START") {
    if (checkInterval) clearInterval(checkInterval);
    const ms = interval || 1000;
    checkInterval = setInterval(() => {
      self.postMessage({ type: "TICK", timestamp: Date.now() });
    }, ms);
  } else if (type === "STOP") {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  }
};

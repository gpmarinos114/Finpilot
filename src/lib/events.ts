const EVENT_NAME = "finpilot-data-changed";

export function emitDataChanged() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function onDataChanged(callback: () => void) {
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

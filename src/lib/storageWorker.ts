/**
 * Dedicated Web Worker for offloading data storage operations (sessions, settings, etc.)
 * away from the Main Thread to prevent UI freezing.
 */

self.onmessage = (event: MessageEvent) => {
  const { id, action, key, value } = event.data;
  try {
    if (action === 'get') {
      const item = localStorage.getItem(key);
      const data = item ? JSON.parse(item) : null;
      self.postMessage({ id, success: true, data });
    } else if (action === 'set') {
      localStorage.setItem(key, JSON.stringify(value));
      self.postMessage({ id, success: true });
    } else if (action === 'remove') {
      localStorage.removeItem(key);
      self.postMessage({ id, success: true });
    } else if (action === 'getRaw') {
      const data = localStorage.getItem(key);
      self.postMessage({ id, success: true, data });
    } else if (action === 'setRaw') {
      localStorage.setItem(key, value);
      self.postMessage({ id, success: true });
    }
  } catch (err: any) {
    self.postMessage({ id, success: false, error: err?.message || String(err) });
  }
};

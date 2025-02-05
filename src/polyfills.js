// src/polyfills.js

if (typeof window.ResizeObserver !== "undefined") {
  const OriginalResizeObserver = window.ResizeObserver;
  class PatchedResizeObserver extends OriginalResizeObserver {
    constructor(callback) {
      // Wrap the original callback in a try/catch block
      const wrappedCallback = (entries, observer) => {
        try {
          callback(entries, observer);
        } catch (error) {
          if (
            error.message &&
            error.message.includes("ResizeObserver loop completed with undelivered notifications")
          ) {
            // Suppress the specific error
            return;
          }
          throw error;
        }
      };
      super(wrappedCallback);
    }
  }
  window.ResizeObserver = PatchedResizeObserver;
}

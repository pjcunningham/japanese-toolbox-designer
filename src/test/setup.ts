import '@testing-library/jest-dom/vitest';

// Polyfill ResizeObserver in jsdom if missing
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

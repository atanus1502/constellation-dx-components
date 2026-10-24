// Runs before setupFiles.ts so @pega/cosmos-react-core 9.x can load under jsdom.

// CSS Custom Highlight API: Cosmos 9 creates a shared `new Highlight()` at module load (useHighlight).
class HighlightPolyfill extends Set<unknown> {}

Object.assign(globalThis, { Highlight: HighlightPolyfill });

const cssGlobal = globalThis as typeof globalThis & {
  CSS?: { highlights?: Map<string, unknown> };
};
if (!cssGlobal.CSS) {
  Object.assign(globalThis, { CSS: { highlights: new Map() } });
} else if (!cssGlobal.CSS.highlights) {
  Object.defineProperty(cssGlobal.CSS, 'highlights', { value: new Map(), configurable: true });
}

// matchMedia: read by Cosmos at module load (touch-device detection).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});

export {};

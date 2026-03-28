// Patch Node 22+ localStorage which throws without --localstorage-file
// This runs in the test worker before any other setup
const store = {};
const mockLocalStorage = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i) => Object.keys(store)[i] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: mockLocalStorage,
});

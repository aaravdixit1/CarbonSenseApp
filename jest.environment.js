/**
 * Custom Jest environment that patches Node 22+ localStorage
 * before jest-environment-node tries to copy it into the VM context.
 */

// Patch globalThis.localStorage BEFORE requiring jest-environment-node
// so that the nodeGlobals Map captures a working implementation.
const store = {};
const mockLocalStorage = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i) => Object.keys(store)[i] ?? null,
};

try {
  // Test if localStorage is broken (Node 22+)
  globalThis.localStorage.getItem('__probe__');
} catch {
  // Replace the broken localStorage with our mock
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    enumerable: true,
    value: mockLocalStorage,
  });
}

const NodeEnvironment = require('jest-environment-node').default || require('jest-environment-node');

class PatchedNodeEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
  }
}

module.exports = PatchedNodeEnvironment;

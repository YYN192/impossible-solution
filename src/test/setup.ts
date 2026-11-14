// Shared test setup: unmount React trees between tests (needed because Vitest globals are off).
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Node 25+ has its own global localStorage, which is undefined unless Node gets a storage file.
// It hides jsdom's localStorage, so tests that use it crash. Put jsdom's back (no-op on Node 22).
const dom = (globalThis as { jsdom?: { window: Window } }).jsdom;
if (dom && typeof globalThis.localStorage === "undefined") {
  for (const key of ["localStorage", "sessionStorage"] as const)
    Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
}

afterEach(() => cleanup());
import "../i18n";

// Shared test setup: unmount React trees between tests (needed because Vitest globals are off).
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Node 25+ has its own global localStorage, which is undefined unless Node gets a storage file.
// It hides jsdom's localStorage, so tests that use it crash. Put jsdom's back (no-op on Node 22).
const dom = (globalThis as { jsdom?: { window: Window } }).jsdom;
if (dom && typeof globalThis.localStorage === "undefined") {
  for (const key of ["localStorage", "sessionStorage"] as const)
    Object.defineProperty(globalThis, key, { value: dom.window[key], configurable: true, writable: true });
}

afterEach(() => cleanup());
// DOM tests verify interactions; the real canvas is verified in the browser.
Object.defineProperty(window, "matchMedia", { writable: true, value: vi.fn((query: string) => ({ matches: query.includes("reduced-motion"), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ fillRect: vi.fn(), strokeRect: vi.fn(), drawImage: vi.fn(), fillText: vi.fn() })) as never;
HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
import "../i18n";

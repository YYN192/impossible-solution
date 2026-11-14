// Shared test setup: unmount React trees between tests (needed because Vitest globals are off).
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
import "../i18n";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/pixelify-sans/latin-400.css";
import "@fontsource/pixelify-sans/cyrillic-400.css";
import "@fontsource/pixelify-sans/latin-700.css";
import "@fontsource/pixelify-sans/cyrillic-700.css";
import "@fontsource/nunito/latin-400.css";
import "@fontsource/nunito/cyrillic-400.css";
import "@fontsource/nunito/latin-700.css";
import "@fontsource/nunito/cyrillic-700.css";
import "./index.css";
import "./expedition.css";
import "./i18n";
import App from "./App.tsx";
import { restoreRun, startPersisting } from "./state/persist";

// No reload loses a mission: put a saved run back, then keep saving (never with ?demo=1).
restoreRun();
startPersisting();
import "./run.css";
import "./ui.css"; // last: the shared button / 8-bit system wins over per-screen CSS

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

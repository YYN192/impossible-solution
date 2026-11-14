import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MarsHub from "./MarsHub";
import "./pixel.css";
import "./hub.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MarsHub />
  </StrictMode>,
);

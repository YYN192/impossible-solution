import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import MainMenu from "./MainMenu";
import "./pixel.css";
import "./menu.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MainMenu />
  </StrictMode>,
);

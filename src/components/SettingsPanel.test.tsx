import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../i18n";
import bg from "../i18n/bg.json";
import en from "../i18n/en.json";
import { useAudio } from "../game/audio";
import { readComfort, reducedMotion, useComfort } from "../state/comfort";
import { SettingsPanel } from "./SettingsPanel";

const t = i18n.t.bind(i18n);
const btn = (name: string) => screen.getByRole("button", { name });
const html = document.documentElement;
const reset = { calm: false, contrast: false, textSize: 100, skipMiniGames: false, slowMiniGames: false, soundAsked: false } as const;
afterEach(() => { useComfort.setState(reset); useAudio.setState({ muted: false }); localStorage.clear(); });

describe("comfort settings (#77)", () => {
  it("calm, high contrast and text size reach the page, and are saved", () => {
    render(<SettingsPanel onBack={() => {}} />);
    fireEvent.click(btn(t("comfort.calm")));
    fireEvent.click(btn(t("comfort.contrast")));
    fireEvent.click(btn("150%"));
    expect(html.hasAttribute("data-calm")).toBe(true);
    expect(html.hasAttribute("data-contrast")).toBe(true);
    expect(html.style.fontSize).toBe("150%");
    expect(reducedMotion()).toBe(true); // calm mode stills everything that follows reduced motion
    expect(readComfort()).toMatchObject({ calm: true, contrast: true, textSize: 150 });
    fireEvent.click(btn("100%"));
    expect(html.style.fontSize).toBe("");
  });

  it("quiet class turns all sound off in one tap", () => {
    render(<SettingsPanel onBack={() => {}} />);
    fireEvent.click(btn(t("comfort.quiet")));
    expect(useAudio.getState().muted).toBe(true);
    expect(btn(t("comfort.quiet")).getAttribute("aria-pressed")).toBe("true");
  });

  it("a broken or old saved value falls back to the default", () => {
    localStorage.setItem("sol:comfort", JSON.stringify({ calm: "yes", textSize: 300, contrast: true }));
    expect(readComfort()).toMatchObject({ calm: false, textSize: 100, contrast: true });
    localStorage.setItem("sol:comfort", "{not json");
    expect(readComfort().calm).toBe(false);
  });

  it("has the same comfort words in English and Bulgarian", () => {
    expect(Object.keys(bg.comfort).sort()).toEqual(Object.keys(en.comfort).sort());
  });
});

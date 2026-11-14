import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../i18n";
import { useNav } from "../state/screen";
import { FAKE_DOMINOES, FAKE_EVENTS, loadFakeGame } from "./fakeGame";
import { MorningScreen } from "./MorningScreen";
import { helpTopicForDomino } from "../components/helpTopics";
import en from "../i18n/en.json";

const showMorning = (sol: number) => {
  loadFakeGame(sol);
  useNav.setState({ screen: "morning", sol });
  render(<MorningScreen />);
};
const text = () => document.body.textContent ?? "";

describe("Morning report", () => {
  afterEach(cleanup);

  it("sol 1: calm first morning, no domino, no extra line", () => {
    showMorning(1);
    screen.getByText("First morning on Mars. Everything works.");
    expect(document.querySelector(".domino")).toBeNull();
    expect(document.querySelector(".chip")).toBeNull();
  });

  it("sol 2: fallen domino first, then its cause, then the storm with a saved-data chip", () => {
    showMorning(2);
    const dominoes = [...document.querySelectorAll(".domino")].map(
      (d) => d.textContent,
    );
    expect(dominoes).toEqual([
      "⚡↓Power is low today.",
      "🧽✗Nobody cleaned the solar panels.",
    ]);
    screen.getByText("because");
    screen.getByText("The Sun just blasted a space-ray storm!");
    expect(text()).toContain(
      "A Mars rover measured this storm on 20 May 2024.",
    );
    // Snapshot data must never be called live.
    expect(text()).toContain("Real NASA data (saved)");
    expect(text()).not.toMatch(/live/i);
  });

  it("sol 3: tired astronaut because food ran out, then Earth's answer", () => {
    showMorning(3);
    expect(document.querySelector(".domino-fall")?.textContent).toContain(
      "One astronaut is too tired to work.",
    );
    screen.getByText("The food ran out.");
    screen.getByText(
      "📡 Earth says: dusty skies tomorrow, and a storm cloud arrives in 1 sol.",
    );
  });

  it("only one extra sentence at most", () => {
    for (const sol of [1, 2, 3]) {
      showMorning(sol);
      expect(document.querySelectorAll(".extra").length).toBeLessThanOrEqual(1);
      cleanup();
    }
  });

  it("every domino and event text key exists in en.json", () => {
    const keys = [
      ...FAKE_DOMINOES.map((d) => d.textKey),
      ...FAKE_EVENTS.map((e) => e.captionKey),
    ];
    expect(keys.filter((k) => !i18n.exists(k))).toEqual([]);
  });
});

describe("Morning report 'What's this?' tooltips (#16)", () => {
  afterEach(cleanup);
  const help = (title: string) => screen.queryByRole("button", { name: `What's this? ${title}` });

  it("sol 2: explains the fallen domino (power) and the storm (space-ray storm)", () => {
    showMorning(2);
    expect(help("Power")).not.toBeNull();
    fireEvent.click(help("Space-ray storm")!);
    expect(text()).toContain("too fast for Earth to warn you");
  });

  it("sol 3: explains food and Ask Earth", () => {
    showMorning(3);
    expect(help("Food")).not.toBeNull();
    expect(help("Ask Earth")).not.toBeNull();
  });

  it("every domino the engine can drop has a tooltip topic", () => {
    for (const key of Object.keys(en.domino)) expect(helpTopicForDomino(`domino.${key}`), key).toBeDefined();
  });
});

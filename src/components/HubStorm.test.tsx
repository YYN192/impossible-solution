import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../i18n";
import { OPPORTUNITY_2018 } from "../data/campaigns";
import { StormAlarm } from "./HubStorm";

describe("dust storm alarm (#67)", () => {
  afterEach(async () => { cleanup(); await i18n.changeLanguage("en"); });
  it("shows the source line in Bulgarian when the game is in Bulgarian", async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
    await i18n.changeLanguage("bg");
    render(<StormAlarm storm={{ real: "opportunity2018", source: OPPORTUNITY_2018 }} onClose={() => {}} />);
    const link = document.querySelector(".storm-real a")!.textContent!;
    expect(link).toContain("Марсоходът Opportunity");
    expect(link).not.toContain("NASA's Opportunity rover");
  });
});

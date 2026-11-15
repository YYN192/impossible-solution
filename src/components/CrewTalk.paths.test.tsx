import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import { DRILL, type Speaker } from "../game/talk";
import { useMission } from "../state/mission";
import { CrewTalk } from "./CrewTalk";

// #82: every path through a hub talk. The mini-games' own rules are tested in JobMiniGame.test.tsx;
// here a stub wins or skips, so these tests only check what CrewTalk does with the result.
vi.mock("./JobMiniGame", () => ({
  JobMiniGame: ({ onClose }: { onClose: (won: boolean) => void }) => (
    <>
      <button onClick={() => onClose(true)}>stub win</button>
      <button onClick={() => onClose(false)}>stub skip</button>
    </>
  ),
}));

beforeAll(() => {
  // jsdom has no dialog.close(); the shared setup only adds showModal() and turns reduced motion on (lines show whole).
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute("open"); };
});
afterEach(() => useMission.setState({ status: "idle", setup: undefined }));

const line = () => document.querySelector(".crew-talk__line")!.childNodes[0].textContent;
const next = () => fireEvent.click(screen.getByRole("button", { name: /Next/ }));
const answer = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const crew = Object.keys(DRILL) as (keyof typeof en.talk & Speaker)[];

describe("CrewTalk paths (#82)", () => {
  for (const s of crew) {
    const talk = en.talk[s as "commander"];
    it(`${s}: intro → menu → each answer → back to the menu; the drill win shows its line`, () => {
      render(<CrewTalk speaker={s} onClose={() => {}} />);
      expect(line()).toBe(talk.intro);
      next();
      expect(screen.getAllByRole("button").filter((b) => b.closest(".crew-talk__menu")).map((b) => b.textContent))
        .toEqual([en.talk.ask.drill, en.talk.ask.mission, en.talk.ask.who, en.talk.ask.bye]);
      for (const [ask, reply] of [[en.talk.ask.mission, talk.mission.storm], [en.talk.ask.who, talk.who]]) {
        answer(ask);
        expect(line()).toBe(reply);
        next();
        screen.getByRole("button", { name: en.talk.ask.bye });
      }
      answer(en.talk.ask.drill);
      expect(line()).toBe(talk.drillIntro);
      next();
      answer("stub win");
      expect(line()).toBe(talk.win);
      next();
      screen.getByRole("button", { name: en.talk.ask.bye });
    });
  }

  it("'Bye for now!' and Esc both close", () => {
    const onClose = vi.fn();
    render(<CrewTalk speaker="drone" onClose={onClose} />);
    next();
    answer(en.talk.ask.bye);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  for (const place of ["airlock", "greenhouse"] as const) {
    it(`${place}: hello → advice → close`, () => {
      const onClose = vi.fn();
      render(<CrewTalk speaker={place} onClose={onClose} />);
      expect(line()).toBe(en.dialogue[place].hello);
      next();
      expect(line()).toBe(en.dialogue[place].advice);
      next();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  }

  it("#83: on the Moon the crew speak about the Moon, not Mars", () => {
    useMission.setState({ status: "ready", setup: { place: "moon", campaignId: "moon" } as never });
    render(<CrewTalk speaker="scientist" onClose={() => {}} />);
    expect(line()).toBe(en.talk.scientist.intro_moon);
    next();
    answer(en.talk.ask.who);
    expect(line()).toBe(en.talk.scientist.who_moon);
  });
});

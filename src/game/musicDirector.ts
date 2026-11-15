import { useEffect } from "react";
import { hubStormFor, repaired } from "../data/hubStorm";
import { readFlags } from "../data/flags";
import type { MissionSetup } from "../data/mission";
import type { GameState } from "../sim/types";
import { useGame } from "../state/game";
import { useMission } from "../state/mission";
import { useNav, type Nav, type Place } from "../state/screen";
import { audio, type MusicScene } from "./audio";

/**
 * Turns the game's own state into the music intent (src/game/audio.ts plays it). The only place
 * that decides music; screens never start or stop tracks themselves.
 */

/** Pure: which music scene the visible place is. Mars or Moon, hub or console: the same base songs. */
export function musicScene(visible: Place, setup: Pick<MissionSetup, "place"> | undefined): MusicScene {
  if (visible === "menu") return "menu";
  if (!setup) return "off"; // still loading: no mission yet, no music
  return "base";
}

/**
 * Pure: is a REAL storm being warned about or still on? Only two things count, both straight from the
 * game state (never a dialog, a mission name or a caption):
 *  - the base dust storm (data/hubStorm): its alarm shows the moment that sol starts, and the storm
 *    lasts until BOTH repairs are in the engine (panels + greenhouse), even if the alarm is closed;
 *  - a storm cloud that Earth warned about (the engine's warnedSols, like knownEvents), on its sol,
 *    while the morning report shows it, through the plan; the end-of-sol report looks back on it.
 * Not counted: a particle burst (it comes without warning), Earth's forecast of a storm a few sols
 * away, the end-of-sol captions, the "storm" campaign's name, the ?demo=1 run, and the Moon.
 */
export function stormMusic(
  setup: Pick<MissionSetup, "place" | "seed" | "events" | "rules" | "campaignId"> | undefined,
  nav: Nav,
  game: Pick<GameState, "sol" | "dominoes" | "warnedSols">,
  demo = false,
): boolean {
  if (!setup || setup.place === "moon") return false;
  if (!["morning", "beat", "plan"].includes(nav.screen) || nav.sol !== game.sol) return false;
  const dust = hubStormFor(setup, nav.sol, demo);
  if (dust && !(repaired(game as GameState, "storm-panels") && repaired(game as GameState, "storm-greenhouse"))) return true;
  return setup.events.some((e) => e.kind === "stormCloud" && e.sol === nav.sol && Boolean(game.warnedSols?.includes(e.sol)));
}

/** Call once, in App: keeps the music intent in step with the menu, base, console and storm. */
export function useMusicDirector(visible: Place) {
  const setup = useMission((m) => m.setup);
  const screen = useNav((s) => s.screen), sol = useNav((s) => s.sol);
  const game = useGame((s) => s.state);
  const scene = musicScene(visible, setup);
  const storm = scene !== "menu" && scene !== "off" && stormMusic(setup, { screen, sol }, game, readFlags().demo);
  useEffect(() => { audio.setMusic({ scene, storm }); }, [scene, storm]);
  useEffect(() => () => audio.setMusic({ scene: "off", storm: false }), []);
}

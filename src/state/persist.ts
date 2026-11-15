/**
 * No reload loses a mission: the run (which mission, the game, the screen, the draft plan) is
 * kept in sessionStorage and put back on startup. `?demo=1` never restores: the recording
 * always starts fresh. A link to another run (?campaign=, ?seed=) wins over the saved one.
 */
import { readFlags } from "../data/flags";
import type { MissionSetup } from "../data/mission";
import { useSession } from "../game/session";
import type { Bars, Domino, GameState, Plan } from "../sim/types";
import { useGame } from "./game";
import { useMission } from "./mission";
import { useNav, type Place, type Screen } from "./screen";

export const RUN_KEY = "sol:run";
// 3: icons are pixel-icon names, not emoji (#50); older saved runs start fresh.
const VERSION = 3;

interface Saved {
  v: number;
  nav: { screen: Screen; sol: number; place: Place };
  game: { state: GameState; fell: Domino[] };
  session: { draft: Plan; before?: Bars };
  setup: MissionSetup;
}

export function saveRun(): void {
  const setup = useMission.getState().setup;
  if (!setup) return;
  const { screen, sol, place } = useNav.getState();
  const { state, fell } = useGame.getState();
  const { draft, before } = useSession.getState();
  const saved: Saved = { v: VERSION, nav: { screen, sol, place }, game: { state, fell }, session: { draft, before }, setup };
  try {
    sessionStorage.setItem(RUN_KEY, JSON.stringify(saved));
  } catch {
    // Storage blocked or full: the mission still plays, it just will not survive a reload.
  }
}

/** Put a saved run back. Returns false (and changes nothing) when there is none to restore. */
export function restoreRun(search: string = globalThis.location?.search ?? ""): boolean {
  const flags = readFlags(search);
  if (flags.demo) return false;
  let saved: Saved;
  try {
    saved = JSON.parse(sessionStorage.getItem(RUN_KEY) ?? "null");
  } catch {
    return false;
  }
  if (!saved || saved.v !== VERSION || saved.nav.screen === "title") return false;
  if (flags.campaign && flags.campaign !== saved.setup.campaignId) return false;
  if (flags.seed !== undefined && flags.seed !== saved.setup.seed) return false;
  useMission.setState({ status: "ready", setup: saved.setup });
  useGame.setState(saved.game);
  useSession.setState(saved.session);
  useNav.setState(saved.nav);
  return true;
}

/** Save after every change. Call once at startup (main.tsx), after restoreRun(). */
export function startPersisting(): () => void {
  const stops = [useNav.subscribe(saveRun), useGame.subscribe(saveRun), useSession.subscribe(saveRun), useMission.subscribe(saveRun)];
  return () => stops.forEach((stop) => stop());
}

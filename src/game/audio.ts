import { create } from "zustand";
export interface AudioPreferences { master: number; music: number; sfx: number; muted: boolean }
const defaults: AudioPreferences = { master: 0.7, music: 0.5, sfx: 0.7, muted: false };
function readPreferences(): AudioPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem("sol:audio") ?? "{}");
    const volume = (key: "master" | "music" | "sfx") =>
      typeof saved[key] === "number" && Number.isFinite(saved[key])
        ? Math.max(0, Math.min(1, saved[key])) : defaults[key];
    return { master: volume("master"), music: volume("music"), sfx: volume("sfx"), muted: saved.muted === true };
  } catch { return defaults; }
}
export const useAudio = create<AudioPreferences>(() => readPreferences());
const registry = new Map<string, string>();
const active = new Map<HTMLAudioElement, "music" | "sfx">();
let music: HTMLAudioElement | undefined;
function syncVolumes() {
  const p = useAudio.getState();
  for (const [sound, kind] of active) sound.volume = p.muted ? 0 : p.master * p[kind];
}
useAudio.subscribe((prefs) => {
  try { localStorage.setItem("sol:audio", JSON.stringify(prefs)); } catch { /* optional storage */ }
  syncVolumes();
});
function play(id: string, kind: "music" | "sfx") {
  const url = registry.get(id);
  if (!url || typeof Audio === "undefined") return;
  const sound = new Audio(url);
  sound.loop = kind === "music";
  active.set(sound, kind);
  sound.onended = sound.onerror = () => { active.delete(sound); };
  syncVolumes();
  void sound.play().catch(() => { active.delete(sound); });
  return sound;
}
/** Silent until real, credited sound files are registered. Never autoplay music. */
export const audio = {
  register: (id: string, url: string) => registry.set(id, url),
  playSfx: (id: string) => { play(id, "sfx"); },
  playMusic: (id: string) => { audio.stopMusic(); music = play(id, "music"); },
  stopMusic: () => { if (music) { music.pause(); active.delete(music); music = undefined; } },
  mute: (muted: boolean) => useAudio.setState({ muted }),
};

# Changelog

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] — 2026-11-15

Submission build. [Play it](https://impossible-solution.vercel.app) · [30-second launch video](https://github.com/YYN192/impossible-solution/blob/main/docs/media/launch-video.mp4).

### Added

- Three campaigns: 5-sol Storm Season, Dust Season and the Moon's South Pole Outpost, with a mission picker, save and restore (engine v2, real storm pool).
- Rover map and crew skills; a full rover load now tires Amara, and the game says so before it happens (#66).
- Hands-on mini-games for 8-year-olds: Mission 1 (#59), Dust Season panel wipe and rover drive (#98, #101), Moon and dust mini-games.
- Random real-data dust storm at the base: wipe the solar panels and fix the greenhouse, with a 30-second countdown and a retry (#108).
- Crew talk: walk up to Nova, Kai or Amara for typed subtitles, mission briefings and mini-game practice (#57, #92); Moon versions of the lines (#83).
- Station airlock opens a mission map of Mars and the Moon (#54); pick a base there to travel to it (#106, #107).
- Engineering bay: pixel bar graphs of real InSight power, Mars night cold and storm radiation (#93).
- Live space weather ticker from DONKI on the console (#60) and a "Today's real Sun" card for the newest Mars-bound storm cloud (#8, #69).
- Backend on Vercel: live NASA data through our own `/api`, with honest LIVE / SAVED DATA badges (#44).
- End-of-sol wrap-up: changes pop in one by one, bad news first (#65).
- Plan screen: skipped-job dominoes, live meter change and keyboard flow (#9, #10, #40); choose an astronaut first (#90).
- Comfort settings: calm mode, high contrast, text size, slow mini-games and Pause (#77, #81, #104).
- Teacher code `ARES2026` unlocks every mission (#58).
- Moon station art and ambience (#76).
- Original soundtrack by Viktor Devanathan (#89), Web Audio engine for the 63 sound effects with a mute toggle (#45), and music for each part of the game (#62).
- 55 pixel-art icons replace every emoji (#50, #72); hub redrawn in pixel art (#46); dust puffs and an idle bounce when walking (#52).
- Full-screen button, 30-second launch video, new demo GIF and social banner.
- QA harness for layout, labels and whole campaigns (#49).

### Changed

- Hub fits any screen: height-aware canvas, tap or drag to walk, skip to the console (#43, #61, #75).
- Plan screen and console screens fit a laptop without page scrolling (#94, #95).
- One gold main button per screen, also in dialogs, Data Sources, the teacher card and settings (#94, #96, #103).
- Readable bold Nunito for labels and buttons in both languages; only the title keeps the pixel font.
- Pulsing glow around the mission console until the first sol starts (#55, #109).
- Kid copy limits now also cover crew talk (#57); text audit removed or shortened lines that added nothing (#67).
- First-play guide and show-don't-tell pass on every screen (#64).

### Fixed

- Sim honesty: no forecast leak, whole power numbers, fair blame and an uncapped dose meter (#47).
- Data honesty: a game event no longer shows as "It's real!" (#73).
- Interact key and W A S D work with a Bulgarian keyboard layout (#53, #87); arrow keys move the rover (#63).
- Help bubble no longer covers the bottom bar (#56); readable dust overlay and bigger tap targets on phones (#75).
- Missing storm and warning sounds (#74); music pauses in a hidden tab; the storm music stops reliably (#111).
- Consistent mistake feedback and Ask Earth keys that never drop a press (#91, #111).
- Launch video highlight stays on its line (#70).

## [0.1.0] — 2026-11-14

First playable hackathon build. [Play it](https://impossible-solution.vercel.app).

### Added

- Three-sol Mars base simulation with power, air, food and radiation trade-offs, where no job is a free choice (#28, #30, #33).
- Walkable pixel-art station, mission console and plan screen (#36).
- Final domino chain that traces each problem back to the choices that caused it (#29).
- NASA data layer with saved snapshots, Mars-only DONKI forecasts and honest LIVE / SAVED DATA labels (#23, #24, #27, #32).
- Data Sources screen that separates real measurements from labelled game numbers (#24, #25, #35).
- Deterministic `?demo=1` recording path (#35).
- Kid-friendly text, "What's this?" tooltips and a teacher card (#26, #31, #34).
- Bulgarian translation with an EN/BG toggle (#37).
- Original 8-bit sound library (#38).

[0.2.0]: https://github.com/YYN192/impossible-solution/releases/tag/v0.2.0
[0.1.0]: https://github.com/YYN192/impossible-solution/releases/tag/v0.1.0

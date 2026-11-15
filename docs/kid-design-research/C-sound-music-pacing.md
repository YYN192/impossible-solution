# C. Music, sound design, pacing and game feel for ages 7-12 (The Impossible SOLution)

Research date: 15 Nov 2026. Evidence key: **[O]** = I opened the page and read it; **[S]** = I only saw a search-result summary (the page itself blocked or failed to load); **[I]** = design inference, not a finding. Almost no source here is a study of 7-12 year olds in a Mars-base game, so most advice is extrapolated. Weak spots are flagged inline.

## (a) Executive summary

1. Background music has a small, reliable cost for reading and memory in lab studies, and people do not notice it hurts them [4][5][6]. Treat reading and decision moments as music-free or very quiet [I].
2. Evidence that music helps learning is weak: the "Mozart effect" is not supported as a general effect [6]; music may raise mood and engagement, with one boundary: do not overlap speech [21b, weak]. Use music for atmosphere in the hub, not as a study aid.
3. Duck music hard (to about 20-30% or pause) whenever long text, narration or a choice is on screen [I, supported by 1,4,7].
4. Cues: keep them short, distinct per event, and not too frequent. Praise is plentiful in children's games, error feedback is often missing or confusing [17]. Make failure cues informative and gentle, never a buzzer.
5. Alarms: urgency comes from pulse rate, pitch and repetition, but the same features raise annoyance [12]. Use a short, repeating, friendly-urgent pattern, cap it to a few seconds, then resolve it with a clear relief cue.
6. Real standards (IEC 60601-1-8) have poor learnability because the alarms are abstract melodies; auditory icons did best in replacement tests [11]. Use a recognisable sound plus a visible icon and text.
7. Mood by tempo and mode: age 5 children read tempo only; 6-8 year olds use tempo and mode like adults [9]. At 7-12, major/fast = happy, minor/slow = sad or tense will land.
8. Accessibility is a rule set, not polish: never sound-only information, separate volumes for music/effects/speech, captions for important sounds, audio off until a user gesture [1][2][3].
9. Classroom: many devices at once means low default volume, music off by default or very quiet, headphones encouraged; ANSI S12.60 wants about 35 dBA background so teachers can be heard [18].
10. Pacing: no good peer-reviewed data on session length for 7-12; vendor sources say 15-30 min [21, weak]. Build 5-10 minute missions with natural stop points. Moderate "juice" beats none or extreme [15].

## (b) Findings

### 1. Does background music help or hurt learning and reading for 7-12?

- A Bayesian meta-analysis of 65 studies (Vasilev et al., 2018) reports that background noise, speech and music each have a small but reliable harmful effect on reading, with music about g = -0.19, and no general difference between adults and children [4] **[S, page blocked by bot check]**. This is the strongest evidence here, and it includes children.
- A study of 7th and 8th graders found music hurt both tasks while students were unaware of the harm [5] **[S]**. Ages are above 12, so extrapolate with care.
- Liked, acoustically varied music hurt memory more than disliked music, and people judged this wrongly (Perham & Sykora 2012, as summarised by Gwern) [6] **[O]**. Caveat: this is a secondary notes page the author labels low-confidence, and its list of child studies gives titles only, no outcomes.
- An older single study (Johansson 1983) found 10-year-olds' reading did not differ between quiet and noise [4, search summary] **[S]**. So the child evidence is mixed, but the average leans negative.
- Moreno & Mayer (2000): learners did better from animations without background music, framed as the coherence principle (cut extraneous material) [7] **[S]**. A 2020 meta-analysis of 58 studies on "seductive details" found lower learning with extraneous interesting content [8] **[S]**; it is not about music specifically.
- Opposing view: a 2026 review in a journal I could not confirm as high quality argues background music raises engagement and enjoyment, with the key exception that music overlapping speech impairs verbal recall [21b] **[S, weak, treat as hypothesis]**.
- The Mozart effect is "largely debunked" as a general boost, but that says little about performance during music [6] **[O]**.
- **Design reading [I]:** Music is fine where the child is moving or waiting (hub, walking, storm build-up) and should duck or stop in reading and decision moments. Instrumental, slow-changing, loop-friendly music with low acoustic variation is the safest. Never use vocals or lyrics under text.
- **When to duck/stop [I, based on 1,4,7]:** (1) any text longer than a short sentence, (2) any voice line, (3) the decision panel, trade-off summaries and debrief, (4) a storm alarm banner that must be read. Fade over 300-500 ms, return over 1-2 s after the screen is dismissed.

### 2. Sound as feedback (success, failure, frequency, habituation)

- Games for young kids give praise often but omit negative feedback (review of 76 preschool edutainment games) [17] **[S]**; error feedback in five early reading games was inconsistent, encouraging trial and error [17] **[S]**. In a CHI 2022 study, primary-age children noticed spoken elaborative feedback but struggled to understand it, and older children noticed it more [17] **[S]**. Implication: do not put the explanation of a failure only in audio, and do not rely on a tone to teach.
- Study of 120 primary children: sound effects, visuals, challenge level and feedback messages contributed most to engagement [17] **[S]**; it does not isolate negative sounds.
- Game Accessibility Guidelines ask for distinct sounds per key object/event [1] **[O]**.
- Juice/redundant feedback: in an action-RPG experiment (N=3018) both "none" and "extreme" juiciness lowered play time, experience, motivation and performance versus medium/high [15] **[S]**; Hicks et al. 2019 report nuanced effects [15] **[S]**. I found no study of juice on learning outcomes in an educational game [15]. The infographic study "Juicy or Dry?" exists but I could not read its results [15].
- **Design reading [I]:** One short earcon per event type (select, confirm, job-complete, error, storm-warning). Success: rising 2-3 note chip, 150-400 ms. Failure or "not enough power": a soft lower two-note "bwoop" with a shake/icon and a text reason, not a buzzer or a harsh noise. Vary pitch slightly (+-2 semitones) on frequent cues such as steps and selects to fight habituation, and rate-limit footsteps and repeated clicks. Reserve the richest fanfare for rare events (mission complete). Use earcons for state, voice only for guidance that is also in text.

### 3. Alarms and tension (storm exciting, not frightening)

- IEC 60601-1-8 alarms are abstract melodies with the same temporal pattern; recognition stays low even after exposure; urgency is signalled by variants, and Edworthy notes the situation, not the alarm, should set urgency [11] **[S]**. A joint ISO/AAMI test of replacement sets found auditory icons performed best and all replacements beat the current ones [11] **[S]**. The standard's current status is unconfirmed.
- Edworthy, Loxley & Dennis (1991) and follow-ups: faster pulse rate, higher pitch and more repetitions raise perceived urgency; syncopated pulses lower it; rate is the most efficient parameter; but raising urgency also tends to raise annoyance [12] **[S]**.
- I found no results on startle/fear from loud sounds in children, and none on scary-music effects in children **[gap]**. Everything on child fear below is [I].
- **Design reading [I]:**
  - Intensity scale by tier: Watch (soft two-note chime, once), Warning (repeating 2-note pattern at moderate rate, 3-4 repeats), Alert (faster pulse, only for the peak moment). Do not use sirens, sharp onsets, or very high pitches with kids; keep the peak below the loudest game sound.
  - Duration: at most about 5 s of repeating alarm, then a soft low "pulse" bed while the storm is active (the visual banner carries the urgency). Never loop an alarm until the child acts.
  - Frame the alarm as "your base is alerting you" (a friendly robot/console voice, a clear action prompt), not "danger".
  - Resolve: a clear all-clear cue (rising major arpeggio, base lights return) plus a debrief line "You protected the crew", so the arc is tension, action, relief.
  - Dust-storm cover and the space-ray alarm should each have a different timbre and rhythm (distinct sounds [1]); the dust storm can be a filtered, low-passed whoosh with the music fading to muffled, the ray alarm a short pulsing ping.
  - Offer a "calm mode" (lower alarm intensity, no flashing) for sensitive kids and classrooms.

### 4. Musical mood by game state

- Children use tempo from about age 5 and tempo plus mode from about 6-8, like adults (Dalla Bella et al., 2001) [9] **[S]**; 3-4 year olds did not tell happy from sad [9]. Fast tempo raises arousal in adults [10] **[S]**, and a 2023 study of 4-6 year olds found slow-tempo music preserved attentional efficiency, not explained by arousal or mood [10] **[S]** (younger than our audience).
- Karen Collins, *Game Sound*, covers game audio functions and dynamic/adaptive music approaches in dedicated chapters [20] **[S, catalogue listing only; I did not read the book]**.
- **Mapping [I]:**

| State | Tempo | Mode / harmony | Instruments (chiptune-friendly) | Level |
|---|---|---|---|---|
| Lobby / hub (calm base) | 70-90 BPM | Major or Lydian, open fifths, sparse | Soft pulse/triangle pads, slow arpeggio, gentle noise-hat | Low, loops 60-120 s, no strong hook |
| Planning / console (focus) | 60-80 BPM or near-silent ambience | Static harmony, little melody | Low hum, occasional blip | Very low; near zero when reading |
| Storm incoming | Rising 90 to 120 BPM, ostinato | Minor or Phrygian colour, pedal bass | Pulse-wave ostinato, filtered noise swell | Moderate; under the alarm earcon |
| Storm active | Steady 100-110 BPM | Minor, unresolved | Low square bass, sparse high ping | Low, so text is readable |
| Victory / all clear | 110-130 BPM | Major resolution (V to I) | Bright pulse leads, short fanfare 3-6 s | Moderate, then quiet |
| Failure / setback | 60-70 BPM | Minor, resolves gently | Soft triangle, two-note sigh | Brief, then back to calm |

- Chiptune fits: small files, clear timbres that read as "game" to 7-12 year olds, easy to loop and layer in the browser, and limited voices keep acoustic variation low, which suits the distraction evidence in section 1 [I; no study]. Keep melodies short and repetitive in focus states, and avoid fatigue with long loops (2+ min) and a gap between tracks.

### 5. Voice and narration

- Mayer's voice principle: a human voice beats a machine voice, supported in 5 of 6 experiments, median d = 0.74; boundary: may not hold with negative social cues such as low embodiment [13] **[S, Mayer chapter summaries; not children-specific]**. Personalisation (conversational style) was supported in 14 of 17 tests, median d = 0.79, may not apply to high-achieving students or long lessons [13] **[S]**.
- Dinçer (2022) found no significant difference between modern TTS voices and human voices [14] **[S, one study]**. Modern TTS is therefore a defensible option for a bilingual build.
- Game Accessibility Guidelines: voice for all text including menus is an advanced guideline for vision/cognitive; subtitles for all important speech are basic; reduce background sound during speech [1] **[O]**.
- Children had trouble understanding spoken elaborative feedback in a game [17] **[S]**, so voice should repeat on-screen text, not replace it.
- **Design reading [I]:** A short-line guide character (base AI) with a replay button and a "read to me" toggle for every instruction, EN and BG as separate recorded/TTS tracks (switch with the language toggle; keep timing equal; the BG voice must be a native or high-quality TTS voice, checked by a Bulgarian speaker). Team rule: no voices of minors in the demo or page. Keep lines under about 8 seconds; stop when the child taps a choice.

### 6. Accessibility and classroom

- Game Accessibility Guidelines **[O]**: no essential information by sound alone; separate volume controls or mutes for effects, speech and music; subtitles/captions clear and available before any sound plays; captions or visuals for significant background sounds; keep background noise low during speech; distinct sounds per key event; stereo/mono toggle; caption speed matched to the age group.
- WCAG 2.1 SC 1.4.2 (level A): if audio plays automatically over 3 seconds, provide pause/stop or an independent volume control; sound should start after a user action [2] **[O]**.
- Browser autoplay: Chrome starts an AudioContext "suspended" unless the page has had user activation, and `resume()` after the first click or tap is the standard fix; a "play" or "unmute" button can be that gesture [3] **[S, partial; Chrome page itself would not load]**. Safari/iOS has similar rules [I, not verified].
- Classroom noise: ANSI S12.60 sets a 35 dBA background limit for speech intelligibility; younger children are hit harder by noise; about +15 dB signal-to-noise is a common target [18] **[S]**. Real classrooms often fail the standard, so 25 laptops each playing music is a real problem [18].
- Hearing safety: the WHO-ITU safe-listening standard defines a child mode at 75 dB for 40 h/week (adult 80 dB) [19] **[S]**. Web pages cannot control output level, so keep master gain conservative and loudness-normalised between tracks [I].
- **Design reading [I]:** Music defaults ON at low gain at home but OFF (or prompt) in classroom mode/URL flag; effects low-moderate; a first-screen "Sound on / Sound off / Headphones recommended" choice that doubles as the audio-unlock gesture; mute and volumes persisted in localStorage with try/catch; a mute button always visible; M shortcut; `prefers-reduced-motion` also tones down screen shake and flashes on storms; captions are text strips like "[Alarm: space rays incoming]" shown for the alarm's duration.

### 7. Pacing and game feel

- "Juice it or lose it" (Jonasson & Purho, 2012) layers particles, screen shake, sound and animation onto a plain game without new mechanics; Swink's *Game Feel* is the other primary source [16] **[S]**. Critics note juice cannot fix a weak game, and juice is one aspect of game feel, not all of it [16] **[S]**.
- Moderate juice beat none and extreme in one large test [15] **[S]**; too much may overwhelm and lower intrinsic motivation [15].
- Session length: vendor and parent-guide sources suggest 15-20 min for younger kids, 20-30 min at 6-8 and 30-45 min at 9-12, but they are commercial and not peer-reviewed; official guidance does not address it [21] **[S, WEAK]**.
- **Design reading [I]:** Aim for a mission of 5-10 minutes with a save point, so a teacher can run it in a lesson slot. Beat structure per sol: calm planning (60-90 s), decision, short consequence animation (5-10 s), feedback, next. Never make a child wait more than about 3 s without motion or a progress cue; make storm waiting visible (a countdown with the warning chime), not silent. Reward cadence: tiny confirmation every action, small reward each job done, big celebration only per mission. Respect reduced motion for shake and particles. Keep skip/tap-to-continue on every animation and voice line.

## (c) AUDIT CHECKLIST (one mission/screen; answer yes/no, all should be yes)

| # | Check | Severity | Cite |
|---|---|---|---|
| 1 | No sound (music or effects) plays before the first user gesture; AudioContext is resumed on the first click/tap/key. | blocker | [2][3] |
| 2 | Every alarm sound (storm warning, space-ray alarm) has a visible on-screen equivalent (banner/icon plus text). | blocker | [1] |
| 3 | No information needed to finish the mission is conveyed by sound alone (deadlines, errors, success, storm start). | blocker | [1] |
| 4 | A mute-all control is visible and reachable by keyboard and touch on every screen, with a 44px+ target. | blocker | [1][2] |
| 5 | Separate controls (or at least separate mute) exist for music, effects and voice. | major | [1] |
| 6 | Mute state and volumes persist across reloads and screens (with storage failure handled). | major | [1][I] |
| 7 | Any auto-started music longer than 3 s can be paused or silenced independently of system volume. | major | [2] |
| 8 | Music ducks or pauses while long text, a voice line or a decision panel is shown. | major | [4][7][1] |
| 9 | Music returns smoothly after the text/decision is dismissed (no hard cut or volume jump). | minor | [I] |
| 10 | Background music is instrumental, has no lyrics and low acoustic variation on focus screens. | major | [6][4] |
| 11 | Default master volume is low enough that two devices side by side are not loud (document the gain value tested). | major | [18][19][I] |
| 12 | A classroom/low-noise setting exists (music off by default or one-tap off), and a "headphones recommended" prompt is shown. | major | [18] |
| 13 | Loudness is similar across music tracks and effects (no track more than about 6 dB louder than the others). | major | [19][I] |
| 14 | Alarm peak loudness is not the loudest sound in the game and never starts with an abrupt max-volume onset (soft attack). | blocker | [12][I] |
| 15 | The repeating alarm stops by itself within about 5 s; it never loops until the child acts. | major | [12][I] |
| 16 | The storm-warning, space-ray alarm, job-complete, error and select sounds are clearly distinguishable (different timbre and rhythm). | major | [1][11] |
| 17 | Alarm urgency has at least two tiers (warning vs peak) matched to the real severity, not one siren for everything. | minor | [11][12] |
| 18 | Every alarm is followed by a distinct all-clear/relief cue and an on-screen "what you did" message. | major | [I] |
| 19 | A calm/reduced-intensity option (softer alarm, no flashing, less shake) exists and `prefers-reduced-motion` is honoured. | major | [I] |
| 20 | Failure/error cues are soft and short (no harsh buzzer) and always come with a visible reason in text. | major | [17][I] |
| 21 | Frequent cues (steps, clicks, selects) are rate-limited and slightly varied so they do not grate over a 10-minute session. | minor | [15][I] |
| 22 | Big fanfares are reserved for rare milestones (mission complete), not every action. | minor | [15][I] |
| 23 | Important sounds (alarm, storm start, mission complete) have captions or a text/visual cue shown for their duration. | major | [1] |
| 24 | Captions/text for any voice line are on before the voice starts and readable (size, contrast) for 7-12. | major | [1] |
| 25 | Every voiced line is also shown as on-screen text and can be replayed or skipped. | major | [17][1] |
| 26 | Voice lines are short (about 8 s or less) and stop when the child makes the next move. | minor | [13][I] |
| 27 | English and Bulgarian audio (or TTS) both exist for all voiced lines, timing is equal, and a Bulgarian speaker has checked them. | major | [I] |
| 28 | Music mood matches state (calm in hub, tense but not scary in storm, major resolution on victory) per the tempo/mode table, checked by an adult listener. | minor | [9][I] |
| 29 | Music in storm-active state is quiet enough that on-screen text is comfortably readable (listener test with text on screen). | major | [4][I] |
| 30 | Music pauses when the tab is hidden and does not stack or duplicate when a screen is re-entered. | major | [I] |
| 31 | Muted users hear nothing from any source (HTML audio and Web Audio both gated by the mute state). | blocker | [1][I] |
| 32 | A mission can be played start to finish with sound fully off, with no loss of information. | blocker | [1] |
| 33 | No wait over about 3 s without motion, progress or a countdown; every animation or voice line can be skipped by tap/key. | minor | [I][16] |
| 34 | A single mission has a natural stop point within about 5-10 minutes (progress saved). | minor | [21 weak][I] |

## (d) References

**[O]** = read in full; **[S]** = seen via search-result summary only (page blocked or fetch failed).

1. [O] Game Accessibility Guidelines, full list: https://gameaccessibilityguidelines.com/full-list/
2. [O] W3C, Understanding SC 1.4.2 Audio Control (WCAG 2.1): https://www.w3.org/WAI/WCAG21/Understanding/audio-control.html
3. [S] Chrome, "Autoplay policy in Chrome": https://developer.chrome.com/blog/autoplay ; Chromium: https://www.chromium.org/audio-video/autoplay (direct fetch failed).
4. [S] Vasilev et al. (2018), meta-analysis of auditory distraction in reading: https://pmc.ncbi.nlm.nih.gov/articles/PMC6139986 (blocked).
5. [S] Anderson & Fuller (2010), music and 7th/8th graders; surfaced with https://pmc.ncbi.nlm.nih.gov/articles/PMC7596708 (EEG study on music and reading).
6. [O, secondary, self-labelled low confidence] Gwern, "Does music impede studying and thinking?": https://gwern.net/music
7. [S] Moreno & Mayer (2000), coherence effect: https://tecfa.unige.ch/tecfa/teaching/methodo/Moreno_Mayer00.pdf (PDF unreadable).
8. [S] Sundar & Adesope (2020), seductive details: https://www.sciencedaily.com/releases/2020/03/200319103223.htm
9. [S] Dalla Bella, Peretz, Rousseau & Gosselin (2001), tempo and mode in children: https://pubmed.ncbi.nlm.nih.gov/11274986/ (blocked).
10. [S] "Slow tempo music preserves attentional efficiency in young children": https://link.springer.com/content/pdf/10.3758/s13414-022-02602-3.pdf (ages 4-6).
11. [S] Edworthy (2013), "Medical audible alarms: a review": https://pmc.ncbi.nlm.nih.gov/articles/PMC3628049 ; AAMI: https://www.aami.org/misc/alarm-sounds-review (both fetches failed).
12. [S] Edworthy, Loxley & Dennis (1991) and Hellier et al., via e.g. https://www.mcgill.ca/mpcl/files/mpcl/suied_2008_jepappl.pdf
13. [S] Mayer, voice and personalization principles: https://www.cambridge.org/core/books/multimedia-learning/personalization-voice-and-image-principles/97F9B31362E6491806A4718FECCADE3D
14. [S] Dinçer (2022), human vs modern machine voices: https://doaj.org/article/a14435a205f54240bdd0b0db2fa06f91
15. [S] Hicks et al. (2019), "Juicy Game Design": https://www.aminer.org/pub/5daed34e3a55ac02c96451d3/juicy-game-design-understanding-the-impact-of-visual-embellishments-on-player-experience ; "Juicy or Dry?": https://arxiv.org/pdf/2506.17011 (PDF unreadable; results unseen).
16. [S] Jonasson & Purho, "Juice it or lose it"; Swink, *Game Feel*: https://gamejuice.pages.dev/articles/juice-it-or-lose-it-lessons
17. [S] Harvard edutainment feedback review: https://reacheveryreader.gse.harvard.edu/review-of-feedback-in-edutainment-games-for-preschoolers-in-the-usa ; CHI 2018 early reading games: https://discovery.ucl.ac.uk/10041423/1/A%20Critical%20Examination%20of%20Feedback%20in%20Early%20Reading%20Games%20camera%20ready.pdf ; CHI 2022: https://aminer.org/pub/627a22885aee126c0fc249f3/i-don-apos-t-usually-listen-i-read-how-different-learner-groups ; Hwang & Kang 2023 (metadata only): https://cs.reviewer.ly/app/publication/5f7a675c-f80d-43b9-a249-9db5cc1eb45f
18. [S] ANSI S12.60 classroom acoustics: https://www.larsondavis.com/learn/building-acoustics/ansi-standards-for-classroom-acoustics ; https://hearinghealthmatters.org/hearing-and-kids/2022/the-desirable-classroom-acoustics-imperative/
19. [S] WHO-ITU safe listening standard: https://www.who.int/publications-detail/safe-listening-devices-and-systems-a-who-itu-standard
20. [S, catalogue only] Collins, K. (2008), *Game Sound*, MIT Press: https://readings.com.au/product/9780262537773/game-sound--karen-collins--2008--9780262537773
21. [S, WEAK, commercial] Session length: https://www.novakidschool.com/blog/attention-span-screen-fatigue/ ; https://prodigygame.com/main-en/blog/screen-time-rules-by-age-chart-2026 . 21b [S, WEAK]: https://culturaesaude.med.br/en/background-music-increases-viewer-engagement-a-systematic-review-and-meta-analysis/

### Not covered (could not source)
GDC audio talks, PBS KIDS/Sesame audio practice, startle/fear in children from sudden sounds, scary-music effects in children, the text of ISO/IEC 60601-1-8 itself, Safari/iOS autoplay rules, any study of Bulgarian-language game audio. Items marked [I] should be playtested with real 7-12 year olds before being treated as findings.

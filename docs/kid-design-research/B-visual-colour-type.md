# B. Visual design, colour theory and readability for ages 7-12

Project: "The Impossible SOLution" (pixel-art Mars/Moon base, dark navy UI, cyan/orange/yellow accents, Nunito + Pixelify Sans, dust-storm overlay, EN + BG).

**Evidence honesty.** Sources I actually opened (full text or substantial extract) are marked in References with OPENED. Everything tagged `[unverified]` is standard practice or my background knowledge that I could NOT open in this session (w3.org target-size and flash pages, Rello & Baeza-Yates PDF, BDA, Xbox 102 timed out or blocked). Check those before quoting them to judges. Colour-emotion claims are weak by the best review I opened [1].

## (a) Executive summary

1. Colour-emotion claims ("red = danger, blue = calm") are plausible but weakly evidenced; the main review calls the field "nascent" and urges "patience and prudence" [1]. Use colour for consistency, not for psychology.
2. Value (light/dark) contrast carries legibility; WCAG computes contrast so hue barely matters, and colour-blind people keep light-dark perception [2]. Design in greyscale first.
3. Never carry meaning by colour alone: WCAG 1.4.1 [3], Game Accessibility Guidelines (Basic) [4], Xbox XAG 103 (multiple sensory channels) [5]. Pair colour with icon, shape, label.
4. Use the Okabe-Ito palette as the safe hue set for resource colours; vermilion not pure red [6]. Keep the project's red/green-ish pairs out of resource coding.
5. Text >= 4.5:1, large text >= 3:1, UI components and state indicators >= 3:1 [2][7]. Check text ON the dust overlay, not just on navy.
6. Children miss touch targets far more than adults (46% vs 32% of touches off-target, ages 7-11) [8]; NN/g recommends 2 cm x 2 cm for young children [9]. Use >=48 px on touch (project rule), more for ages 7-8.
7. Fonts: plain sans-serif with generous spacing beats "dyslexia fonts"; italics hurt; OpenDyslexic gave no benefit [10] (search-result summary only; flagged). Pixel font for the title only.
8. Motion: honour prefers-reduced-motion [11]; keep flashing below 3 per second [12]`[unverified]`; the storm should be a slow haze with a readable HUD above it, never a strobe.
9. Limit simultaneous information; cognitive-load and attention limits are well established in game UX [13] but I found no hard "N items" number, so treat counts below as heuristics.
10. Big boards and phones: design to the phone minimum, then scale type and targets up for the classroom board; check distance legibility physically.

## 1. Colour psychology and semantics for kids

- Elliot's review of colour and psychological functioning says the literature is at a "nascent stage", with weaknesses in theory and methods (uncontrolled viewing conditions, unstandardised hue/lightness/saturation), and recommends "patience and prudence regarding conclusions ... and real-world application" [1]. It also says every colour effect depends on culture, gender, age, task and variant of colour [1]. Conclusion: do not rely on "red makes people anxious" or "blue calms" as design facts.
- Better supported: red stimuli get an attentional advantage in visual search (several studies, some contradicted) [1]. That is attention, not emotion, and it supports using a warm alert colour sparingly.
- Semantic convention (red/orange = danger, yellow = caution, green = OK, cyan/blue = information) is mostly learned convention from traffic lights, UI and games. It works because it is conventional, not innate. Cultural caveats: colour meanings vary across cultures (e.g. red = luck in China, mourning elsewhere) [1] states culture moderates effects; I found no kid-specific study for Bulgaria. `[weak evidence]`.
- For this game: Mars orange is the setting colour AND the dust-storm colour AND a near-warning hue. Reserve yellow `#f5c542` strictly for warnings and orange for world/mood, otherwise "warning" loses meaning. Radiation dose is an invisible hazard: give it its own fixed hue plus an icon rather than reusing the warning yellow.
- Recommendation: define one semantic table (power, air, food, dose, comms, warning, success) and keep it constant [see 2]; test it with children rather than assuming meaning.

## 2. Colour systems for games

- **Value before hue.** WCAG's contrast formula is built on relative luminance so that hue is "not a key factor"; people with colour-vision deficiency keep light-dark contrast perception, and hue/saturation have minimal effect on reading performance [2]. Practical test: convert a screenshot to greyscale; every resource and state must still be distinguishable.
- **Thresholds.** Text 4.5:1; large text (>= 18 pt, or 14 pt bold, about 24 px / 18.5 px) 3:1; incidental/decorative text exempt [2]. Non-text: UI components, state indicators and graphics needed to understand content need 3:1 against adjacent colours [7]. Resource bars and pixel icons count as graphics [7].
- **Not by colour alone.** Game Accessibility Guidelines (Basic): "Ensure no essential information is conveyed by a fixed colour alone"; Basic: "Provide high contrast between text/UI and background"; Intermediate: allow a high/low contrast choice [4]. XAG 103: express key cues through more than one sensory channel [5]. WCAG 1.4.1 requires the same for web content [3] (page opened, I did not re-read its detail).
- **Colour-blind-safe set.** Okabe-Ito is the standard recommendation [6]. The Jfly guide: colour-blind people confuse red/green and yellow/yellow-green but distinguish green from bluish green; they rely more on brightness and saturation; use vermilion (about #FF2000 vs pure red) because it stays visible to protanopes [6]. The eight Okabe-Ito hex values (black #000000, orange #E69F00, sky blue #56B4E9, bluish green #009E73, yellow #F0E442, blue #0072B2, vermilion #D55E00, reddish purple #CC79A7) are from my memory of the page's palette `[verify against Fig. 16]`. Viridis is a perceptually uniform sequential map designed for colour-blind readers, suited to continuous values (e.g. dose over time) [14] (vignette opened, only fetched).
- **Mapping to our palette.** Cyan `#83d9f4` ~ sky blue; teal `#5eead4` ~ bluish green; Mars orange ~ orange/vermilion; yellow `#f5c542` ~ yellow. Teal vs cyan are close in hue: if both are resource colours they need different icons/shapes and a luminance gap. Warning yellow vs Mars orange on a dusty overlay can converge, add an icon and a text label.
- **Saturation for focus.** Keep world art and floors low-saturation/low-contrast (already in house art rules) and spend saturated colour on the one thing the player must act on. `[practice, no study opened]`.
- **Dark UI.** Dark navy is fine for kids; risks are small light-on-dark text haloing and glow/bloom reducing small-text clarity. Use off-white text, not pure white, and avoid thin strokes. `[practice, unverified]`.
- **Consistency.** One resource = one colour + one icon on every screen (HUD, cards, debrief, charts). Cognitive-load and "gamer's brain" material stresses reducing the memory the player must spend decoding the UI [13].

## 3. Visual hierarchy, gestalt, attention

- The brain uses shortcuts and pattern-finding, so people miss things that do not match their expectations [13] (Hodent, Wason-task discussion, general game-UX framing). Design so the most important state (what is going wrong now) is the largest, highest-contrast element; use proximity and common regions (panels) to group related resources; align and repeat layouts across sols.
- Attention guidance: size, contrast, position and motion draw attention; red/warm alert colour has a search advantage [1]. Glow and pulse help when used on ONE element that needs action; continuous glow on many elements destroys the signal and reads as "tacky". `[practice]`.
- Clutter: I found no peer-reviewed numeric limit for kids. Heuristic: one focal point, <= 4 resource meters visible, <= 3 primary choices per decision, everything else behind a tap. `[weak, heuristic]`. Cognitive-accessibility guidance for simple, predictable layouts is in the W3C COGA document [15] (opened; I read only its scope).
- Pixel art specifics: 1 px ink outline plus 2-4 shades per material gives strong silhouettes at small size (project house style). Floors low-contrast so characters pop.

## 4. Iconography for children

- Pair every icon with a text label, at least where the concept is new (dose, comms delay). Icons alone are ambiguous; XAG 103 and GAG both push redundant channels [4][5].
- Icon contrast: icons that are needed to understand state need 3:1 against their background [7]. Do not rely on the 1 px outline alone on busy backgrounds.
- Size: 16x16 is the minimum readable pixel icon; draw at 16 or 24 and scale by integer factors (2x/3x) to keep pixels crisp. Replace emoji with pixel icons AND keep them consistent in outline, palette and perspective. `[practice, no source opened]`.
- Brown & Anthony (children 7-11) report that kids' touch behaviour drives the need for larger interface icons [8].
- Consistency: same silhouette and colour for the same resource across HUD, cards and debrief; do not reuse one icon for two concepts.

## 5. Typography

- Rello & Baeza-Yates (ASSETS 2013, 48 participants with dyslexia, 12 fonts, eye tracking): sans-serif, monospaced and roman styles improved performance over serif; italics reduced readability; Helvetica, Courier, Arial, Verdana, CMU recommended; OpenDyslexic gave no improvement and participants preferred Verdana/Helvetica [10]. `[Source: search-result summary only, PDF blocked; verify before quoting. Sample is adults/teens with dyslexia, not 7-12 specifically.]`
- BDA style guide: I could not open it (404). Commonly cited advice (sans-serif, 12-14 pt, wide spacing, left-aligned, avoid italics/underline, off-white backgrounds) is `[unverified]`.
- Size: WCAG treats about 24 px (18 pt) or 18.5 px bold as "large" [2]. GAG Basic: "Use an easily readable default font size"; Advanced: allow font-size adjustment [4]. Practical floor for kid body text: 16 px absolute minimum, 18-20 px preferred; board mode larger. `[practice]`.
- Line length 45-75 characters and left-aligned, line height >= 1.4, short sentences (project rule); `[practice, unverified]`.
- Cyrillic: Nunito has Cyrillic; verify **Pixelify Sans** Cyrillic coverage in the build, and fall back for headings otherwise. Bulgarian text is typically 10-20% longer than English in UI, so test button/label overflow. Bulgarian italics/cursive forms differ (locl) but we avoid italics anyway. `[practice]`.
- Pixel fonts are low-legibility for long reading: headings and short labels only (our plan). Body = Nunito bold.
- Never put body text over the dust overlay without a solid or semi-opaque panel behind it (see 6).

## 6. Animation, feedback, photosensitivity, overlays

- **Reduced motion.** `prefers-reduced-motion` signals the user wants less non-essential motion; baseline-widely-available since Jan 2020 [11]. GAG: option to turn off background movement (Intermediate), avoid sudden unexpected movement (Advanced) [4].
- **Flashing.** WCAG 2.3.1: no more than three flashes in any one second, or below the general/red flash thresholds `[unverified: page blocked]`. GAG: "Avoid flickering images and repetitive patterns" (Basic) [4]. Safe rule: no flash at all on full-screen effects; slow fades only. Kids' photosensitive epilepsy risk is highest in this age band `[unverified]`.
- **Juice.** Short (150-300 ms) easing, a small scale pop, a particle burst on success, a count-up on scores: all fine. Success needs an additional sound/text cue, not colour alone [5]. Keep failure feedback gentle and explanatory ("no choice is free"), not punishing.
- **Dust-storm overlay.** Goals: exciting but not scary or unreadable. Recipe `[design recommendation]`: (1) overlay is a low-opacity orange-brown haze with slow drifting noise, not a strobe or hard shake; (2) HUD, text panels and icons sit ABOVE the overlay (z-index) on solid or >= 90% opaque panels so 4.5:1 holds; (3) a visible "Storm" icon + label so meaning is not colour alone; (4) an explicit way to see what the storm costs (e.g. power meter drops with labelled numbers); (5) reduced-motion = static tint; (6) fade in over >= 1 s, fade out likewise; (7) never cover the primary action button.
- Measure contrast with the overlay ON; luminance of a warm haze is close to the yellow warning colour, so yellow-on-haze text often fails.

## 7. Layout for big screens vs phones; touch targets

- WCAG 2.5.8 (AA, 24x24 CSS px minimum) and 2.5.5 (AAA, 44x44) `[unverified: page blocked]`. For children, the evidence says bigger: Brown & Anthony, children 7-11 had touches off-target 46% of the time vs 32% for adults [8]. NN/g recommends 2 cm x 2 cm targets for young children (4x the 1 cm adult recommendation), and notes a 5 mm close button defeated two 7-year-olds [9] (NN/g's guidance targets ages ~3-5, so ages 7-12 can use smaller but still generous targets; flag as extrapolation). Project rule 44/48 px is a defensible floor; consider 56-64 px for primary actions on phones.
- Also: keep adequate spacing between targets and edge padding (Woodward et al. found edge padding and age significantly affected misses, search-result summary only, not opened) `[weak]`.
- Classroom boards: viewing distance is large; scale text and icons up (>= 1.5x), use high contrast (boards wash out), avoid thin 1 px lines for essential info, and make key states readable from the back of the room (state word + icon + colour). Test by shrinking the screenshot to 25%.
- Phones: portrait 390x844, thumb-reachable primary actions at the bottom, no hover-only information, allow pinch/system text scaling (GAG: allow interfaces to be resized, Intermediate [4]).
- Pixel art scaling: integer scale factors only, `image-rendering: pixelated`.

## (c) AUDIT CHECKLIST (one game screen or mission)

Severity: B = blocker, M = major, m = minor. Citation in brackets.

1. [B] Normal text (< 24 px, non-bold) has contrast >= 4.5:1 against its actual background. [2]
2. [B] Text placed over the dust-storm overlay (overlay ON) still has >= 4.5:1. [2]
3. [M] Large text (>= 24 px or >= 18.5 px bold) has >= 3:1. [2]
4. [B] No information (resource state, warning, success, storm) is carried by colour alone; each has an icon, shape or text. [3][4][5]
5. [M] Icons, bars, meters and state markers have >= 3:1 against adjacent colours. [7]
6. [M] Focus rings / selected states are visible at >= 3:1 against the background. [7]
7. [M] Each resource (power, air, food, dose, comms) uses the same colour on every screen. [13]
8. [M] Each resource also uses the same icon and label wording on every screen. [13]
9. [M] The warning yellow is not used for any non-warning purpose. [1] `[design inference]`
10. [M] Greyscale screenshot: all resources and warnings still distinguishable. [2][6]
11. [M] Colours for categories come from a colour-blind-safe set (Okabe-Ito or equivalent) and are verified with a CVD simulator. [6]
12. [m] No pure red/green pair or green/yellow-green pair used to separate two meanings. [6]
13. [M] Teal and cyan (if both used) differ in icon and luminance. [6]
14. [B] No element flashes more than 3 times per second; no full-screen flashing at all. [12] `[unverified]` [4]
15. [B] With `prefers-reduced-motion: reduce`, the storm overlay, shakes, parallax and looping animation become static or fade-only. [11]
16. [M] The storm overlay fades in/out over >= 1 s and does not shake the screen by default. [4]
17. [B] The storm overlay never covers or blocks the primary action button or HUD. [4]
18. [M] The storm is named with a text label and icon, and its game effect is stated with numbers/words. [5]
19. [M] There is exactly one focal point per screen (largest/highest-contrast element = what the player should do next). [13]
20. [m] At most 4 resource meters are visible at once; further detail is behind a tap. [heuristic, weak]
21. [m] At most 3 primary choices per decision, each with a clear label. [15] heuristic
22. [M] Every icon that introduces a new concept has a visible text label. [4][5]
23. [m] Pixel icons are drawn at 16 or 24 px and scaled by integer factors; outline `#080B12` applied consistently. [project style]
24. [m] No emoji and pixel icon mixed for the same concept. [13]
25. [B] Body text >= 16 px (>= 18 px recommended) at default zoom on phone. [4] `[practice]`
26. [M] Body text uses Nunito (sans-serif); no italics, no long all-caps text. [10] `[weak]`
27. [M] Pixelify Sans appears only in titles and short labels (<= 3 words). [practice]
28. [M] Line length 45-75 characters; left-aligned; line height >= 1.4. `[unverified]` [10]
29. [B] Cyrillic glyphs render in the same font family (no fallback tofu or mismatched font) for every string, including the title. [practice]
30. [M] Bulgarian strings do not overflow, truncate or wrap awkwardly in buttons/labels. [practice]
31. [B] All touch targets >= 44 px (>= 48 px on touch devices) with >= 8 px spacing. [8][9] `[44 unverified]`
32. [M] Primary actions for ages 7-9 are >= 56 px and not within 8 px of the screen edge. [8][9]
33. [m] Close/dismiss buttons are not smaller than other targets. [9]
34. [M] Layout works at 390x844 and 1440x900 without horizontal scroll; text can be zoomed to 200%. [4]
35. [M] Board mode: key states readable at 25% scale of a screenshot. [practice]
36. [M] Success and failure feedback has text plus another channel (icon/sound), not colour alone. [5]
37. [m] Juice animations are <= 300 ms and skippable; particle effects do not hide text. [4]
38. [M] A setting for high contrast and a way to reduce motion exists in the UI, not only via the OS. [4]
39. [m] The same screen passes a kid playtest: a 9-year-old can say what each colour means without being told. [1] (colour meaning is learned)

## (d) References

OPENED means the page was fetched and I read relevant text. SNIPPET means only a search-result summary was seen. NOT OPENED means unreachable.

1. Elliot, A. J. (2015). Color and psychological functioning: a review of theoretical and empirical work. Frontiers in Psychology 6:368. https://www.frontiersin.org/articles/10.3389/fpsyg.2015.00368/full (OPENED)
2. W3C. Understanding SC 1.4.3 Contrast (Minimum). https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html (OPENED)
3. W3C. Understanding SC 1.4.1 Use of Color. https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html (fetched, skimmed only)
4. Game Accessibility Guidelines, full list. https://gameaccessibilityguidelines.com/full-list/ (OPENED)
5. Microsoft. XBOX Accessibility Guideline 103: Additional channels for visual and audio cues. https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/103 (OPENED; goal and overview read only)
6. Okabe & Ito. Color Universal Design (CUD). https://jfly.uni-koeln.de/color/ (OPENED)
7. W3C. Understanding SC 1.4.11 Non-text Contrast. https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html (OPENED)
8. Brown, Q. & Anthony, L. (2012). Touch and gesture interaction of children vs adults, CHI EA. https://lisa-anthony.com/wp-content/uploads/2012/03/brown-and-anthony-chi2012eist.pdf (OPENED; 46% vs 32% off-target figure; ages 7-11)
9. Nielsen Norman Group. Children's UX: physical development. https://www.nngroup.com/articles/children-ux-physical-development/ (OPENED; 2 cm x 2 cm figure)
10. Rello, L. & Baeza-Yates, R. (2013). Good Fonts for Dyslexia. ASSETS '13, DOI 10.1145/2513383.2513447. Summary via search (SNIPPET). PDF blocked (403): https://typeset.io/pdf/good-fonts-for-dyslexia-2debffz8dl.pdf
11. MDN. prefers-reduced-motion. https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion (OPENED)
12. W3C. WCAG 2.2 SC 2.3.1 Three Flashes or Below Threshold. https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html (NOT OPENED, connection failed)
13. Hodent, C. The Gamer's Brain (book site / article). https://celiahodent.com/the-gamers-brain/ (OPENED, only the cognition/shortcuts passage read; the book itself not read)
14. viridis vignette. https://cran.r-project.org/web/packages/viridis/vignettes/intro-to-viridis.html (fetched, not read in detail)
15. W3C. Making Content Usable for People with Cognitive and Learning Disabilities (COGA). https://www.w3.org/TR/coga-usable/ (OPENED, scope only)
16. NOT OPENED, mentioned from memory only: WCAG 2.5.8 / 2.5.5 target size; BDA dyslexia style guide (URL 404); Xbox XAG 102 (timeout); Woodward et al. CHI 2016 (search snippet only).

### Gaps to close next
- Open WCAG 2.3.1 and 2.5.8 pages (they timed out) and the Rello PDF.
- No peer-reviewed number was found for "max items on screen" or for pixel-icon minimum size; those checks are marked as heuristics.
- No Bulgarian-specific colour-meaning data; test with local children.

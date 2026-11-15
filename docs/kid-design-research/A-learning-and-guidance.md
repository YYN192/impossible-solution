# A. How children 7-12 learn from games, and how to portray and guide ideas

Research note for "The Impossible SOLution". Compiled 15 Nov 2026.

**Evidence grading.** [F] = I fetched and read the page. [S] = I only saw a search-result summary of the source (the PDF or page itself was blocked or unreadable), so treat as weaker. [G] = general developmental/design knowledge with no source opened; marked "(uncited)" and not to be quoted as fact. Several publisher sites (most of nngroup.com, Wikipedia, PMC) blocked fetching; NN/g "kids cognition" was readable.

## (a) Executive summary

1. Design quality matters as much as the medium: games beat non-game teaching (g ~ 0.33), and schematic, uncluttered visuals did as well as or better than flashy ones [4][5].
2. Repeated sessions beat one-off play, so replayability and short repeatable sols are a learning feature, not just a retention trick [5].
3. Ages 7-8 reason logically only about concrete, visible things and take instructions literally; ages 11-12 begin hypothetical reasoning. Build every idea concretely first, add abstraction (rates, probabilities) for the older band [1][7].
4. Show causes: animate the domino chain, name the objective, and never show an unexplained number (a 7-year-old was confused by exactly that) [1].
5. Probability and risk: children aged 7-11 judge risk differently depending on format; use counts/pictures ("3 of 10 sols"), not bare percentages [12 S].
6. Guidance: pre-teach terms (pre-training), segment into user-paced chunks, cut seductive details; fade worked examples as skill grows [9][14].
7. Hint ladders get gamed: in one study students viewed 68% of earlier hint levels for under 1 s; keep early hints short and make the final answer cost an attempt [11 S].
8. Failure that teaches (try first, explain after) has a moderate benefit (g ~ 0.36) but educational audiences tolerate failure less than gamers, so keep failure cheap and replay instant [10 S][18].
9. Tangible, expected rewards can undermine intrinsic motivation; effort-praise and story/curiosity rewards are safer than points-for-everything [6 S][2].
10. Accessibility is cheap and mandatory: never rely on colour alone (about 8% of boys), dyslexia-friendly type, adjustable controls, reduced motion, tested EN and BG strings [15][16][17].

## (b) Findings

### 1. Developmental differences by age band

**7-8 (early concrete-operational).**
- Logic works on concrete materials or pictures of them; abstract or hypothetical ideas are hard [7 S].
- Instructions are taken literally; a 7-year-old abandoned her preferred input because the text named a different device. Do not name devices ("click"); say "choose" [1].
- Seven-year-olds were confused by an unexplained number because the game never stated its objective [1].
- Spontaneous verbal rehearsal only emerges reliably around age 7, so memory strategies are fragile; keep to 2-3 things in mind [8 S].
- Reading: second-grade text is mostly 6-12-word sentences (practitioner estimate, weak) [21 S]. Support with icons, sound, characters rather than text [2].
- Motor: under-9s lean towards trackpad over mouse [1]. A 75x75 px target is recommended by one practitioner (not peer-reviewed) [2]; the project's 44/48 px minimum is the floor, 64+ px is safer for 7-8.

**9-10.**
- Concrete logic is solid; they can infer, but still prefer examples to rules [1][7 S].
- Probability understanding develops slowly: one study finds growth spurts at ages 8-9 and 11-12; boundaries come from a single study (weak) [12 S].
- Children aged 6-11 under-use probability information when making reward decisions (risk-seeking), unlike adults; attributed to integrating value and probability, not to misjudging probability itself [12 S].
- Error prevention matters (8-year-olds got stuck on a zero-result misspelling) [1]: avoid free-text input.

**11-12.**
- Hypothetico-deductive reasoning (controlled variables, "what if I change only X") emerges; Piaget's boundaries are contested and not fixed or universal [7 S].
- In one study, a simulation improved some systems-thinking skills of 11-12-year-olds but not feedback-loop thinking; do not assume loops are obvious [13 S].
- Dislike being patronised; keep tone respectful [2].

**All ages.**
- Working memory is smaller than adults'; self-explanatory interfaces and error prevention reduce frustration [1]. Whether capacity or knowledge/strategies drive the growth from 7 to 12 is debated [8 S]. Practical upshot: chunk, and offload memory onto the screen.
- A few years make a big difference; a design that works for one age may fail for another [1]. Friedman recommends designing for a two-year range [2]. For a 7-12 game, offer an age/"easy-hard" selector or adaptive layers rather than one mid-level.
- Attention: children quit when bored or when progress is slow and need steady small achievements [2]. No hard minute figures were found; session lengths are [G] (uncited): 3-5 min per sol for 7-8, up to 8-10 for 11-12.

### 2. Portraying abstract ideas

- **Show the objective first and label every number.** Unexplained numbers confuse 7-year-olds [1]. Each bar gets an icon, a name, and a goal zone.
- **Concrete metaphors beat explanations.** Familiar real-world metaphors help most [1]. Suggested (uncited): battery = drink bottle, air = balloon, food = plate, dose = "sunburn meter". Keep each metaphor consistent across missions.
- **Stocks vs flows.** In a 5th-grade study children tended to focus on stocks over flows, treat processes as sequential rather than simultaneous, and favour inflows over outflows; sound helped them perceive rate of change [13 S]. So show each resource as a tank with visible in-arrows and out-arrows, and let the player hear/see the rate.
- **Cause to effect ("domino" chains).** Under ~6, children miss subtle cues and explicit exaggerated cues work better [1]; for 7-12, animate each domino with a one-line caption linking cause and effect and let the player replay it. Keep chains to 3 links for 7-8 (uncited design inference).
- **Trade-offs ("no choice is free").** Show both sides of every option before commitment (gain and cost icons) and the result after. Oregon Trail's learning is mostly in the felt difficulty of decisions, not facts [22 S]. Educational sims can use invented numbers and still teach the how and why [18], but our game uses real data, so disclose game numbers.
- **Probability/risk.** Use formats children read well ("2 out of 10 sols", icon arrays, dice) rather than percentages alone; format significantly changed accuracy and confidence in 7-11-year-olds [12 S]. For storms show a forecast as a range band, and dose as a meter with safe / careful / danger zones.
- **Time delays.** No child-specific research found (gap). Practical approach (uncited): a visible timeline with a "message on its way" marker for comms delay; consequences shown at the next-sol summary, never silently.
- **Scientific uncertainty.** [G] (uncited) Use "likely" / "scientists think" with a simple badge; never hide that a forecast can be wrong.
- **"Saved data vs live".** Use a distinct label with an icon (satellite for live, camera/"snapshot" for saved), text like "Saved from 12 Nov", and differ by shape as well as colour [15][17]. Never describe a past event as upcoming (project rule).
- **Worked examples.** Early missions: a fully worked example (watch the first choice play out), then completion problems, then free choice [9 S].
- **Cut decoration that competes with learning.** Seductive details had negative effects (retention d = -0.30, transfer d = -0.48 in one summary) [14 S]. Simple schematic visuals did as well as complex ones [4][5].

### 3. Guidance

- **Onboarding.** Teach by doing in the first minute: one meaningful choice within ~60 s (target, uncited). Name the goal before the first action [1]. Pre-training: introduce each term and its icon before it is needed (median d = 0.75 across 16 studies in one summary) [14 S].
- **Segmenting.** User-paced chunks beat continuous streams (median d = 0.79) [14 S]. One idea per card, a "Next" button instead of auto-advance.
- **Just-in-time over up-front.** Explain a term at first use, in the same screen, with a tap to re-read. Cooney Center / Sesame work stresses tested scaffolding for children and for parents playing along [20 S].
- **Scaffolding and fading.** Worked examples help novices and can hurt as expertise grows (expertise reversal); adaptive fading beat fixed fading in a tutoring-software study (not child-specific) [9 S]. So: full guidance in sols 1-2, hints on request after that, then none; let experienced replayers turn guides off.
- **Hint ladders.** Students viewed 68% of hint levels before the last for under 1 second; in a geometry tutor about 36% of actions abused hints (14% counting rapid clicks as one) [11 S]. Design: level 1 = question/prompt, 2 = the relevant fact, 3 = the answer with its reason; add a short delay (e.g. 5 s, uncited) before the next level and require the child to choose the action themselves.
- **Feedback.** Children expect feedback on every action [2]. Give immediate light feedback (sound, bar movement) and deeper explanation at the sol summary (design inference; immediate-vs-delayed literature not retrieved: gap). Use explicit cues, not subtle ones [1].
- **Tone.** Verbal rewards tended to enhance intrinsic motivation, though they can still feel controlling [6 S]. Praise strategy ("you moved crew early and kept the air safe"), not ability.
- **Productive failure.** Problem-solving before instruction showed a moderate benefit (g 0.36, 53 studies; stronger with high design fidelity) [10 S]. But educational audiences tolerate failure less than game audiences [18]. So make a failed sol informative, cheap and replayable: "Replay this sol" and "What would have changed it?" after the debrief; avoid game-over.
- **Replay.** Multiple sessions gave better learning than a single session [5]. Seeded variety makes replays differ (project goal).
- **Avoid text walls.** Replace text with icons, sound and characters where possible [2]; no screen that needs scrolling to make a decision. The 12-word limit is a project target (uncited).
- **Character guide.** Explicit expressions and familiar characters help younger players [1] (no guide-specific effect evidence found). One recurring generic-cartoon guide delivers hints (project rule: no real likeness).
- **Parent/teacher support.** Co-play is under-supported; add a "play together" prompt and a short facilitator note [20 S].

### 4. Motivation

- **SDT (autonomy, competence, relatedness).** A meta-analysis of 128 experiments found tangible rewards undermined intrinsic motivation, while verbal rewards enhanced it; Cameron & Pierce dispute the effect size [6 S]. The 2001 education follow-up could not be read [6].
- **Autonomy:** real choices with real consequences; let the player choose the order of the sol's tasks.
- **Competence:** steady small achievements; kids quit when progress is slow [2]. Show mastery ("you protected the crew from 3 storms") rather than raw points.
- **Relatedness:** story and crew characters; co-play with a parent/teacher [20 S].
- **Extrinsic rewards.** They hold short-term attention but limit intrinsic motivation over time [2]. Adding points or badges to existing content is not the same as well-designed mechanics [5]. So: badges only for meaningful learning events, never for time spent, never a "do X to get a star" promise.
- **Curiosity hooks.** Real NASA events ("a real storm happened this week"), cliffhangers. [G] (uncited).
- **Session length.** No hard data retrieved; keep a sol short, auto-save, end on a clear stopping point (uncited).

### 5. Trade-off and systems games for kids

- Design determines efficacy as much as the medium, and polished graphics are not required [4][5].
- Worked: games that let students act as stakeholders in a system (SimCity, Civilization, Eco) teach relationships better than textbooks; the "how and why" matters more than exact facts [18]. Strong story arcs and consequential decisions were shared by early research-backed games [19]. Oregon Trail's strongest learning goal was the difficulty of the journey [22 S].
- Failed: drill dressed as a game [19]; copying RPG/shooter systems onto audiences with low failure tolerance [18]; games isolated from the lesson because "engagement" was their only value [18]; points and badges bolted onto worksheets [5].
- Curriculum-integrated play over at least three weeks improved factual knowledge, evidence use and engagement, and especially helped special-education and less-engaged students (1,000+ students, 13 teachers) [5]. For us: a teacher mode and a replay path.
- Mission US, Kerbal EDU and NASA's kids games: no outcome studies found (gap). No independent outcome data for SimCityEDU found [22 S].

### 6. Accessibility and inclusion

- **Colour-blindness:** about 8% of boys and 0.5% of girls [17 S]. Never convey essential information by colour alone; add symbols, patterns, text labels, numbers [15 S][17 S]. Crew colour codes and the Live/Cached/Snapshot badge need a shape or text channel too.
- **Dyslexia:** BDA guidance via secondary summaries: sans serif, 12 pt or larger, avoid italics and underlining, shorter sentences and paragraphs, clear headings; line-spacing and alignment values not verified [16 S]. Offer a font-size and spacing setting.
- **Motor:** allow remapped controls; every mini-task playable by keyboard only and by touch only; adjustable game speed; option to skip challenging sections (Xbox guideline) [15 S]. Large targets [2].
- **Attention/ADHD:** no time pressure by default; allow pause; adjustable difficulty during play; option to hide background movement; avoid flicker and repetitive patterns [15 S].
- **Bilingual EN/BG:** no source found on Cyrillic readability or text expansion (gap). [G] (uncited) Bulgarian strings tend to run longer; layouts must not use fixed widths; fonts need Cyrillic glyphs; term explanations should be written for BG, not literally translated; switching language must not reset progress. Keep reading level low in both languages (grade-3 text typically averages under ~19 words per sentence [21 S]).
- **Inclusion beyond disability:** special-education and less-engaged students benefited most from well-designed games [5]; do not assume a mouse or trackpad [1].

## (c) AUDIT CHECKLIST

Severity: B = blocker, M = major, m = minor. "Basis" gives the citation; [S] items are weaker evidence, [G]/"design inference" means no source opened.

| # | Check (yes/no) | Age | Sev | Basis |
|---|---|---|---|---|
| 1 | The mission goal is stated on screen before the first action, in one sentence of at most 12 words. | all | B | [1] |
| 2 | Every number or bar on screen has a name, an icon and a visible target/safe zone. | 7-8 | B | [1] |
| 3 | A first-time player reaches a meaningful choice within 60 s of starting. | all | M | [2][18] |
| 4 | Every new term is explained on the same screen in at most 12 words, with an icon. | all | B | [14 S][1] |
| 5 | A term is introduced before its first use (pre-training), not defined afterwards. | all | M | [14 S] |
| 6 | No instruction names a specific device ("click", "mouse"); verbs are "choose", "tap or press". | 7-8 | M | [1] |
| 7 | No guidance sentence exceeds 15 words; most are 6-12. | 7-8 | M | [21 S] |
| 8 | Sentences average at most about 19 words even in 11-12 text. | 11-12 | m | [21 S] |
| 9 | No screen needs more than 3 new ideas held in mind at once. | 7-8 | M | [1][8 S] |
| 10 | No decision requires free-text typing. | 7-8 | M | [1] |
| 11 | Each option shows both its gain and its cost before commitment. | all | B | project rule, [22 S] |
| 12 | Resources are shown as tanks/meters with visible inflow and outflow and the net change per sol. | 9-10 | M | [13 S] |
| 13 | A domino chain is shown step by step (at most 3 links for 7-8), each link captioned. | 7-8 | M | [1], design inference |
| 14 | The player can replay the cause-effect chain on request. | all | m | design inference |
| 15 | Risk is shown as "x out of 10" or icon counts, not as a percentage alone. | 7-8, 9-10 | M | [12 S] |
| 16 | Forecasts show a range or "likely", never one certain value, and say they can be wrong. | 11-12 | M | [G], science rules |
| 17 | Delayed consequences appear on a visible timeline and in the next-sol summary. | all | M | design inference (gap) |
| 18 | Saved data carries text AND a distinct icon/shape ("Saved from <date>") and is never worded as live. | all | B | [15][17], project rule |
| 19 | A past event is never described as upcoming. | all | B | project rule |
| 20 | No essential information relies on colour alone (crew colours, badges, meters). | all | B | [15 S][17 S] |
| 21 | Text is sans serif, at least 16 px, left-aligned, no italics/underline for emphasis, and can be enlarged. | all | M | [16 S] |
| 22 | Tap targets are at least 48 px (64 px recommended for 7-8) with spacing; no critical buttons on the bottom edge. | 7-8 | M | [2] |
| 23 | Every mini-task can be completed by keyboard alone and by touch alone. | all | B | [15 S] |
| 24 | There is no time pressure by default; a pause or slower-speed option exists. | all | M | [15 S] |
| 25 | Reduced motion is respected; no flicker or repetitive flashing patterns. | all | B | [15 S] |
| 26 | Every player action produces immediate visible or audible feedback. | all | M | [2] |
| 27 | After failure, feedback explains the cause in the child's terms and offers "try again" within 2 taps. | all | B | [10 S][18] |
| 28 | A failed sol has no game-over screen or blame wording; praise targets strategy, not ability. | all | M | [6 S][18] |
| 29 | Hint level 1 is a nudge or question; the answer appears only at the last level; early levels are short enough to read. | 9-10 | M | [11 S] |
| 30 | The next hint level is not available instantly (short delay or a required attempt). | 9-10, 11-12 | m | [11 S] |
| 31 | Guidance fades: full help in sols 1-2, on request afterwards, and the guide can be turned off on replay. | all | M | [9 S] |
| 32 | Decoration (animation, sound, character) that carries no information is absent or can be switched off. | all | m | [14 S][4] |
| 33 | Each text card has a user-paced "Next"; no auto-advancing text. | 7-8 | M | [14 S] |
| 34 | Rewards (stars, badges) mark learning events and are not announced as payment for an action. | all | M | [6 S][2][5] |
| 35 | The player makes at least one real choice (order or option) per sol, not just the same "assign crew" screen. | all | M | [5][18], project goal |
| 36 | Two replays of the same mission differ in a way the player can notice. | all | M | [5] |
| 37 | EN and BG strings both fit their containers at 200% text size without clipping, and BG was written (not just translated) at the same reading level. | all | M | [G], gap |
| 38 | The language toggle keeps progress and position. | all | m | [G] |
| 39 | Every number shown is either sourced or listed as a game number. | all | B | project rule |
| 40 | A teacher/parent note or "play together" prompt exists for the mission. | 7-8 | m | [20 S][5] |

## (d) References

Status: F = fetched and read; S = search-result summary only, or page unreadable (weaker).

1. NN/g, "Kids' Cognition and UX" https://www.nngroup.com/articles/kids-cognition/ [F]
2. Friedman, "A Practical Guide To Design For Children" https://smart-interface-design-patterns.com/articles/design-guidelines-children/ [F; practitioner, not peer-reviewed; cites Gelman, Seoane]
3. NN/g, "Children's UX: Physical Development" https://www.nngroup.com/articles/children-ux-physical-development/ [S; blocked; not used for any claim above]
4. Clark, Tanner-Smith & Killingsworth (2016), "Digital Games, Design, and Learning", Review of Educational Research, SRI page https://sri.com/publication/digital-games-design-and-learning-a-systematic-review-and-meta-analysis-executive-summary/ [F, abstract only; g = 0.33 from search summary S]
5. Joan Ganz Cooney Center, "Can Typical Educational Games Support Learning Within Curriculum?" https://joanganzcooneycenter.org/?p=16779 [F]
6. Deci, Koestner & Ryan (1999), Psychological Bulletin 125(6), 627-668; and (2001) https://www.selfdeterminationtheory.org/SDT/documents/2001_DeciKoestnerRyan.pdf [S; PDF unreadable]
7. Piaget stage summaries https://openbooks.library.baylor.edu/lifespanhumandevelopment/chapter/middle-childhood-cognition/ ; Amsel & Moshman (2015) https://faculty.weber.edu/eamsel/Vita/Amsel%20&%20Moshman%20(2015).pdf [S]
8. Working memory: Macken https://orca.cardiff.ac.uk/id/eprint/128901/1/Macken.%20Does%20short-term%20memory.pdf ; Cowan (2016) https://memory.psych.missouri.edu/assets/doc/articles/2016/cowan-pps-2016-working-memory-maturation.pdf [S]
9. Salden et al., adaptive fading / expertise reversal https://link.springer.com/doi/10.1007/s11251-009-9107-8 [S; page failed to load]
10. Sinha & Kapur (2021), Review of Educational Research, abstract mirror https://www.x-mol.com/paper/1406031499744456704 [S]
11. LearnLab, "Help abuse" https://learnlab.org/research/wiki/index.php/Help_abuse ; Aleven et al. (2006, 2016) [S]
12. Ulph et al. (2009), "How should risk be communicated to children" https://pmc.ncbi.nlm.nih.gov/articles/PMC2698821/ ; Figner & Schaub; Zikun, ICME-13 [S; fetch redirected, not read]
13. System-thinking with children: https://core.ac.uk/download/4404009.pdf ; https://proceedings.systemdynamics.org/2015/proceed/papers/P1286.pdf (Zuckerman & Resnick System Blocks) [S]
14. Mayer multimedia principles: https://ksvi.mff.cuni.cz/amulab/wp-content/uploads/2018/11/MultimLn3_BromHannemann_181117.pdf ; https://services.dartmouth.edu/TDClient/1806/Portal/KB/PrintArticle?ID=171655 [S; not child-specific]
15. Game Accessibility Guidelines https://gameaccessibilityguidelines.com/basic/ and /intermediate/ [S]
16. British Dyslexia Association https://www.bdadyslexia.org.uk/advice/educators/teaching-for-neurodiversity/creating-dyslexia-friendly-resources ; Ako Aotearoa https://ako.ac.nz/assets/Knowledge-centre/ALNACC-Resources/Dyslexia-resources/230907-Dyslexia-Friendly-Style-Guide.pdf [S]
17. Eduqas, "Colour blindness in the classroom" https://www.eduqas.co.uk/articles/colour-blindness-in-the-classroom-5-ways-to-help-learners-with-cvd/ [S]
18. Game Developer, "The state of educational games in the Minecraft era" https://www.gamedeveloper.com/business/the-state-of-educational-games-in-the-i-minecraft-i-era [F]
19. EdSurge, "Reflections on 50 years of Game-Based Learning, Part 2" https://edsurge.com/news/2022-11-21-reflections-on-50-years-of-game-based-learning-part-2 [F; says little about Oregon Trail/SimCity mechanics]
20. Joan Ganz Cooney Center well-being and ScratchJr materials https://joanganzcooneycenter.org/wp-content/uploads/2024/01/jgcc_understandingwellbeing.pdf ; https://joanganzcooneycenter.org/wp-content/uploads/2023/06/jgcc_sandbox_scratchjr.pdf [S]
21. Reading levels: TextProject https://textproject.org/wp-content/uploads/papers/Mesmer-Hiebert-Cunningham-and-Kapania-One-size-fit-all.pdf ; https://readabilityformulas.com/writing-for-2nd-grade-readers/ [S; practitioner figures, weak]
22. SIGCIS, "Where on the Oregon Trail is SimCity?" https://www.sigcis.org/node/371 [fetch returned 404; claims from search summary only, S]

**Gaps:** child-specific research on delayed consequences and scientific uncertainty; Bulgarian/Cyrillic readability; Mission US / Kerbal EDU / NASA kids games outcomes; immediate vs delayed feedback (Shute); attention-span and session-length data; the primary NN/g age-band articles and the BDA 2023 style guide text.

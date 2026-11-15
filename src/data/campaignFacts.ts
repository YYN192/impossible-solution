/**
 * Real facts behind the storm pool and the campaigns, for the Data Sources screen.
 * Checked by the science-checker agent and re-measured from NASA RadLab on 14–15 Nov 2026.
 */
import type { DataRef } from "../sim/types";
import { ARTEMIS_REGIONS, CRATER_MAY2024, INSIGHT_POWER, INSIGHT_SAND, MOON_DELAY, OPPORTUNITY_2018, REMS_NIGHT, WIND_CLEANING } from "./campaigns";
import type { RealFact } from "./sources";
import { RADLAB_MEASURED, STORMS } from "./storms";
import snap from "./snapshots/dsn-mars.json";

const dated = (ref: DataRef): RealFact["ref"] => ({ ...ref, fetched: ref.fetched ?? RADLAB_MEASURED });
const [may2024, sep2017, oct2021] = STORMS;
const RADLAB: DataRef = {
  label: "NASA OSDR RadLab, Curiosity's radiation detector on the Mars surface (MSL-RAD-Surface), read by us",
  url: "https://visualization.osdr.nasa.gov/radlab/gui/",
  mode: "snapshot",
  fetched: RADLAB_MEASURED,
};

export const CAMPAIGN_FACTS: RealFact[] = [
  {
    id: "peak-may2024",
    what: "The worst hour of the 20 May 2024 storm on Mars",
    value: `About 304 micrograys per hour, against about 4 just before the storm: about 74 times. Flare class: ${may2024.flare}. DONKI event ${may2024.activityId}`,
    usedFor: "Why this is the game's huge storm. Kids read “more than 50 times stronger than usual”.",
    ref: dated(RADLAB),
  },
  {
    id: "storm-sep2017",
    what: "The solar storm of 10–11 September 2017, measured on Mars",
    value: `Worst hour 23.2 micrograys per hour against about 7.9 before: about 3 times. Flare class ${sep2017.flare}. DONKI event ${sep2017.activityId}`,
    usedFor: "A small storm in the storm pool",
    ref: dated(RADLAB),
  },
  {
    id: "cloud-sep2017",
    what: "The storm cloud of 10 September 2017",
    value: "Forecast to brush past Mars on 13 September 2017 (a glancing blow)",
    usedFor: "The storm cloud that follows the September 2017 burst",
    ref: dated(sep2017.cloud!.ref),
  },
  {
    id: "storm-oct2021",
    what: "The solar storm of 28–29 October 2021, measured on Mars",
    value: `Worst hour 25.8 micrograys per hour against about 8.5 before: about 3 times. Flare class ${oct2021.flare}. DONKI event ${oct2021.activityId}. The forecast names no storm cloud reaching Mars`,
    usedFor: "A small storm in the storm pool, with no storm cloud after it",
    ref: dated(RADLAB),
  },
  {
    id: "delay-today",
    what: "Radio delay to Mars right now",
    value: "Half the round-trip light time of a Mars spacecraft link. Saved reading of 14 Nov 2026: 1,320 seconds there and back, 11 minutes each way",
    usedFor: "Ask Earth and the radio beat say how long the message took today (live when our server answers, otherwise this saved reading)",
    ref: { label: "NASA Deep Space Network Now", url: "https://eyes.nasa.gov/dsn/dsn.html", mode: "snapshot", fetched: snap.fetchedAt },
  },
  { id: "insight-power", what: "Dust on InSight's solar panels", value: INSIGHT_POWER.value!, usedFor: "Dust Season: why dust is the main danger; the Elysium Planitia site", ref: dated(INSIGHT_POWER) },
  { id: "insight-sand", what: "InSight's sand trick (May 2021)", value: INSIGHT_SAND.value!, usedFor: "Dust Season: the wipe-the-panels beat and the ending card", ref: dated(INSIGHT_SAND) },
  { id: "opportunity-2018", what: "The 2018 dust storm around the whole planet", value: "Opportunity's last message came on 10 June 2018", usedFor: "Dust Season: one of the two real dust storms. Its power cut in the game is a game number", ref: dated(OPPORTUNITY_2018) },
  { id: "wind-cleaning", what: "Wind that cleans solar panels", value: "Gusts blew dust off the panels of Spirit and Opportunity", usedFor: "Dust Season: the Meridiani Planum site and the dust-devil choice", ref: dated(WIND_CLEANING) },
  { id: "rems-night", what: "A night in Gale Crater", value: `${REMS_NIGHT.value}, the coldest reading of the sol, on 25 August 2026 (the newest reading in the feed; not live)`, usedFor: "Dust Season: the Gale Crater site and the cold-night choice", ref: dated(REMS_NIGHT) },
  { id: "artemis-regions", what: "Landing regions near the Moon's south pole", value: "13 candidate regions (19 Aug 2022), among them Malapert Massif, Peak Near Shackleton and Haworth; chosen for sunlight, talking with Earth and nearness to shadowed craters", usedFor: "South Pole Outpost: the three sites. NASA gives no numbers per region, so the site numbers are game numbers", ref: dated(ARTEMIS_REGIONS) },
  { id: "crater-may2024", what: "The 20 May 2024 storm seen from the Moon's orbit", value: "12.3 → 15.7 micrograys per hour: about 1.3 times its usual level (a different detector from Curiosity's, so only compared with itself)", usedFor: "South Pole Outpost: the sky-watch day. The storm pointed at Mars, not at the Moon", ref: dated(CRATER_MAY2024) },
  { id: "moon-delay", what: "Radio delay to the Moon", value: MOON_DELAY.value!, usedFor: "South Pole Outpost: Earth answers at once", ref: dated(MOON_DELAY) },
];

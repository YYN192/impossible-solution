# DONKI WSA-Enlil check (Sat 14 Nov, fetched live with DEMO_KEY)

Query: https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=2024-05-19&endDate=2024-05-23

- CME 2024-05-20T05:36Z (the far-side X-class event Curiosity measured): sims WSA-ENLIL/31037/1 and 31038/1 list impacts at **Solar Orbiter** (21 May 06:05–06:12Z) and **Juno** (31 May) — **no Mars impact listed**. The 8.1 mGy at Curiosity came from fast particles (SEP), which arrived in tens of minutes. → Don't claim a "CME shock at Mars a day later" for this event.
- CME(s) 2024-05-23T04:24–13:25Z: sim WSA-ENLIL/31103/1 lists **Mars, arrival 2024-05-28T11:30Z** (~5 days later), plus OSIRIS-APEX and Parker Solar Probe.

**Consequence for the design (honest two-hazard model):**
1. Particle burst (SEP) → minutes → no warning possible; crew must react on their own. Data: 20 May 2024, Curiosity RAD 8.1 mGy.
2. CME cloud → days → Earth's forecast (WSA-Enlil impactList contains "Mars") can warn you ahead. Data: 23 May → Mars 28 May 2024.
"Ask Earth": the radio signal takes 3–22 min (arrives within the same shift); what Earth sends back is a **forecast for the coming days**. Cost: one astronaut spends the shift on the radio.
Live mechanic: filter live DONKI WSA-Enlil sims for impactList.location == "Mars"; if none in the last 30 days, use the May 2024 snapshot and say so.

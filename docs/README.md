# Documentation map

These documents belong to the standalone public game repository. This index describes how each group should be used; historical records stay unchanged even when the implementation moves on.

## Living reference

- [`data-pipeline.md`](data-pipeline.md) — current data sources, ingestion commands, validation rules, refresh schedule and known outages. Update it when the pipeline changes.
- [`README.md`](../README.md) — contributor setup, commands and the current high-level project map.

## Product concept

- [`concept.md`](concept.md) — the selected game concept, audience, core loop and intended evidence chain. It explains the product direction; verify implementation details against the code and living references.

## Compliance record

- [`ai-usage-log.md`](ai-usage-log.md) — append-only record of AI-assisted work required for attribution and challenge compliance.
- [`CREDITS.md`](../CREDITS.md) — project-level attribution, licences and data-source credits.

## Historical planning

- [`idea-forge.md`](idea-forge.md) — timeboxed concept exploration and scoring.
- [`plan.md`](plan.md) — the original event build plan, roles and delivery gates. It is a historical schedule, not the current contributor guide.

## Decision archive

- [`council/`](council/) — advisor prompts, responses, peer reviews, fact checks and the resulting verdict. These files preserve the decision trail and are not living specifications.

## Deliverables

- [`team-brief.pdf`](team-brief.pdf) — shareable rendered team brief.
- [`team-brief.html`](team-brief.html) — source version of the team brief.

When documentation disagrees, use the living reference and current code for operational details. Preserve the historical planning and decision archive as records; add a new decision note instead of rewriting their conclusions.

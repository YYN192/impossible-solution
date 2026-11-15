// Types for the parsers shared by the ingest scripts (Node) and the live layer (browser).
// The shapes are checked at runtime by src/data/datasets.ts.
import type { ApodEntry, SpaceWeather, WeatherWeek } from '../../src/data/datasets'

export function summarizeSpaceWeather(
  raw: { flr: unknown; sep: unknown; cme: unknown; gst: unknown; notifications: unknown },
  window: { start: string; end: string },
  opts?: { missing?: string[] },
): SpaceWeather
export function weatherWeek(
  raw: { flr?: unknown; sep?: unknown; cme?: unknown; gst?: unknown },
  window: { start: string; end: string },
  opts?: { missing?: string[] },
): WeatherWeek
export function apodEntry(raw: unknown): ApodEntry
export function stripHtml(s: unknown): string
export function flareStrength(classType: unknown): number

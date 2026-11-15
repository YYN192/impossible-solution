import { useTranslation } from "react-i18next";
import palette from "../assets/pixel/palette.json";
import {
  engineeringGraphs,
  MAX_CELLS,
  type Graph,
} from "../data/engineeringGraphs";
import { DataChip } from "../screens/DataChip";
import HubDialog from "./HubDialog";

// 8×8 pixel icons in the game palette: a sun, a snowflake and a ray.
const C: Record<string, string> = {
  y: palette.yellow,
  o: palette.orange,
  w: palette.white,
  c: palette.cyan,
  b: palette.blue,
};
const ICONS: Record<Graph["id"], string[]> = {
  power: [
    "..y..y..",
    ".y.yy.y.",
    "..yooy..",
    "yyowwoyy",
    "yyowwoyy",
    "..yooy..",
    ".y.yy.y.",
    "..y..y..",
  ],
  cold: [
    "...cc...",
    "c..cc..c",
    ".c.cc.c.",
    "..cwwc..",
    "..cwwc..",
    ".c.cc.c.",
    "c..cc..c",
    "...cc...",
  ],
  rays: [
    "o.......",
    ".o...w..",
    "..o.w...",
    "...ow...",
    "..wwo...",
    ".w..o...",
    "w....o..",
    "......o.",
  ],
};
function PixelIcon({ id }: { id: Graph["id"] }) {
  return (
    <svg
      className="eng-icon"
      viewBox="0 0 8 8"
      width="28"
      height="28"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {ICONS[id].flatMap((line, y) =>
        [...line].map((p, x) =>
          p === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill={C[p]}
            />
          ),
        ),
      )}
    </svg>
  );
}

/** Graph values with a real minus sign, and "0.21" with a comma in Bulgarian. */
const num = (v: number, lng: string) =>
  v
    .toLocaleString(lng === "bg" ? "bg" : "en-GB", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    .replace("-", "−");

/**
 * The Engineering bay (#60): three chunky pixel graphs from saved NASA numbers. The picture teaches, each graph has
 * one short caption and its source chip. Bars fill in block by block (still when motion is reduced or calm).
 */
export default function EngineeringBay({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const tx = t as unknown as (key: string) => string; // keys built from the graph ids, all present in en.json and bg.json
  return (
    <HubDialog
      id="engineering"
      className="engineering"
      eyebrow={t("world.near.engineering")}
      title={t("engineering.title")}
      closeLabel={t("engineering.close")}
      onClose={onClose}
    >
      <p className="lead">{t("engineering.lead")}</p>
      <div className="eng-graphs">
        {engineeringGraphs().map((g) => (
          <section
            key={g.id}
            className="eng-graph"
            data-testid={`graph-${g.id}`}
            aria-labelledby={`eng-${g.id}`}
          >
            <div className="eng-head">
              <PixelIcon id={g.id} />
              <h3 id={`eng-${g.id}`}>{tx(`engineering.${g.id}.title`)}</h3>
            </div>
            <ul className="eng-bars">
              {g.bars.map((b) => (
                <li key={b.id} className="eng-bar" data-tone={b.tone}>
                  <span className="eng-label">
                    {tx(`engineering.${g.id}.${b.id}`)}
                  </span>
                  <span
                    className="eng-cells"
                    role="img"
                    aria-label={`${num(b.value, i18n.language)} ${b.unit}`}
                  >
                    {Array.from({ length: MAX_CELLS }, (_, i) => (
                      <i
                        key={i}
                        className={i < b.cells ? "on" : ""}
                        style={{ ["--i" as string]: i }}
                      />
                    ))}
                  </span>
                  <b className="eng-value">
                    {num(b.value, i18n.language)} {b.unit}
                  </b>
                </li>
              ))}
            </ul>
            <p className="eng-caption">{tx(`engineering.${g.id}.caption`)}</p>
            <DataChip source={g.source} />
          </section>
        ))}
      </div>
    </HubDialog>
  );
}

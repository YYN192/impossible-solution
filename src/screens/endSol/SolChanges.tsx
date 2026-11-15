import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../components/Icon";
import { reducedMotion } from "../../state/comfort";
import type { Change } from "./changes";

const FIRST_MS = 400; // the first badge, once the screen has settled
const STEP_MS = 700; // then one after another
const COUNT_MS = 500; // each number counts from before to after in this time
const fmt = (n: number) => String(Number(n.toFixed(1)));

/**
 * #65: the day's changes pop in one by one, each number counting up. Bad news shakes once in the warning
 * colour, good news sparkles, and every badge also says +/− and Good / Watch out (not colour alone).
 * "Show all", reduced motion and calm mode show everything at once.
 */
export function SolChanges({ changes }: { changes: Change[] }) {
  const { t } = useTranslation();
  const [instant, setInstant] = useState(reducedMotion);
  const [shown, setShown] = useState(instant ? changes.length : 0);
  const all = instant || shown >= changes.length;
  useEffect(() => {
    if (all) return;
    const next = setTimeout(() => setShown((n) => n + 1), shown ? STEP_MS : FIRST_MS);
    return () => clearTimeout(next);
  }, [shown, all]);
  if (!changes.length) return null;
  return (
    <section className="sol-changes" aria-labelledby="sol-changes-title">
      <h2 id="sol-changes-title">{t("endSol.changes.title")}</h2>
      <ul>{changes.slice(0, all ? changes.length : shown).map((c) => <Badge key={c.key} change={c} instant={instant} />)}</ul>
      {!all && <button type="button" onClick={() => setInstant(true)}>{t("endSol.changes.showAll")}</button>}
    </section>
  );
}

function Badge({ change: c, instant }: { change: Change; instant: boolean }) {
  const { t } = useTranslation();
  const [counted, setCounted] = useState(c.from);
  useEffect(() => {
    if (instant) return;
    const start = performance.now();
    const tick = setInterval(() => {
      const k = Math.min(1, (performance.now() - start) / COUNT_MS);
      setCounted(c.from + (c.to - c.from) * k);
      if (k === 1) clearInterval(tick);
    }, 50);
    return () => clearInterval(tick);
  }, [c.from, c.to, instant]);
  const value = instant ? c.to : counted;
  const diff = c.to - c.from;
  const verdict = t(c.good ? "endSol.changes.good" : "endSol.changes.bad");
  const name = t(`bars.${c.key}`);
  return (
    <li className={`sol-change ${c.good ? "good" : "bad"}`}>
      <Icon name={c.key} />
      <span aria-hidden="true">{name}</span>
      <b aria-hidden="true">{fmt(value)}</b>
      <span className="sol-change__diff" aria-hidden="true">{diff > 0 ? "+" : "−"}{fmt(Math.abs(diff))}</span>
      <span className="sol-change__verdict" aria-hidden="true"><Icon name={c.good ? "sparkle" : "warning"} />{verdict}</span>
      <span className="visually-hidden">{t("endSol.changes.sr", { name, from: fmt(c.from), to: fmt(c.to), verdict })}</span>
    </li>
  );
}

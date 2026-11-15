import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { audio } from "../game/audio";
import { DominoCard } from "../components/DominoCard";
import { ScreenFrame } from "../components/ScreenFrame";
import {
  helpTopicForDomino,
  helpTopicForEvent,
} from "../components/helpTopics";
import { WhatsThis } from "../components/WhatsThis";
import { tDynamic, tRun } from "../i18n/dynamic";
import { EarthAnswer } from "../components/EarthAnswer";
import { knownEvents } from "../sim/engine";
import { useGame } from "../state/game";
import { useMission } from "../state/mission";
import { useNav } from "../state/screen";
import { DataChip } from "./DataChip";
import {
  pickMorning,
  type Extra,
  type MorningReport,
} from "./morning/pickMorning";

/**
 * Morning report (#13): the domino that just fell comes first ("⚡↓ because 🧽✗"),
 * then at most one more sentence (today's storm or Earth's answer) with a real-data chip.
 */
export function MorningScreen() {
  const sol = useNav((s) => s.sol);
  const state = useGame((s) => s.state);
  const fell = useGame((s) => s.fell);
  const events = useMission((s) => s.setup?.events);
  const report = pickMorning({
    sol,
    fell,
    all: state.dominoes,
    // Bursts come without warning (the end-of-sol report shows them); clouds only once Earth warned.
    events: knownEvents(state, events ?? []),
    earthAnswer: state.earthAnswer,
  });
  return <MorningReportView sol={sol} report={report} />;
}

export function MorningReportView({
  sol,
  report,
}: {
  sol: number;
  report: MorningReport;
}) {
  const { t } = useTranslation();
  const next = useNav((s) => s.next);
  const setup = useMission((s) => s.setup);
  const moon = setup?.place === "moon" ? "moon" : undefined;
  const { headline, cause, extra } = report;
  const alert = extra?.kind === "event" ? extra.event.kind : extra?.kind;
  useEffect(() => {
    if (sol > 1) audio.playSfx("morning-report"); // sol 1 opens with the console boot sound
    if (!alert) return;
    const timer = setTimeout(() => audio.playSfx(alert === "particleBurst" ? "particle-burst" : alert === "stormCloud" ? "storm-warning" : "earth-message-receive"), 1300);
    return () => clearTimeout(timer);
  }, [sol, alert]);

  return (
    <ScreenFrame title={tRun("morning.heading", { sol }, moon)}>
      <p className="note">{tRun("common.solOf", { sol, total: setup?.rules.sols ?? 3 }, moon)}</p>

      {headline ? (
        <div className="fallen">
          <div className="fallen__row">
            <DominoCard domino={headline} fall />
            <DominoHelp textKey={headline.textKey} />
          </div>
          {cause && (
            <>
              <p className="because">{t("morning.because")}</p>
              <DominoCard domino={cause} />
            </>
          )}
        </div>
      ) : (
        <p className="lead">
          {sol === 1 ? t("morning.firstDay") : t("morning.nothingFell")}
        </p>
      )}
      {/* Sol 1: Pip's briefing for this campaign and the real thing behind it. */}
      {sol === 1 && setup && (
        <div className="campaign-ending">
          <p className="lead">{tRun(`campaign.${setup.campaignId}.brief`)}</p>
          <p><strong>{t("run.realThing")}:</strong> {tRun(`campaign.${setup.campaignId}.real`)}</p>
        </div>
      )}

      {extra && <ExtraLine extra={extra} />}

      <div className="actions">
        <button type="button" className="primary" onClick={next}>
          {t("morning.goPlan")}
        </button>
      </div>
    </ScreenFrame>
  );
}

/** "What's this?" for the science word behind the fallen domino (dust, power, air …). */
function DominoHelp({ textKey }: { textKey: string }) {
  const topic = helpTopicForDomino(textKey);
  return topic ? <WhatsThis topic={topic} /> : null;
}

function ExtraLine({ extra }: { extra: Extra }) {
  if (extra.kind === "event") {
    return (
      <div className="extra">
        <p className="lead">
          <span>{tDynamic(extra.event.captionKey)}</span>{" "}
          <WhatsThis topic={helpTopicForEvent(extra.event.kind)} />
        </p>
        <DataChip source={extra.event.source} />
      </div>
    );
  }
  return (
    <div className="extra">
      <EarthAnswer answer={extra.answer} />
      <WhatsThis topic="askEarth" />
    </div>
  );
}

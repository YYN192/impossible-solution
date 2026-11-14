import { useTranslation } from "react-i18next";
import { DominoCard } from "../components/DominoCard";
import { ScreenFrame } from "../components/ScreenFrame";
import {
  helpTopicForDomino,
  helpTopicForEvent,
} from "../components/helpTopics";
import { WhatsThis } from "../components/WhatsThis";
import { tDynamic } from "../i18n/dynamic";
import { MISSION_SOLS } from "../sim/types";
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
    events: events ?? [],
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
  const { headline, cause, extra } = report;

  return (
    <ScreenFrame title={t("morning.heading", { sol })}>
      <p className="note">{t("common.solOf", { sol, total: MISSION_SOLS })}</p>

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
  const { t } = useTranslation();
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
  const { answer } = extra;
  const storm =
    answer.stormCloudInSols === undefined
      ? t("earth.storm.none")
      : t("earth.storm.coming", { count: answer.stormCloudInSols });
  return (
    <div className="extra">
      <p className="lead">
        <span>
          {t("earth.answer", {
            dust: t(`earth.dust.${answer.dustTomorrow}`),
            storm,
          })}
        </span>{" "}
        <WhatsThis topic="askEarth" />
      </p>
      <DataChip source={answer.source} />
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { tDynamic } from "../i18n/dynamic";
import { MISSION_SOLS } from "../sim/types";
import { useNav } from "../state/screen";
import { DataChip } from "./DataChip";
import { DominoCard } from "./DominoCard";
import { fakeMorning } from "./fakeGame";
import {
  pickMorning,
  type Extra,
  type MorningReport,
} from "./morning/pickMorning";
import { ScreenFrame } from "./ScreenFrame";

/**
 * Morning report (#13): the domino that just fell comes first ("⚡↓ because 🧽✗"),
 * then at most one more sentence (today's storm or Earth's answer) with a real-data chip.
 */
export function MorningScreen() {
  const { sol } = useNav();
  // TODO(engine): replace fakeMorning with the real GameState / StepResult.fell / StormEvents.
  return <MorningReportView sol={sol} report={pickMorning(fakeMorning(sol))} />;
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
          <DominoCard domino={headline} fall />
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

function ExtraLine({ extra }: { extra: Extra }) {
  const { t } = useTranslation();
  if (extra.kind === "event") {
    return (
      <div className="extra">
        <p className="lead">{tDynamic(extra.event.captionKey)}</p>
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
        {t("earth.answer", {
          dust: t(`earth.dust.${answer.dustTomorrow}`),
          storm,
        })}
      </p>
      <DataChip source={answer.source} />
    </div>
  );
}

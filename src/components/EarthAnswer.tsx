import { useTranslation } from "react-i18next";
import { tRun } from "../i18n/dynamic";
import { DataChip } from "../screens/DataChip";
import type { EarthAnswer as Answer } from "../sim/types";
import { useMission } from "../state/mission";

/**
 * Earth's answer in kid sentences: dust and storm cloud, the chance of a burst, how long a
 * dust storm lasts, and how long the message really took (today's Deep Space Network reading).
 */
export function EarthAnswer({ answer }: { answer: Answer }) {
  const { t } = useTranslation();
  const setup = useMission((s) => s.setup);
  const moon = setup?.place === "moon" ? "moon" : undefined;
  const storm =
    answer.stormCloudInSols === undefined
      ? t("earth.storm.none")
      : tRun("earth.storm.coming", { count: answer.stormCloudInSols }, moon);
  return (
    <div className="earth-answer">
      <p>{t("earth.answer", { dust: t(`earth.dust.${answer.dustTomorrow}`), storm })}</p>
      {answer.burstRisk && <p className={`risk risk-${answer.burstRisk}`}>{t(`earth.risk.${answer.burstRisk}`)}</p>}
      {answer.dustStormSols !== undefined && <p>{t("earth.dustStorm", { count: answer.dustStormSols })}</p>}
      {answer.stormCloudInSols !== undefined && <DataChip source={answer.source} />}
      {setup && (
        <>
          <p className="note">
            {moon ? t("earth.delayMoon") : t(setup.delay.ref.mode === "live" ? "earth.delay" : "earth.delaySaved", { minutes: Math.round(setup.delay.seconds / 60) })}
          </p>
          <DataChip source={setup.delay.ref} />
        </>
      )}
    </div>
  );
}

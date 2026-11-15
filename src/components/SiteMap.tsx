import { useTranslation } from "react-i18next";
import HubDialog from "./HubDialog";
import { MENU_CAMPAIGNS } from "../data/campaigns";
import { asset } from "../game/assets";
import { BASE_AT, mapSites, type SiteState } from "../game/siteMap";
import { tRun } from "../i18n/dynamic";
import { useProgress } from "../state/progress";

const ICON: Record<SiteState, string> = { here: "campaign/map-base", done: "campaign/map-flag", open: "campaign/map-sample", locked: "campaign/map-rock" };

/**
 * The station airlock's map (#54): the base and every mission site with its state. View only, so a
 * mistap never leaves the mission being played. Closes with Esc, the × button or the interact key E.
 */
export default function SiteMap({ current, onClose }: { current?: string; onClose: () => void }) {
  const { t } = useTranslation();
  const done = useProgress((p) => p.done), teacher = useProgress((p) => p.teacher);
  const sites = mapSites(MENU_CAMPAIGNS, { done, teacher }, current);
  const places = [...new Set(sites.map((s) => s.place))];
  const baseAlone = !sites.some((s) => s.state === "here"); // the quick mission: show the base on Mars by itself
  return <HubDialog id="site-map" className="site-map" eyebrow={t("world.near.airlock")} title={t("siteMap.title")} closeLabel={t("siteMap.close")} onClose={onClose}>
      <p className="lead">{t("siteMap.lead")}</p>
      <div className="site-map-places">{places.map((place) => <section key={place} className="site-map-place" aria-labelledby={`site-map-${place}`}>
        <div className="site-map-planet" aria-hidden="true">
          <img src={asset(`campaign/briefing-planet-${place}`)} alt="" />
          {sites.filter((s) => s.place === place).map((s) =>
            <img key={s.id} className="site-map-marker" data-state={s.state} src={asset(ICON[s.state])} alt="" style={{ left: `${s.at.x}%`, top: `${s.at.y}%` }} />)}
          {baseAlone && place === "mars" && <img className="site-map-marker" data-state="here" src={asset(ICON.here)} alt="" style={{ left: `${BASE_AT.x}%`, top: `${BASE_AT.y}%` }} />}
        </div>
        <h3 id={`site-map-${place}`}>{t(`siteMap.place.${place}`)}</h3>
        <ul>{baseAlone && place === "mars" && <li data-testid="site-base" data-state="here">
          <img src={asset(ICON.here)} alt="" /><div><strong>{t("world.name")}</strong><span>{t("siteMap.state.here")}</span></div>
        </li>}{sites.filter((s) => s.place === place).map((s) => <li key={s.id} data-testid={`site-${s.id}`} data-state={s.state}>
          <img src={asset(ICON[s.state])} alt="" />
          <div><strong>{tRun(`campaign.${s.id}.name`)}</strong>
            <span>{s.state === "locked" ? t("siteMap.locked", { name: tRun(`campaign.${s.unlockAfter}.name`) }) : t(`siteMap.state.${s.state}`)}</span></div>
        </li>)}</ul>
      </section>)}</div>
  </HubDialog>;
}

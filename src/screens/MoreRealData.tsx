import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { dataClient, publicUrl, type Loaded } from "../data/client";
import type {
  ApodEntry,
  LearningResource,
  MarsSite,
  MissionImage,
  RadiationStorm,
  ScienceCard,
  SpaceWeather,
} from "../data/datasets";

interface All {
  storm: Loaded<RadiationStorm> | null;
  site: Loaded<MarsSite> | null;
  images: Loaded<MissionImage[]> | null;
  cards: Loaded<ScienceCard[]> | null;
  veggie: number | null;
  sun: Loaded<SpaceWeather> | null;
  apod: Loaded<ApodEntry> | null;
  teach: Loaded<LearningResource[]> | null;
}

async function loadAll(): Promise<All> {
  const [storm, site, images, cards, studies, sun, apod, teach] =
    await Promise.all([
      dataClient.getRadiationStorm(),
      dataClient.getMarsSite(),
      dataClient.getMissionImages(),
      dataClient.getScienceCards(),
      dataClient.load("osdr-studies"),
      dataClient.getSpaceWeather(),
      dataClient.getApod(),
      dataClient.getLearningResources(),
    ]);
  return {
    storm,
    site,
    images,
    cards,
    veggie: studies?.data.veggieStudies ?? null,
    sun,
    apod,
    teach,
  };
}

/** Line chart of the real dose-rate readings. Plain SVG, no animation. */
function StormChart({
  storm,
  label,
}: {
  storm: RadiationStorm;
  label: string;
}) {
  const { t } = useTranslation();
  const W = 320;
  const H = 120;
  const pad = 6;
  const pts = storm.series;
  const t0 = Date.parse(pts[0].time + "Z");
  const t1 = Date.parse(pts[pts.length - 1].time + "Z");
  const max = Math.max(...pts.map((p) => p.rate));
  const x = (time: string) =>
    pad + ((Date.parse(time + "Z") - t0) / (t1 - t0)) * (W - 2 * pad);
  const y = (rate: number) => H - pad - (rate / max) * (H - 2 * pad);
  const d = pts
    .map(
      (p, i) =>
        `${i ? "L" : "M"}${x(p.time).toFixed(1)},${y(p.rate).toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg
      className="more__chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
    >
      <line
        x1={pad}
        x2={W - pad}
        y1={y(storm.normalRate)}
        y2={y(storm.normalRate)}
        className="more__chart-normal"
      />
      <text
        x={W - pad}
        y={y(storm.normalRate) - 4}
        textAnchor="end"
        className="more__chart-text"
      >
        {t("moreData.storm.axisNormal")}
      </text>
      <path d={d} className="more__chart-line" />
    </svg>
  );
}

function Picture({ img, caption }: { img: MissionImage; caption: string }) {
  const { t } = useTranslation();
  return (
    <figure className="more__figure">
      <img
        src={publicUrl(img.image)}
        alt={img.description || img.title}
        loading="lazy"
      />
      <figcaption>
        {caption}{" "}
        <a href={img.page} target="_blank" rel="noreferrer">
          {t("moreData.pictures.credit", { credit: img.credit })}
        </a>
      </figcaption>
    </figure>
  );
}

/** Data Sources, part 2: every extra NASA / CSA source, each tied to something in the game. */
export function MoreRealData() {
  const { t, i18n } = useTranslation();
  const [all, setAll] = useState<All | null>(null);
  useEffect(() => {
    let alive = true;
    loadAll().then((a) => alive && setAll(a));
    return () => {
      alive = false;
    };
  }, []);
  if (!all) return null;

  const fmtDate = (ms: number | string) =>
    new Date(ms).toLocaleDateString(i18n.language, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const saved = (r: Loaded<unknown> | null) =>
    r ? (
      <p className="sources__note">
        {t("moreData.savedOn", { date: fmtDate(r.fetchedAt) })}
      </p>
    ) : null;
  const pic = (use: MissionImage["use"]) =>
    all.images?.data.find((i) => i.use === use);
  const n = (v: number) => Math.round(v).toLocaleString(i18n.language);

  return (
    <section className="more" aria-labelledby="more-title">
      <h3 id="more-title">{t("moreData.title")}</h3>
      <p>{t("moreData.intro")}</p>

      {all.storm ? (
        <section className="sources__item" aria-labelledby="more-storm">
          <h4 id="more-storm">{t("moreData.storm.title")}</h4>
          <StormChart
            storm={all.storm.data}
            label={t("moreData.storm.chartLabel")}
          />
          <p>
            {t("moreData.storm.body", {
              normal: all.storm.data.normalRate.toLocaleString(i18n.language, {
                maximumFractionDigits: 0,
              }),
              peak: n(all.storm.data.peak.rate),
              times: n(all.storm.data.peakTimesNormal),
            })}
          </p>
          <p className="sources__note">{t("moreData.storm.unit")}</p>
          <p className="sources__use">{t("moreData.storm.inGame")}</p>
          {pic("storm") ? (
            <Picture
              img={pic("storm")!}
              caption={t("moreData.pictures.storm")}
            />
          ) : null}
          <p className="sources__note">
            <a
              href="https://visualization.osdr.nasa.gov/radlab/gui/"
              target="_blank"
              rel="noreferrer"
            >
              {t("moreData.storm.source", {
                attribution: all.storm.attribution,
              })}
            </a>
          </p>
          {saved(all.storm)}
        </section>
      ) : null}

      {all.site ? (
        <section className="sources__item" aria-labelledby="more-site">
          <h4 id="more-site">{t("moreData.site.title")}</h4>
          <p>{t("moreData.site.body")}</p>
          <figure className="more__figure">
            <div className="more__map">
              {all.site.data.tiles.map((tile, i) => (
                <img
                  key={tile.image}
                  src={publicUrl(tile.image)}
                  alt={i === 0 ? t("moreData.site.alt") : ""}
                  role={i === 0 ? undefined : "presentation"}
                />
              ))}
              <span className="more__pin" aria-hidden="true">
                📍
              </span>
            </div>
            <figcaption>
              {t("moreData.site.credit", { credit: all.site.attribution })}
            </figcaption>
          </figure>
          <a href={all.site.data.explore} target="_blank" rel="noreferrer">
            {t("moreData.site.explore")}
          </a>
          {pic("site") ? (
            <Picture img={pic("site")!} caption={all.site.data.site.name} />
          ) : null}
        </section>
      ) : null}

      {pic("dust") ? (
        <section className="sources__item" aria-labelledby="more-pictures">
          <h4 id="more-pictures">{t("moreData.pictures.title")}</h4>
          <Picture img={pic("dust")!} caption={t("moreData.pictures.dust")} />
        </section>
      ) : null}

      {all.cards && all.cards.data.length ? (
        <section className="sources__item" aria-labelledby="more-plants">
          <h4 id="more-plants">{t("moreData.plants.title")}</h4>
          <p>{t("moreData.plants.body")}</p>
          <ul className="more__cards">
            {all.cards.data.map((c) => (
              <li key={c.id}>
                <span className="sources__label">
                  {t(`moreData.plants.${c.topic}`)}:
                </span>{" "}
                <a href={c.url} target="_blank" rel="noreferrer">
                  {c.title} ({c.id})
                </a>
              </li>
            ))}
          </ul>
          {all.veggie ? (
            <p className="sources__note">
              {t("moreData.plants.count", { n: all.veggie })}
            </p>
          ) : null}
          {saved(all.cards)}
        </section>
      ) : null}

      {all.sun ? (
        <section className="sources__item" aria-labelledby="more-sun">
          <h4 id="more-sun">{t("moreData.sun.title")}</h4>
          <p>
            {t("moreData.sun.body", {
              date: fmtDate(all.sun.data.window.end),
              flares: all.sun.data.counts.flares,
              big: all.sun.data.counts.bigFlares,
              cmes: all.sun.data.counts.cmes,
            })}
          </p>
          <p className="sources__note">{t("moreData.sun.note")}</p>
          {saved(all.sun)}
        </section>
      ) : null}

      {all.apod ? (
        <section className="sources__item" aria-labelledby="more-apod">
          <h4 id="more-apod">{t("moreData.apod.title")}</h4>
          <p>
            {t("moreData.apod.body", {
              title: all.apod.data.title,
              date: fmtDate(all.apod.data.date),
              credit: all.apod.data.credit,
            })}
          </p>
          <a href={all.apod.data.page} target="_blank" rel="noreferrer">
            {t("moreData.apod.open")}
          </a>
        </section>
      ) : null}

      {all.teach ? (
        <section className="sources__item" aria-labelledby="more-teach">
          <h4 id="more-teach">{t("moreData.teach.title")}</h4>
          <p>{t("moreData.teach.body")}</p>
          <ul className="more__cards">
            {all.teach.data.map((r) => (
              <li key={r.id}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.title}
                </a>{" "}
                <span className="sources__label">({r.kind})</span>
                {r.links.length ? (
                  <ul>
                    {r.links.map((l) => (
                      <li key={l.url}>
                        <a href={l.url} target="_blank" rel="noreferrer">
                          {l.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="sources__note more__disclaimer">
        {t("moreData.disclaimer")}
      </p>
    </section>
  );
}

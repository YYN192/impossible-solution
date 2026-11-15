/**
 * Bulgarian for the real-data text that lives in the data layer, not in en.json: the facts on the
 * Data Sources screen, and the source labels and values on the "real data" chips (#19).
 *
 * The English stays in src/data (sources.ts, campaignFacts.ts, campaigns.ts, storms.ts, dsn.ts,
 * mission.ts, engine.ts), where it was science-checked. This module only translates it, so the
 * data files keep one source of truth. sourceText.test.ts fails if a fact or label has no Bulgarian.
 */
import type { RealFact } from "../data/sources";
import { REMS_NIGHT } from "../data/campaigns";
import { STORMS } from "../data/storms";

type Lng = string;

/** Exact English label or value → Bulgarian. */
const BG_TEXT: Record<string, string> = {
  // Labels (sources.ts)
  "A Mars rover (Curiosity) measured this solar storm on 20 May 2024": "Марсоход (Curiosity) измери тази слънчева буря на 20 май 2024 г.",
  "Curiosity's radiation detector, first measurements on the Mars surface (Hassler et al., Science 2014)":
    "Радиационният детектор на Curiosity, първите измервания на повърхността на Марс (Hassler и колеги, Science 2014)",
  "NASA's InSight lander lost power when dust covered its solar panels": "Апаратът InSight на НАСА загуби енергия, когато прах покри слънчевите му панели",
  "Worked out from the Earth–Mars distance (55 to 401 million km, NASA fact sheet) and the speed of light: 3 to 22 minutes":
    "Изчислено от разстоянието Земя–Марс (от 55 до 401 милиона km, справочник на НАСА) и скоростта на светлината: от 3 до 22 минути",
  "NASA's space weather database (DONKI): the 20 May 2024 solar eruption": "Базата данни на НАСА за космическото време (DONKI): слънчевото изригване от 20 май 2024 г.",
  "NASA's space weather forecast: a storm cloud of 23 May 2024 was forecast to brush past Mars on 28 May":
    "Прогноза на НАСА за космическото време: слънчевият облак от 23 май 2024 г. трябваше да мине покрай Марс на 28 май",
  // Labels (campaignFacts.ts)
  "NASA OSDR RadLab, Curiosity's radiation detector on the Mars surface (MSL-RAD-Surface), read by us":
    "NASA OSDR RadLab, радиационният детектор на Curiosity на повърхността на Марс (MSL-RAD-Surface), разчетен от нас",
  "NASA Deep Space Network Now": "NASA Deep Space Network Now (мрежата на НАСА за далечен космос)",
  // Labels (campaigns.ts)
  "NASA's InSight lander: its solar panels made about 5,000 watt-hours a sol after landing and about 500 by spring 2022, because of dust":
    "Апаратът InSight на НАСА: слънчевите му панели даваха около 5 000 ватчаса на сол след кацането и около 500 до пролетта на 2022 г. заради праха",
  "NASA's InSight team trickled sand next to a panel so the wind would carry dust off it (May 2021)":
    "Екипът на InSight в НАСА насипа пясък до един панел, за да може вятърът да отнесе праха от него (май 2021 г.)",
  "NASA's Opportunity rover: a dust storm around the whole planet blocked its solar panels; its last message came on 10 June 2018":
    "Марсоходът Opportunity на НАСА: прашна буря около цялата планета закри слънчевите му панели; последното му съобщение дойде на 10 юни 2018 г.",
  "Wind gusts blew dust off the solar panels of NASA's rovers Spirit and Opportunity":
    "Пориви на вятъра издухаха праха от слънчевите панели на марсоходите Spirit и Opportunity на НАСА",
  "Curiosity's weather station in Gale Crater, coldest reading of the sol (reading from 25 Aug 2026, not live)":
    "Метеостанцията на Curiosity в кратера Гейл, най-ниската температура за сола (измерване от 25 авг. 2026 г., не е на живо)",
  "NASA named 13 candidate landing regions near the Moon's south pole, chosen for sunlight, talking with Earth and nearness to shadowed craters (19 Aug 2022)":
    "НАСА посочи 13 възможни района за кацане близо до южния полюс на Луната, избрани заради слънчевата светлина, връзката със Земята и близостта до кратери в сянка (19 авг. 2022 г.)",
  "Worked out from the Earth–Moon distance (384,400 km, NASA fact sheet) and the speed of light":
    "Изчислено от разстоянието Земя–Луна (384 400 km, справочник на НАСА) и скоростта на светлината",
  "NASA's Lunar Reconnaissance Orbiter, in orbit around the Moon, during the 20 May 2024 solar storm (12.3 → 15.7 µGy/h)":
    "Апаратът Lunar Reconnaissance Orbiter на НАСА, в орбита около Луната, по време на слънчевата буря от 20 май 2024 г. (12,3 → 15,7 µGy/h)",
  "The colours of this map are a real NASA Mars Trek picture of the Gale Crater area, averaged into squares of about 20 km":
    "Цветовете на тази карта са истинска снимка от NASA Mars Trek на района на кратера Гейл, осреднена на квадрати от около 20 km",
  // Labels (storms.ts)
  "A Mars rover (Curiosity) measured this solar storm on 11 Sep 2017": "Марсоход (Curiosity) измери тази слънчева буря на 11 септ. 2017 г.",
  "NASA's space weather forecast: the storm cloud of 10 Sep 2017 was forecast to brush past Mars on 13 Sep":
    "Прогноза на НАСА за космическото време: слънчевият облак от 10 септ. 2017 г. трябваше да мине покрай Марс на 13 септ.",
  "A Mars rover (Curiosity) measured this solar storm on 29 Oct 2021": "Марсоход (Curiosity) измери тази слънчева буря на 29 окт. 2021 г.",
  // Label (sim/engine.ts)
  "Mission Control on Earth": "Центърът за управление на Земята",
  // Chip values
  "8.1 mGy": "8,1 mGy",
  "0.21 mGy per day": "0,21 mGy на ден",
  "about 5,000 → about 500 Wh per sol": "около 5 000 → около 500 Wh на сол",
  "about 30 Wh more per sol": "около 30 Wh повече на сол",
  "about 1.3 seconds each way": "около 1,3 секунди в едната посока",
  "about 1.3 times its usual level": "около 1,3 пъти обичайното ниво",
  "about 3 times the usual level": "около 3 пъти обичайното ниво",
  // Flare classes named in the facts
  "X12 or larger (estimated)": "X12 или по-голям (по оценка)",
};

/** Labels the game builds at runtime (live readings, forecasts, Earth's answer). */
const BG_PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^NASA's Deep Space Network, radio link to (.+) at Mars, (.+) UTC$/, (m) => `Мрежата на НАСА за далечен космос, радиовръзка с ${m[1]} при Марс, ${m[2]} UTC`],
  [/^NASA's space weather forecast: a storm cloud reaching Mars on (\d{4}-\d{2}-\d{2})$/, (m) => `Прогноза на НАСА за космическото време: слънчев облак достига Марс на ${m[1]}`],
  [/^Storm-cloud forecast: ([\s\S]+)\. The dust forecast is a game number\.$/, (m) => `Прогноза за слънчевия облак: ${bgText(m[1])}. Прогнозата за праха е игрално число.`],
  [/^(\d+) min each way$/, (m) => `${m[1]} мин в едната посока`],
];

function bgText(text: string): string {
  if (text in BG_TEXT) return BG_TEXT[text];
  for (const [re, make] of BG_PATTERNS) {
    const m = text.match(re);
    if (m) return make(m);
  }
  return text;
}

/** A source label or value in the reader's language (English text is returned unchanged). */
export function localText(text: string | undefined, lng: Lng): string | undefined {
  if (text === undefined || !lng.startsWith("bg")) return text;
  return bgText(text);
}

/** True when Bulgarian exists for this label or value (used by the tests). */
export const hasBulgarian = (text: string) => bgText(text) !== text;

const flare = (f: string) => BG_TEXT[f] ?? f;
const [may2024, sep2017, oct2021] = STORMS;

/** Bulgarian for each fact on the Data Sources screen, by fact id. */
export const BG_FACTS: Record<string, Pick<RealFact, "what" | "value" | "usedFor">> = {
  burst: {
    what: "Радиация от слънчевата буря на 20 май 2024 г., измерена на Марс",
    value: "8,1 mGy (8 100 микрогрея) погълната доза от една буря",
    usedFor: "Колко скача броячът на лъчи при буря от частици",
  },
  baseline: {
    what: "Обикновена радиация на повърхността на Марс",
    value: "0,21 mGy на ден погълната доза (0,64 mSv на ден еквивалентна доза)",
    usedFor: "Обикновеният дневен ръст на брояча на лъчи. (Не го сравняваме с бурята от 2024 г.: различни години и серии измервания.)",
  },
  "burst-speed": {
    what: "Колко бързо пристигна бурята от частици",
    value: "Десетки минути след изригването",
    usedFor: "Защо Земята не може да те предупреди за буря от частици",
  },
  dust: {
    what: "Прах по слънчевите панели",
    value: "Прашна буря през 2022 г. намали енергията на InSight от 425 на 275 ватчаса на сол (около една трета по-малко)",
    usedFor: "Пропуснатото почистване на панелите намалява утрешната енергия с около една трета",
  },
  delay: {
    what: "Закъснение на съобщенията между Земята и Марс",
    value: "От 3 до 22 минути в едната посока, според положението на планетите",
    usedFor: "Питай Земята: съобщението пристига бързо, но учените имат нужда от нощта, за да го изучат",
  },
  cme: {
    what: "Изригването от 20 май 2024 г. в базата данни DONKI на НАСА",
    value: "CME 2024-05-20T05:36Z, около 1 900 до 2 700 km/s, от обратната страна на Слънцето (страната, обърната обратно на Земята), смятат учените",
    usedFor: "Бурята на сол 2 в основната мисия",
  },
  forecast: {
    what: "Слънчев облак с прогноза да удари Марс",
    value: "CME от 23 май 2024 г., с прогноза да мине покрай Марс на 28 май 2024 г. около 11:30 UTC",
    usedFor: "Какво ти казва отговорът на Земята: идва слънчев облак",
  },
  "peak-may2024": {
    what: "Най-лошият час на бурята от 20 май 2024 г. на Марс",
    value: `Около 304 микрогрея на час срещу около 4 точно преди бурята: около 74 пъти. Клас на изригването: ${flare(may2024.flare)}. Събитие в DONKI ${may2024.activityId}`,
    usedFor: "Затова това е огромната буря в играта. Децата четат „над 50 пъти по-силна от обикновено“.",
  },
  "storm-sep2017": {
    what: "Слънчевата буря от 10–11 септември 2017 г., измерена на Марс",
    value: `Най-лошият час: 23,2 микрогрея на час срещу около 7,9 преди: около 3 пъти. Клас на изригването ${flare(sep2017.flare)}. Събитие в DONKI ${sep2017.activityId}`,
    usedFor: "Малка буря от списъка с бури",
  },
  "cloud-sep2017": {
    what: "Слънчевият облак от 10 септември 2017 г.",
    value: "С прогноза да мине покрай Марс на 13 септември 2017 г. (скосен удар)",
    usedFor: "Слънчевият облак след бурята от септември 2017 г.",
  },
  "storm-oct2021": {
    what: "Слънчевата буря от 28–29 октомври 2021 г., измерена на Марс",
    value: `Най-лошият час: 25,8 микрогрея на час срещу около 8,5 преди: около 3 пъти. Клас на изригването ${flare(oct2021.flare)}. Събитие в DONKI ${oct2021.activityId}. Прогнозата не посочва слънчев облак, който да стигне до Марс`,
    usedFor: "Малка буря от списъка с бури, без слънчев облак след нея",
  },
  "delay-today": {
    what: "Радиозакъснение до Марс в момента",
    value: "Половината от времето, за което радиосигналът отива до апарат при Марс и се връща. Запазено измерване от 14 ноем. 2026 г.: 1 320 секунди отиване и връщане, 11 минути в едната посока",
    usedFor: "Питай Земята и радиосъбитието казват колко време е пътувало съобщението днес (на живо, когато нашият сървър отговаря, иначе това запазено измерване)",
  },
  "insight-power": {
    what: "Прах по слънчевите панели на InSight",
    value: "около 5 000 → около 500 Wh на сол",
    usedFor: "Сезонът на праха: защо прахът е главната опасност; мястото Равнината Елизий",
  },
  "insight-sand": {
    what: "Трикът на InSight с пясъка (май 2021 г.)",
    value: "около 30 Wh повече на сол",
    usedFor: "Сезонът на праха: събитието с почистването на панелите и крайната карта",
  },
  "opportunity-2018": {
    what: "Прашната буря през 2018 г. около цялата планета",
    value: "Последното съобщение от Opportunity дойде на 10 юни 2018 г.",
    usedFor: "Сезонът на праха: една от двете истински прашни бури. Спадът на енергията в играта е игрално число",
  },
  "wind-cleaning": {
    what: "Вятър, който чисти слънчевите панели",
    value: "Пориви на вятъра издухаха праха от панелите на Spirit и Opportunity",
    usedFor: "Сезонът на праха: мястото Равнината Меридиани и изборът с праховия вихър",
  },
  "rems-night": {
    what: "Нощ в кратера Гейл",
    value: `${REMS_NIGHT.value}, най-ниската температура за сола, на 25 август 2026 г. (най-новото измерване в потока; не е на живо)`,
    usedFor: "Сезонът на праха: мястото Кратерът Гейл и изборът за студената нощ",
  },
  "artemis-regions": {
    what: "Райони за кацане близо до южния полюс на Луната",
    value: "13 възможни района (19 авг. 2022 г.), сред тях Масивът Малаперт, Връх до Шакълтън и Хауърт; избрани заради слънчевата светлина, връзката със Земята и близостта до кратери в сянка",
    usedFor: "База на Южния полюс: трите места. НАСА не дава числа за всеки район, затова числата за местата са игрални",
  },
  "crater-may2024": {
    what: "Бурята от 20 май 2024 г., видяна от орбита около Луната",
    value: "12,3 → 15,7 микрогрея на час: около 1,3 пъти обичайното ниво (различен уред от този на Curiosity, затова се сравнява само със себе си)",
    usedFor: "База на Южния полюс: денят за наблюдение на небето. Бурята беше насочена към Марс, а не към Луната",
  },
  "moon-delay": {
    what: "Радиозакъснение до Луната",
    value: "около 1,3 секунди в едната посока",
    usedFor: "База на Южния полюс: Земята отговаря веднага",
  },
};

/** A fact's text in the reader's language. */
export function localFact(f: RealFact, lng: Lng): Pick<RealFact, "what" | "value" | "usedFor"> {
  if (!lng.startsWith("bg")) return f;
  return BG_FACTS[f.id] ?? f;
}

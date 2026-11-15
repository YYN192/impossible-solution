import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import { useProgress } from "../state/progress";
import "./DataSources.css";
import "./TeacherCard.css";

const QUESTIONS = ["teacher.q1", "teacher.q2", "teacher.q3"] as const;

/** Teacher's key: one switch that opens every mission on this device (saved), and locks them again. */
function TeacherKey() {
  const { t } = useTranslation();
  const on = useProgress((p) => p.teacher);
  const setTeacher = useProgress((p) => p.setTeacher);
  return (
    <div className="teacher__key">
      <h3>{t("teacher.keyTitle")}</h3>
      <button type="button" aria-pressed={on} onClick={() => setTeacher(!on)}>
        <Icon name={on ? "check" : "lock"} /> {t("teacher.keyButton")}
      </button>
      <p role="status">{t(on ? "teacher.keyOn" : "teacher.keyOff")}</p>
    </div>
  );
}

/**
 * Teacher card (#18): the lesson goal, how to run it in class, 3 discussion questions and
 * what is real. Prints on one page (see TeacherCard.css).
 */
export function TeacherCard({ onBack }: { onBack?: () => void }) {
  const { t } = useTranslation();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  return (
    <section className="sources teacher" aria-labelledby="teacher-title">
      <h2 id="teacher-title" ref={title} tabIndex={-1}>
        {t("teacher.title")}
      </h2>
      <p className="teacher__goal">{t("teacher.goal")}</p>
      <p>{t("teacher.howTo")}</p>

      <h3>{t("teacher.questionsTitle")}</h3>
      <ol className="teacher__questions">
        {QUESTIONS.map((q) => (
          <li key={q}>{t(q)}</li>
        ))}
      </ol>

      <h3>{t("teacher.realTitle")}</h3>
      <p>{t("teacher.real")}</p>

      <TeacherKey />

      {onBack ? (
        <button type="button" className="sources__back" onClick={onBack}>
          {t("teacher.back")}
        </button>
      ) : null}
    </section>
  );
}


import { useEffect, useRef, useState } from "react";
import { audio } from "../game/audio";
import { isTeacherCode, useProgress } from "../state/progress";
import { useTranslation } from "react-i18next";
import "./DataSources.css";
import "./TeacherCard.css";

const QUESTIONS = ["teacher.q1", "teacher.q2", "teacher.q3"] as const;

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

      <TeacherUnlock />

      {onBack ? (
        <button type="button" className="sources__back" onClick={onBack}>
          {t("teacher.back")}
        </button>
      ) : null}
    </section>
  );
}

/** A class code opens every mission at once, so a teacher can start the class on any of them. */
function TeacherUnlock() {
  const { t } = useTranslation();
  const teacher = useProgress((p) => p.teacher);
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  if (teacher)
    return (
      <div className="teacher__unlock">
        <p role="status">{t("teacher.unlocked")}</p>
        <button type="button" onClick={() => { audio.playSfx("menu-back"); useProgress.getState().setTeacher(false); }}>{t("teacher.lock")}</button>
      </div>
    );
  return (
    <form className="teacher__unlock" onSubmit={(e) => {
      e.preventDefault();
      if (isTeacherCode(code)) { audio.playSfx("console-success"); useProgress.getState().setTeacher(true); setCode(""); setWrong(false); }
      else { audio.playSfx("menu-error"); setWrong(true); }
    }}>
      <label htmlFor="teacher-code">{t("teacher.codeLabel")}</label>
      <input id="teacher-code" value={code} autoComplete="off" spellCheck={false} aria-invalid={wrong} aria-describedby="teacher-code-help"
        onChange={(e) => { setCode(e.target.value); setWrong(false); }} />
      <button type="submit" className="primary">{t("teacher.unlock")}</button>
      <p id="teacher-code-help" aria-live="polite">{wrong ? t("teacher.codeWrong") : t("teacher.codeHelp")}</p>
    </form>
  );
}

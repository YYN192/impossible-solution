import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import { isTeacherCode, useProgress } from "../state/progress";
import { TeacherCard } from "./TeacherCard";

describe("teacher code", () => {
  beforeEach(() => useProgress.getState().setTeacher(false));
  it("accepts the code in any case, with spaces or dashes", () => {
    expect(isTeacherCode("ares-2026")).toBe(true);
    expect(isTeacherCode(" Ares 2026 ")).toBe(true);
    expect(isTeacherCode("mars")).toBe(false);
  });
  it("a wrong code says so and keeps missions locked; the right one opens all, and they can be locked again", () => {
    render(<TeacherCard />);
    const box = screen.getByLabelText(en.teacher.codeLabel);
    fireEvent.change(box, { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: en.teacher.unlock }));
    screen.getByText(en.teacher.codeWrong);
    expect(useProgress.getState().teacher).toBe(false);
    fireEvent.change(box, { target: { value: "ares2026" } });
    fireEvent.click(screen.getByRole("button", { name: en.teacher.unlock }));
    expect(useProgress.getState().teacher).toBe(true);
    screen.getByText(en.teacher.unlocked);
    fireEvent.click(screen.getByRole("button", { name: en.teacher.lock }));
    expect(useProgress.getState().teacher).toBe(false);
  });
});

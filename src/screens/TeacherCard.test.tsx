import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import { isOpen, TEACHER_KEY, useProgress } from "../state/progress";
import type { Campaign } from "../sim/campaign";
import { TeacherCard } from "./TeacherCard";

describe("Teacher card (#18)", () => {
  it("shows the lesson goal from concept.md, 3 questions and what is real", () => {
    render(<TeacherCard />);
    screen.getByRole("heading", { name: en.teacher.title });
    screen.getByText("On Mars, every choice costs something, and help from Earth can't always arrive in time.");
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual([en.teacher.q1, en.teacher.q2, en.teacher.q3]);
    screen.getByText(en.teacher.real);
  });
});

describe("Teacher's key: one button opens every mission", () => {
  beforeEach(() => {
    localStorage.clear();
    useProgress.setState({ done: [], teacher: false });
  });

  const locked = { id: "moon", unlockAfter: "dust" } as Campaign;
  const key = () => screen.getByRole("button", { name: en.teacher.keyButton });

  it("is off at first, so locked missions stay locked", () => {
    render(<TeacherCard />);
    expect(key().getAttribute("aria-pressed")).toBe("false");
    screen.getByText(en.teacher.keyOff);
    expect(isOpen(locked, useProgress.getState())).toBe(false);
  });

  it("pressing it opens every mission and remembers it on this device", () => {
    render(<TeacherCard />);
    fireEvent.click(key());
    expect(key().getAttribute("aria-pressed")).toBe("true");
    screen.getByText(en.teacher.keyOn);
    expect(isOpen(locked, useProgress.getState())).toBe(true);
    expect(JSON.parse(localStorage.getItem(TEACHER_KEY)!)).toBe(true);
  });

  it("pressing it again locks the missions again", () => {
    useProgress.setState({ teacher: true });
    render(<TeacherCard />);
    fireEvent.click(key());
    expect(key().getAttribute("aria-pressed")).toBe("false");
    expect(isOpen(locked, useProgress.getState())).toBe(false);
    expect(JSON.parse(localStorage.getItem(TEACHER_KEY)!)).toBe(false);
  });
});

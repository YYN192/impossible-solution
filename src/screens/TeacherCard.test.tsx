import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
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

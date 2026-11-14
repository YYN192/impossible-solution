import { act, fireEvent, render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "../i18n";
import { LanguageToggle } from "./LanguageToggle";

function Demo() {
  const { t } = useTranslation();
  return (
    <>
      <LanguageToggle />
      <h1>{t("title.solLine")}</h1>
    </>
  );
}

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
  localStorage.clear();
});

describe("LanguageToggle (#19)", () => {
  it("starts in English with EN pressed", () => {
    render(<Demo />);
    expect(screen.getByRole("heading").textContent).toBe("A sol is one day on Mars.");
    expect(screen.getByRole("button", { name: "English" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Български" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("switches every text to Bulgarian, sets <html lang> and remembers the choice", () => {
    render(<Demo />);
    fireEvent.click(screen.getByRole("button", { name: "Български" }));
    expect(screen.getByRole("heading").textContent).toBe("Сол е един ден на Марс.");
    expect(document.documentElement.lang).toBe("bg");
    expect(localStorage.getItem("impossible-solution.lang")).toBe("bg");
    expect(screen.getByRole("group", { name: "Език" })).toBeTruthy();
  });

  it("switches back to English", () => {
    render(<Demo />);
    fireEvent.click(screen.getByRole("button", { name: "Български" }));
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading").textContent).toBe("A sol is one day on Mars.");
    expect(document.documentElement.lang).toBe("en");
  });
});

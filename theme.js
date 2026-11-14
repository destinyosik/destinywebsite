"use strict";

const themeStorageKey = "destinytech-theme";

function getSavedTheme() {
  try {
    return localStorage.getItem(themeStorageKey) === "light" ? "light" : "dark";
  } catch (error) {
    console.warn("The saved DestinyTech theme could not be read.", error);
    return "night";
  }
}

function applyTheme(theme) {
  const activeTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = activeTheme;
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const isLight = activeTheme === "light";
    button.setAttribute("aria-pressed", String(isLight));
    button.setAttribute("aria-label", `${activeTheme === "dark" ? "Dark" : "Light"} theme active. Switch to ${isLight ? "dark" : "light"} theme.`);
    const label = button.querySelector("[data-theme-label]");
    if (label) label.textContent = isLight ? "Light" : "Dark";
  });
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.content = activeTheme === "light" ? "#FFFFFF" : "#000000";
  });
  try {
    localStorage.setItem(themeStorageKey, activeTheme);
  } catch (error) {
    console.warn("The DestinyTech theme could not be saved for your next visit.", error);
  }
}

applyTheme(getSavedTheme());

document.addEventListener("DOMContentLoaded", () => {
  applyTheme(document.documentElement.dataset.theme);
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    });
  });
});

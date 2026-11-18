import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "flair.theme";
const query = "(prefers-color-scheme: light)";

function stored(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

let fadeTimer = 0;
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function system(): Theme {
  return window.matchMedia(query).matches ? "light" : "dark";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  // Cross-fade colours when the theme actually changes (not on first load).
  // The class enables a short transition on every element, then is removed
  // so day-to-day hovers keep their own, faster timing.
  if (root.dataset.theme && root.dataset.theme !== theme && !reduced()) {
    root.classList.add("theme-fading");
    window.clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(
      () => root.classList.remove("theme-fading"),
      260,
    );
  }
  root.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "light" ? "#ffffff" : "#000000");
}

/** The current theme: the saved choice, otherwise the system preference.
 *  index.html applies the same rule before first paint. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => stored() ?? system());

  useEffect(() => apply(theme), [theme]);

  // Follow the system until the person picks a theme themselves.
  useEffect(() => {
    const media = window.matchMedia(query);
    const follow = () => {
      if (!stored()) setTheme(system());
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        /* The choice still applies for this visit. */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}

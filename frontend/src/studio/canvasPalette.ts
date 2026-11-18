import type { Theme } from "../theme";

/** Light-board counterparts for the built-in canvas colours.
 *
 *  Boards store their colours once, in the dark palette the canvas started
 *  with. On a light board each built-in colour is drawn as its counterpart
 *  here, so the same project reads well in either theme without rewriting
 *  anyone's drawing. Custom colours picked by hand are drawn as chosen. */
const light: Record<string, string> = {
  // Ink
  "#d8dbe0": "#1f2328",
  "#8fdcd8": "#0f766e",
  "#f4a259": "#c2620a",
  "#f25f5c": "#d1333a",
  "#a78bfa": "#6d4fd8",
  "#6cc28a": "#2f8a4f",
  // Fills
  "#1d1f24": "#f1f2f4",
  "#12403f": "#d5f1ef",
  "#4a2c17": "#fbe3cc",
  "#4a1f24": "#fbd9da",
  "#2f2650": "#e5defc",
  "#141417": "#f7f7f8",
};

export function paint(color: string, theme: Theme) {
  return theme === "light" ? (light[color.toLowerCase()] ?? color) : color;
}

/** Board background, grid marks and selection accent per theme. */
export const boardColors = {
  dark: {
    base: "#000000",
    dot: "#77708366",
    grid: "#77708333",
    accent: "#8fdcd8",
  },
  light: {
    base: "#ffffff",
    dot: "#0000002e",
    grid: "#00000014",
    accent: "#0f766e",
  },
} as const;

import { defaultCard, makeBlock } from "./model";
import type { Card } from "./model";
export const templateNames = [
  "GitHub README snippet",
  "X / Twitter code post",
  "LinkedIn post",
  "Instagram square",
  "YouTube thumbnail",
  "Portfolio project",
  "Today I built…",
  "Code tutorial",
  "Error → Fix",
  "Before → After",
  "Architecture diagram",
  "Terminal screenshot",
  "JSON showcase",
  "API response",
  "SQL query",
  "GitHub commit",
  "Open-source announcement",
];
/** Solid background + syntax theme pairings that keep templates calm. */
const looks: Record<string, [string, string]> = {
  "GitHub README snippet": ["#0d1117", "Midnight"],
  "X / Twitter code post": ["#e7e5e0", "Midnight"],
  "LinkedIn post": ["#b3cdf6", "Midnight"],
  "Instagram square": ["#f2b5d4", "Rosé"],
  "YouTube thumbnail": ["#f6e2b3", "Midnight"],
  "Portfolio project": ["#ffffff", "Paper"],
  "Today I built…": ["#c9bdf5", "Rosé"],
  "Code tutorial": ["#14403b", "Nord"],
  "Error → Fix": ["#f4b8a8", "Midnight"],
  "Before → After": ["#b5e3c4", "Midnight"],
  "Architecture diagram": ["#1c1c21", "Nord"],
  "Terminal screenshot": ["#0b0b0d", "Terminal"],
  "JSON showcase": ["#9fe0d8", "Midnight"],
  "API response": ["#1e3a5f", "Ocean"],
  "SQL query": ["#e7e5e0", "Paper"],
  "GitHub commit": ["#0b0b0d", "Terminal"],
  "Open-source announcement": ["#f6e2b3", "Midnight"],
};
export function cardTemplate(name: string): Card {
  const c = defaultCard();
  c.title = name;
  // Templates start from the TypeScript sample, not the blank-card note.
  c.blocks = [makeBlock()];
  const [bg, theme] = looks[name] || ["#1c1c21", "Midnight"];
  c.background = "Solid";
  c.color = bg;
  c.theme = theme;
  c.grain = 0;
  c.shadow = 32;
  if (
    ["Instagram", "YouTube", "Twitter", "LinkedIn"].some((n) =>
      name.includes(n),
    )
  )
    c.autoSize = false;
  if (name.includes("Instagram")) c.width = c.height = 1080;
  if (name.includes("YouTube") || name.includes("Twitter")) {
    c.width = 1280;
    c.height = 720;
  }
  if (name.includes("LinkedIn")) {
    c.width = 1200;
    c.height = 627;
  }
  if (name.includes("Error") || name.includes("Before")) {
    c.blocks = [
      makeBlock(
        "const total = price * quantity;\n// Floating-point rounding can surprise you",
        "before.ts",
      ),
      makeBlock(
        "const total = Math.round(price * quantity * 100) / 100;\n// Round at the currency boundary",
        "after.ts",
      ),
    ];
    c.blocks[0].highlights = "1";
    c.blocks[1].highlights = "1";
    c.fontSize = 14;
  }
  if (name === "JSON showcase" || name === "API response") {
    c.blocks = [
      makeBlock(
        JSON.stringify(
          {
            status: "success",
            data: {
              project: "Flair",
              version: "2.0",
              features: ["code cards", "visual canvas"],
            },
          },
          null,
          2,
        ),
        name === "API response" ? "GET /api/projects" : "project.json",
      ),
    ];
    c.blocks[0].language = "json";
    c.blocks[0].label = "JSON";
  }
  if (name === "SQL query") {
    c.blocks = [
      makeBlock(
        "SELECT name, COUNT(*) AS creations\nFROM projects\nWHERE published = true\nGROUP BY name\nORDER BY creations DESC\nLIMIT 10;",
        "query.sql",
      ),
    ];
    c.blocks[0].language = "sql";
    c.blocks[0].label = "SQL";
  }
  if (name.includes("Terminal") || name === "GitHub commit") {
    c.window = "Terminal";
    c.blocks = [
      makeBlock(
        name.includes("commit")
          ? '$ git add .\n$ git commit -m "Build something beautiful"\n[main a1b2c3d] Build something beautiful\n 3 files changed, 128 insertions(+)'
          : "$ npm create flair@latest\n✓ Project created\n✓ Dependencies installed\n\n  Ready in 128 ms\n  ➜ Local: http://localhost:5173",
        "terminal",
      ),
    ];
    c.blocks[0].language = "bash";
    c.blocks[0].label = "Terminal";
  }
  if (name === "Architecture diagram") {
    c.blocks = [
      makeBlock(
        "Client → API Gateway → Service\n                          ↓\n                      Database\n                          ↓\n                     Event queue",
        "architecture.txt",
      ),
    ];
    c.blocks[0].language = "plain";
    c.blocks[0].label = "Architecture";
  }
  if (name === "Code tutorial") {
    c.blocks[0].highlights = "2-7";
    c.blocks[0].comment = "2";
  }
  return c;
}

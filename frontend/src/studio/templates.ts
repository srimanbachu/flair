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
export function cardTemplate(name: string): Card {
  const c = defaultCard();
  c.title = name;
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
    c.theme = "Terminal";
    c.background = "Terminal";
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
    c.annotations = [
      {
        id: "tutorial",
        kind: "label",
        text: "01  Turn an idea into something real",
        x: 14,
        y: 86,
        color: "#f9de8d",
        size: 22,
      },
    ];
  }
  if (
    [
      "Today I built…",
      "Open-source announcement",
      "Portfolio project",
    ].includes(name)
  )
    c.annotations = [
      {
        id: "title",
        kind: "label",
        text:
          name === "Today I built…"
            ? "✨ Today I built something beautiful"
            : name,
        x: 12,
        y: 12,
        color: "#ffffff",
        size: 28,
      },
    ];
  return c;
}

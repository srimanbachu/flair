export const uid = () => crypto.randomUUID();
export type CodeBlock = {
  id: string;
  name: string;
  language: string;
  label: string;
  code: string;
  highlights: string;
  blur: string;
  glow: string;
  words: string;
  comment: string;
};
export type Annotation = {
  id: string;
  kind: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
};
export type Card = {
  title: string;
  blocks: CodeBlock[];
  theme: string;
  font: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  lineNumbers: boolean;
  fileName: boolean;
  controls: boolean;
  /** Red/yellow/green window buttons instead of the theme's colours. */
  classicControls: boolean;
  window: string;
  /** Solid window colour; empty uses the syntax theme's own. */
  windowColor: string;
  background: string;
  color: string;
  color2: string;
  image: string;
  bgBlur: number;
  bgOpacity: number;
  grain: number;
  padding: number;
  radius: number;
  /** Corner rounding of the card background itself. */
  bgRadius: number;
  shadow: number;
  glow: number;
  border: number;
  gradientBorder: boolean;
  reflection: number;
  blur: number;
  glass: number;
  depth: number;
  perspective: number;
  rotation: number;
  /** Size the card to its code plus padding instead of width × height. */
  autoSize: boolean;
  width: number;
  height: number;
  quality: number;
  annotations: Annotation[];
};
export const makeBlock = (
  code = `// A little code. A lot of personality.\nconst create = (idea: string) => {\n  return {\n    idea,\n    possibilities: Infinity,\n    madeWith: "Flair",\n  };\n};\n\ncreate("Something beautiful");`,
  name = "hello.ts",
): CodeBlock => ({
  id: uid(),
  name,
  language: "typescript",
  label: "TypeScript",
  code,
  highlights: "",
  blur: "",
  glow: "",
  words: "",
  comment: "",
});
export const defaultCard = (): Card => ({
  title: "Something worth sharing",
  blocks: [
    {
      ...makeBlock(
        "Hi there how is it going? its all good here,\nhope its good there too\n\n\n",
        "hello.txt",
      ),
      language: "plain",
      label: "Text",
    },
  ],
  theme: "Paper",
  font: "monospace",
  fontSize: 24,
  lineHeight: 1.7,
  letterSpacing: 0,
  lineNumbers: true,
  fileName: true,
  controls: true,
  classicControls: false,
  window: "macOS",
  windowColor: "",
  background: "Solid",
  color: "#ffffff",
  color2: "#7c5cff",
  image: "",
  bgBlur: 0,
  bgOpacity: 100,
  grain: 50,
  padding: 64,
  radius: 16,
  bgRadius: 4,
  shadow: 40,
  glow: 0,
  border: 1,
  gradientBorder: false,
  reflection: 0,
  blur: 0,
  glass: 0,
  depth: 0,
  perspective: 0,
  rotation: 0,
  autoSize: true,
  width: 1200,
  height: 900,
  quality: 1,
  annotations: [],
});
export const palettes: Record<
  string,
  {
    bg: string;
    fg: string;
    keyword: string;
    string: string;
    number: string;
    comment: string;
  }
> = {
  Midnight: {
    bg: "#131621",
    fg: "#dbe2f4",
    keyword: "#b69aff",
    string: "#a5dfb0",
    number: "#ffba89",
    comment: "#737f99",
  },
  Dracula: {
    bg: "#282a36",
    fg: "#f8f8f2",
    keyword: "#ff79c6",
    string: "#f1fa8c",
    number: "#bd93f9",
    comment: "#6272a4",
  },
  Nord: {
    bg: "#2e3440",
    fg: "#eceff4",
    keyword: "#81a1c1",
    string: "#a3be8c",
    number: "#b48ead",
    comment: "#7c8ca6",
  },
  Solarized: {
    bg: "#002b36",
    fg: "#93a1a1",
    keyword: "#859900",
    string: "#2aa198",
    number: "#d33682",
    comment: "#657b83",
  },
  Paper: {
    bg: "#fffdf7",
    fg: "#273449",
    keyword: "#7c3aed",
    string: "#15803d",
    number: "#c2410c",
    comment: "#8a8992",
  },
  Terminal: {
    bg: "#07120a",
    fg: "#b9fbc0",
    keyword: "#4ade80",
    string: "#fef08a",
    number: "#67e8f9",
    comment: "#63876c",
  },
  Rosé: {
    bg: "#232136",
    fg: "#e0def4",
    keyword: "#c4a7e7",
    string: "#f6c177",
    number: "#eb6f92",
    comment: "#908caa",
  },
  Ocean: {
    bg: "#0b253a",
    fg: "#d7f1ff",
    keyword: "#82aaff",
    string: "#c3e88d",
    number: "#f78c6c",
    comment: "#67889c",
  },
  "GitHub Dark": {
    bg: "#0d1117",
    fg: "#e6edf3",
    keyword: "#ff7b72",
    string: "#a5d6ff",
    number: "#79c0ff",
    comment: "#8b949e",
  },
  "GitHub Light": {
    bg: "#ffffff",
    fg: "#1f2328",
    keyword: "#cf222e",
    string: "#0a3069",
    number: "#0550ae",
    comment: "#6e7781",
  },
  "One Dark": {
    bg: "#282c34",
    fg: "#abb2bf",
    keyword: "#c678dd",
    string: "#98c379",
    number: "#d19a66",
    comment: "#5c6370",
  },
  Monokai: {
    bg: "#272822",
    fg: "#f8f8f2",
    keyword: "#f92672",
    string: "#e6db74",
    number: "#ae81ff",
    comment: "#75715e",
  },
  "Tokyo Night": {
    bg: "#1a1b26",
    fg: "#c0caf5",
    keyword: "#bb9af7",
    string: "#9ece6a",
    number: "#ff9e64",
    comment: "#565f89",
  },
  Catppuccin: {
    bg: "#1e1e2e",
    fg: "#cdd6f4",
    keyword: "#cba6f7",
    string: "#a6e3a1",
    number: "#fab387",
    comment: "#6c7086",
  },
  Gruvbox: {
    bg: "#282828",
    fg: "#ebdbb2",
    keyword: "#fb4934",
    string: "#b8bb26",
    number: "#d3869b",
    comment: "#928374",
  },
  "Night Owl": {
    bg: "#011627",
    fg: "#d6deeb",
    keyword: "#c792ea",
    string: "#ecc48d",
    number: "#f78c6c",
    comment: "#637777",
  },
  Synthwave: {
    bg: "#262335",
    fg: "#f4eee4",
    keyword: "#fede5d",
    string: "#ff8b39",
    number: "#f97e72",
    comment: "#848bbd",
  },
  "Ayu Light": {
    bg: "#fcfcfc",
    fg: "#5c6166",
    keyword: "#fa8d3e",
    string: "#86b300",
    number: "#a37acc",
    comment: "#adaeb1",
  },
  Everforest: {
    bg: "#2d353b",
    fg: "#d3c6aa",
    keyword: "#e67e80",
    string: "#a7c080",
    number: "#d699b6",
    comment: "#859289",
  },
  Material: {
    bg: "#263238",
    fg: "#eeffff",
    keyword: "#c792ea",
    string: "#c3e88d",
    number: "#f78c6c",
    comment: "#546e7a",
  },
  Vesper: {
    bg: "#101010",
    fg: "#ffffff",
    keyword: "#a0a0a0",
    string: "#99ffe4",
    number: "#ffc799",
    comment: "#585858",
  },
  "Solarized Light": {
    bg: "#fdf6e3",
    fg: "#586e75",
    keyword: "#859900",
    string: "#2aa198",
    number: "#d33682",
    comment: "#93a1a1",
  },
  "Rosé Pine Dawn": {
    bg: "#faf4ed",
    fg: "#575279",
    keyword: "#286983",
    string: "#ea9d34",
    number: "#d7827e",
    comment: "#9893a5",
  },
};
/** Relative luminance check used to group themes and pick text colour. */
export const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return (
    0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) >
    150
  );
};
/** Theme colours for a card, with the custom window colour applied. When
 *  the window and theme differ in tone, plain text flips to stay legible. */
export function cardColors(c: Pick<Card, "theme" | "windowColor">) {
  const p = palettes[c.theme] || palettes.Midnight;
  if (!c.windowColor) return p;
  const fg =
    isLight(c.windowColor) === isLight(p.bg)
      ? p.fg
      : isLight(c.windowColor)
        ? "#1f2328"
        : "#e6edf3";
  return { ...p, bg: c.windowColor, fg };
}
export const backgroundNames = [
  "Midnight",
  "Aurora",
  "Sunset",
  "Ocean",
  "Carbon",
  "Paper",
  "Glass",
  "Terminal",
  "Solid",
  "Gradient",
  "Mesh",
  "Radial",
  "Grid",
  "Dots",
  "Blobs",
  "Image",
];
export function backgroundCSS(
  c: Pick<Card, "background" | "color" | "color2" | "image">,
): string {
  const presets: Record<string, string> = {
    Midnight: "linear-gradient(140deg,#13152d,#35315a)",
    Aurora:
      "radial-gradient(ellipse at 15% 10%,#70e1ce 0%,transparent 55%),radial-gradient(ellipse at 85% 90%,#ae85f4 0%,transparent 60%),linear-gradient(135deg,#385c8f,#9f9ae9)",
    Sunset: "linear-gradient(135deg,#ffbd8c,#ef7498 50%,#7653bd)",
    Ocean: "linear-gradient(130deg,#0b486b,#24c6a0)",
    Carbon: "repeating-linear-gradient(45deg,#1c1c22 0 2px,#22222a 2px 4px)",
    Paper: "linear-gradient(135deg,#f3eee2,#ded9d0)",
    Glass: "linear-gradient(135deg,#a9d9e6,#d7b4e4 50%,#edf0fb)",
    Terminal: "linear-gradient(140deg,#071b16,#164233)",
    Solid: c.color,
    Gradient: `linear-gradient(135deg,${c.color},${c.color2})`,
    Mesh: `radial-gradient(at 15% 20%,${c.color},transparent 65%),radial-gradient(at 85% 80%,${c.color2},transparent 65%),#24263e`,
    Radial: `radial-gradient(circle,${c.color},${c.color2})`,
    Grid: "repeating-linear-gradient(0deg,#ffffff18 0 1px,transparent 1px 32px),repeating-linear-gradient(90deg,#ffffff18 0 1px,transparent 1px 32px),#1c2035",
    Dots: "radial-gradient(#ffffff40 1px,transparent 1px) 0 0 / 16px 16px #1c2035",
    Blobs: `radial-gradient(ellipse at 10% 10%,${c.color} 0 25%,transparent 26%),radial-gradient(ellipse at 90% 90%,${c.color2} 0 30%,transparent 31%),#24263e`,
    Image: c.image ? `url("${c.image}") center / cover` : "#25283c",
  };
  return presets[c.background] || presets.Aurora;
}
export const sizes: Record<string, [number, number]> = {
  "X post": [1600, 900],
  LinkedIn: [1200, 627],
  Instagram: [1080, 1080],
  "Instagram Story": [1080, 1920],
  YouTube: [1280, 720],
  "16:9": [1600, 900],
  "4:3": [1200, 900],
  "1:1": [1080, 1080],
  "9:16": [900, 1600],
};
export function inRanges(spec: string, line: number) {
  return spec.split(",").some((part) => {
    const match = part.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
    return match ? line >= +match[1] && line <= +(match[2] || match[1]) : false;
  });
}

export const cardTabs = [
  "Background",
  "Window",
  "Typography",
  "Effects",
  "Templates",
  "Export",
];

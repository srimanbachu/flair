import { defaultCard, makeBlock, backgroundNames, palettes } from "./model";
import { emptyBoard, makeItem } from "./canvasModel";
import type { Board } from "./canvasModel";
import type { Card } from "./model";
function shape(
  value: unknown,
  sample: Record<string, unknown>,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid project structure.");
  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, example] of Object.entries(sample)) {
    const v = obj[key];
    if (Array.isArray(example)) {
      if (!Array.isArray(v)) throw new Error(`Invalid ${key}.`);
      result[key] = v;
    } else if (
      typeof v !== typeof example ||
      (typeof v === "number" &&
        (!Number.isFinite(v) || Math.abs(v) > 100000)) ||
      (typeof v === "string" && v.length > (key === "image" ? 8000000 : 300000))
    )
      throw new Error(`Invalid ${key}.`);
    else result[key] = v;
  }
  return result;
}
function imageSafe(s: string) {
  if (s && !/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(s))
    throw new Error(
      "Project images must be embedded PNG, JPEG, WebP, or GIF files.",
    );
}
function ranges(value: object, limits: Record<string, [number, number]>) {
  for (const [key, [min, max]] of Object.entries(limits)) {
    const n = (value as Record<string, unknown>)[key];
    if (typeof n !== "number" || n < min || n > max)
      throw new Error(`Invalid ${key}: expected ${min}–${max}.`);
  }
}
function uniqueIds(items: { id: string }[]) {
  if (
    new Set(items.map((i) => i.id)).size !== items.length ||
    items.some((i) => !i.id)
  )
    throw new Error("Project contains missing or duplicate object IDs.");
}
export function validateCard(value: unknown): Card {
  // Projects saved before auto sizing existed keep their fixed size.
  if (value && typeof value === "object" && !("autoSize" in value))
    value = { ...value, autoSize: false };
  const c = shape(value, defaultCard()) as unknown as Card;
  if (c.blocks.length < 1 || c.blocks.length > 30 || c.annotations.length > 100)
    throw new Error("Too many blocks or annotations.");
  c.blocks = c.blocks.map((b) => shape(b, makeBlock()) as unknown as typeof b);
  c.annotations = c.annotations.map(
    (a) =>
      shape(a, {
        id: "",
        kind: "",
        text: "",
        x: 0,
        y: 0,
        color: "",
        size: 24,
      }) as unknown as typeof a,
  );
  if (
    c.width < 320 ||
    c.width > 2400 ||
    c.height < 320 ||
    c.height > 2400 ||
    c.quality < 1 ||
    c.quality > 3
  )
    throw new Error("Unsupported image dimensions.");
  ranges(c, {
    fontSize: [10, 40],
    lineHeight: [1, 2.5],
    letterSpacing: [-1, 4],
    bgBlur: [0, 40],
    bgOpacity: [0, 100],
    grain: [0, 50],
    padding: [16, 160],
    radius: [0, 40],
    shadow: [0, 100],
    glow: [0, 80],
    border: [0, 8],
    reflection: [0, 50],
    blur: [0, 8],
    glass: [0, 70],
    depth: [0, 20],
    perspective: [-25, 25],
    rotation: [-20, 20],
  });
  if (!backgroundNames.includes(c.background) || !palettes[c.theme])
    throw new Error("Unknown background or syntax theme.");
  uniqueIds(c.blocks);
  uniqueIds(c.annotations);
  c.annotations.forEach((a) =>
    ranges(a, { x: [0, 95], y: [0, 95], size: [12, 80] }),
  );
  imageSafe(c.image);
  return c;
}
export function validateBoard(value: unknown): Board {
  const b = shape(value, emptyBoard()) as unknown as Board;
  if (b.items.length > 2000)
    throw new Error("Canvas supports up to 2,000 objects.");
  b.items = b.items.map((i) => {
    const n = shape(i, makeItem("rectangle")) as unknown as typeof i;
    if (n.points.length > 100000 || n.comments.length > 1000)
      throw new Error("Canvas object is too complex.");
    ranges(n, {
      opacity: [0, 100],
      fontSize: [10, 72],
      strokeWidth: [1, 12],
      rotation: [-180, 180],
    });
    imageSafe(n.image);
    n.points = n.points.map(
      (p) => shape(p, { x: 0, y: 0 }) as unknown as typeof p,
    );
    if (!n.comments.every((c) => typeof c === "string"))
      throw new Error("Invalid comments.");
    return n;
  });
  uniqueIds(b.items);
  // The light canvas background was retired; keep old projects readable.
  if (!["Dots", "Grid", "Plain"].includes(b.background)) b.background = "Dots";
  return b;
}
export function parseProject(
  text: string,
): { kind: "card"; data: Card } | { kind: "canvas"; data: Board } {
  const p = JSON.parse(text);
  if (p.format !== "flair" || p.version !== 1)
    throw new Error("Choose a Flair v1 project JSON file.");
  if (p.kind === "card") return { kind: "card", data: validateCard(p.data) };
  if (p.kind === "canvas")
    return { kind: "canvas", data: validateBoard(p.data) };
  throw new Error("Unknown project type.");
}

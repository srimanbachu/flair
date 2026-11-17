import { uid } from "./model";
export type Point = { x: number; y: number };
export type CanvasItem = {
  id: string;
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  text: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  font: string;
  fontSize: number;
  bold: boolean;
  points: Point[];
  image: string;
  group: string;
  from: string;
  to: string;
  comments: string[];
  gradient: boolean;
};
export type Board = {
  title: string;
  items: CanvasItem[];
  background: string;
  snap: boolean;
};
export const emptyBoard = (): Board => ({
  title: "Untitled canvas",
  items: [],
  background: "Dots",
  snap: true,
});
export function makeItem(kind: string, x = 100, y = 100): CanvasItem {
  return {
    id: uid(),
    kind,
    x,
    y,
    w: kind === "text" ? 240 : kind === "code" ? 360 : 180,
    h: kind === "text" ? 70 : kind === "code" ? 180 : 120,
    rotation: 0,
    text:
      (
        {
          text: "Your next big idea",
          sticky: "A little idea\nwith a lot of potential.",
          code: 'const idea = "make it happen";\n\nexport default idea;',
          icon: "⚛",
          frame: "Frame 1",
        } as Record<string, string>
      )[kind] || "",
    fill:
      kind === "sticky"
        ? "#f4d985"
        : kind === "code"
          ? "#151827"
          : kind === "frame"
            ? "#222638"
            : "#343047",
    stroke: "#b9a5f5",
    strokeWidth: 2,
    opacity: 100,
    font: "sans-serif",
    fontSize: kind === "icon" ? 48 : 20,
    bold: false,
    points: [],
    image: "",
    group: "",
    from: "",
    to: "",
    comments: [],
    gradient: false,
  };
}
export const boardTemplates = [
  "System architecture",
  "Flowchart",
  "Mind map",
  "Wireframe",
  "Blank canvas",
];
export function boardTemplate(name: string): Board {
  const b = emptyBoard();
  b.title = name;
  if (name === "Blank canvas") return b;
  const labels: Record<string, string[]> = {
    "System architecture": [
      "Client",
      "API Gateway",
      "Service",
      "Database",
      "Event queue",
    ],
    Flowchart: ["Start", "Validate input", "Process request", "Return result"],
    "Mind map": ["The big idea", "Design", "Build", "Share"],
    Wireframe: [
      "Navigation",
      "Hero / introduction",
      "Feature cards",
      "Call to action",
    ],
  };
  const nodes = (labels[name] || []).map((text, i) => ({
    ...makeItem(
      name === "Mind map" ? "ellipse" : "rectangle",
      name === "Wireframe" ? 100 : 80 + (i % 3) * 300,
      name === "Wireframe" ? 70 + i * 170 : 100 + Math.floor(i / 3) * 260,
    ),
    text,
    w: name === "Wireframe" ? 800 : 210,
    h: 110,
  }));
  b.items = [
    ...nodes,
    ...(name === "Wireframe"
      ? []
      : nodes.slice(1).map((n, i) => ({
          ...makeItem("arrow"),
          from: nodes[name === "Mind map" ? 0 : i].id,
          to: n.id,
        }))),
  ];
  return b;
}
export function endpoints(item: CanvasItem, items: CanvasItem[]) {
  const from = items.find((i) => i.id === item.from),
    to = items.find((i) => i.id === item.to);
  let a = from
    ? { x: from.x + from.w / 2, y: from.y + from.h / 2 }
    : { x: item.x, y: item.y };
  let b = to
    ? { x: to.x + to.w / 2, y: to.y + to.h / 2 }
    : { x: item.x + item.w, y: item.y + item.h };
  const anchor = (node: CanvasItem, other: Point): Point => {
    const cx = node.x + node.w / 2,
      cy = node.y + node.h / 2,
      rad = (node.rotation * Math.PI) / 180;
    const dx = (other.x - cx) * Math.cos(rad) + (other.y - cy) * Math.sin(rad),
      dy = -(other.x - cx) * Math.sin(rad) + (other.y - cy) * Math.cos(rad);
    if (!dx && !dy) return { x: cx, y: cy };
    const rx = Math.max(1, node.w / 2),
      ry = Math.max(1, node.h / 2);
    const t =
      node.kind === "ellipse"
        ? 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry))
        : node.kind === "diamond"
          ? 1 / (Math.abs(dx) / rx + Math.abs(dy) / ry)
          : Math.min(rx / Math.abs(dx), ry / Math.abs(dy));
    return {
      x: cx + dx * t * Math.cos(rad) - dy * t * Math.sin(rad),
      y: cy + dx * t * Math.sin(rad) + dy * t * Math.cos(rad),
    };
  };
  const oldA = a,
    oldB = b;
  if (from) a = anchor(from, oldB);
  if (to) b = anchor(to, oldA);
  if (item.rotation && (!from || !to)) {
    const pivot = from
      ? a
      : to
        ? b
        : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const rad = (item.rotation * Math.PI) / 180;
    const rotate = (p: Point) => ({
      x:
        pivot.x +
        (p.x - pivot.x) * Math.cos(rad) -
        (p.y - pivot.y) * Math.sin(rad),
      y:
        pivot.y +
        (p.x - pivot.x) * Math.sin(rad) +
        (p.y - pivot.y) * Math.cos(rad),
    });
    if (!from) a = rotate(a);
    if (!to) b = rotate(b);
  }
  return { a, b };
}
export function bounds(items: CanvasItem[]) {
  if (!items.length) return { x: 0, y: 0, w: 1200, h: 800 };
  const xs = items.flatMap((i) => [i.x, i.x + i.w]);
  const ys = items.flatMap((i) => [i.y, i.y + i.h]);
  return {
    x: Math.min(...xs) - 40,
    y: Math.min(...ys) - 40,
    w: Math.max(...xs) - Math.min(...xs) + 80,
    h: Math.max(...ys) - Math.min(...ys) + 80,
  };
}

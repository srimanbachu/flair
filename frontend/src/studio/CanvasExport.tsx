import { renderToStaticMarkup } from "react-dom/server";
import type { Board, CanvasItem } from "./canvasModel";
import { bounds, endpoints } from "./canvasModel";
import { CanvasShape } from "./CanvasShape";
export function exportBounds(items: CanvasItem[]) {
  const objects = items.map((i) => {
    let points = [
      { x: i.x, y: i.y },
      { x: i.x + i.w, y: i.y },
      { x: i.x + i.w, y: i.y + i.h },
      { x: i.x, y: i.y + i.h },
    ];
    if (["arrow", "line"].includes(i.kind)) {
      const e = endpoints(i, items);
      points = [e.a, e.b];
    } else if (["pen", "pencil", "brush"].includes(i.kind))
      points = i.points.map((p) => ({ x: i.x + p.x, y: i.y + p.y }));
    else if (i.rotation) {
      const rad = (i.rotation * Math.PI) / 180,
        cx = i.x + i.w / 2,
        cy = i.y + i.h / 2;
      points = points.map((p) => ({
        x: cx + (p.x - cx) * Math.cos(rad) - (p.y - cy) * Math.sin(rad),
        y: cy + (p.x - cx) * Math.sin(rad) + (p.y - cy) * Math.cos(rad),
      }));
    }
    if (!points.length) points = [{ x: i.x, y: i.y }];
    const x = Math.min(...points.map((p) => p.x)),
      y = Math.min(...points.map((p) => p.y));
    return {
      ...i,
      x,
      y,
      w: Math.max(...points.map((p) => p.x)) - x,
      h: Math.max(...points.map((p) => p.y)) - y,
    };
  });
  return bounds(objects);
}
export function canvasSVG(board: Board) {
  const b = exportBounds(board.items);
  const base = board.background === "Light" ? "#f4f1eb" : "#191a23";
  return {
    bounds: b,
    text: renderToStaticMarkup(
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={b.w}
        height={b.h}
        viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`}
      >
        <defs>
          <pattern
            id="export-bg"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            {board.background === "Dots" ? (
              <circle cx="1" cy="1" r="1" fill="#77708366" />
            ) : board.background === "Grid" ? (
              <path d="M 20 0 H 0 V 20" stroke="#77708333" fill="none" />
            ) : null}
          </pattern>
        </defs>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={base} />
        <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="url(#export-bg)" />
        {board.items.map((i) => (
          <CanvasShape key={i.id} item={i} items={board.items} />
        ))}
      </svg>,
    ),
  };
}

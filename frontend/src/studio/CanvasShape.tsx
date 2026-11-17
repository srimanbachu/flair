import {
  GitFork,
  Atom,
  Database,
  Server,
  Cloud,
  Container,
  LockKeyhole,
  Network,
  Hexagon,
} from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import type { ReactNode } from "react";
const icons = {
  GitHub: GitFork,
  "⚛": Atom,
  "▤ Database": Database,
  "▣ Server": Server,
  "☁ Cloud": Cloud,
  "🐳 Docker": Container,
  "🔒 Auth": LockKeyhole,
  "↔ API": Network,
  "⬡ Node.js": Hexagon,
};
function codeTokens(tokens: (string | Prism.Token)[]): ReactNode {
  const colors: Record<string, string> = {
    keyword: "#b69aff",
    string: "#a5dfb0",
    number: "#ffba89",
    comment: "#737f99",
    function: "#ffba89",
  };
  return tokens.map((token, index) =>
    typeof token === "string" ? (
      token
    ) : (
      <tspan key={index} fill={colors[token.type]}>
        {codeTokens(
          Array.isArray(token.content) ? token.content : [token.content],
        )}
      </tspan>
    ),
  );
}
import type { CanvasItem } from "./canvasModel";
import { endpoints } from "./canvasModel";
export function CanvasShape({
  item: i,
  items,
  selected = false,
}: {
  item: CanvasItem;
  items: CanvasItem[];
  selected?: boolean;
}) {
  const Icon =
    i.kind === "icon" ? icons[i.text as keyof typeof icons] : undefined;
  const fill = i.gradient ? `url(#gradient-${i.id})` : i.fill;
  const shapeProps = { fill, stroke: i.stroke, strokeWidth: i.strokeWidth };
  const isLine = ["arrow", "line"].includes(i.kind);
  const e = endpoints(i, items);
  return (
    <g
      opacity={i.opacity / 100}
      transform={
        isLine
          ? undefined
          : `rotate(${i.rotation} ${i.x + i.w / 2} ${i.y + i.h / 2})`
      }
    >
      <defs>
        <linearGradient id={`gradient-${i.id}`} x2="1" y2="1">
          <stop stopColor={i.fill} />
          <stop offset="1" stopColor={i.stroke} />
        </linearGradient>
        <marker
          id={`arrow-${i.id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={i.stroke} />
        </marker>
      </defs>
      {isLine ? (
        <>
          <line
            x1={e.a.x}
            y1={e.a.y}
            x2={e.b.x}
            y2={e.b.y}
            stroke={i.stroke}
            strokeWidth={i.strokeWidth}
            markerEnd={i.kind === "arrow" ? `url(#arrow-${i.id})` : undefined}
          />
          <line
            x1={e.a.x}
            y1={e.a.y}
            x2={e.b.x}
            y2={e.b.y}
            stroke="transparent"
            strokeWidth={20}
          />
        </>
      ) : ["pen", "pencil", "brush"].includes(i.kind) ? (
        <polyline
          points={i.points.map((p) => `${i.x + p.x},${i.y + p.y}`).join(" ")}
          fill="none"
          stroke={i.stroke}
          strokeWidth={
            i.kind === "brush"
              ? i.strokeWidth * 3
              : i.kind === "pencil"
                ? 1
                : i.strokeWidth
          }
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          {i.kind === "ellipse" ? (
            <ellipse
              cx={i.x + i.w / 2}
              cy={i.y + i.h / 2}
              rx={i.w / 2}
              ry={i.h / 2}
              {...shapeProps}
            />
          ) : i.kind === "triangle" ? (
            <polygon
              points={`${i.x + i.w / 2},${i.y} ${i.x + i.w},${i.y + i.h} ${i.x},${i.y + i.h}`}
              {...shapeProps}
            />
          ) : i.kind === "diamond" ? (
            <polygon
              points={`${i.x + i.w / 2},${i.y} ${i.x + i.w},${i.y + i.h / 2} ${i.x + i.w / 2},${i.y + i.h} ${i.x},${i.y + i.h / 2}`}
              {...shapeProps}
            />
          ) : i.kind === "image" ? (
            <image
              href={i.image}
              x={i.x}
              y={i.y}
              width={i.w}
              height={i.h}
              preserveAspectRatio="xMidYMid meet"
            />
          ) : !["text", "icon"].includes(i.kind) ? (
            <rect
              x={i.x}
              y={i.y}
              width={i.w}
              height={i.h}
              rx={i.kind === "frame" ? 4 : 10}
              {...shapeProps}
              strokeDasharray={i.kind === "frame" ? "8 6" : undefined}
            />
          ) : null}
          {Icon && (
            <Icon
              x={i.x + (i.w - i.fontSize) / 2}
              y={i.y + (i.h - i.fontSize) / 2}
              width={i.fontSize}
              height={i.fontSize}
              stroke={i.stroke}
              strokeWidth={1.5}
            />
          )}
          {i.text && !Icon && (
            <text
              x={i.kind === "code" ? i.x + 18 : i.x + i.w / 2}
              y={
                i.kind === "frame"
                  ? i.y - 12
                  : i.y +
                    i.h / 2 -
                    (i.text.split("\n").length - 1) * i.fontSize * 0.65
              }
              textAnchor={i.kind === "code" ? "start" : "middle"}
              fill={
                i.kind === "sticky"
                  ? "#30281b"
                  : i.kind === "code"
                    ? "#bfe3c2"
                    : i.stroke
              }
              fontFamily={i.kind === "code" ? "monospace" : i.font}
              fontSize={i.fontSize}
              fontWeight={i.bold ? 700 : 400}
            >
              {i.text.split("\n").map((line, index) => (
                <tspan
                  key={index}
                  x={i.kind === "code" ? i.x + 18 : i.x + i.w / 2}
                  dy={index ? i.fontSize * 1.3 : 0}
                >
                  {i.kind === "code"
                    ? codeTokens(
                        Prism.tokenize(line || " ", Prism.languages.typescript),
                      )
                    : line || " "}
                </tspan>
              ))}
            </text>
          )}
        </>
      )}
      {i.comments.length > 0 && (
        <g>
          <circle cx={i.x + i.w} cy={i.y} r={12} fill="#8fdcd8" />
          <text
            x={i.x + i.w}
            y={i.y + 4}
            textAnchor="middle"
            fill="#062120"
            fontSize={12}
          >
            {i.comments.length}
          </text>
        </g>
      )}
      {selected && (
        <rect
          x={isLine ? Math.min(e.a.x, e.b.x) - 6 : i.x - 6}
          y={isLine ? Math.min(e.a.y, e.b.y) - 6 : i.y - 6}
          width={isLine ? Math.abs(e.b.x - e.a.x) + 12 : i.w + 12}
          height={isLine ? Math.abs(e.b.y - e.a.y) + 12 : i.h + 12}
          fill="none"
          stroke="#8fdcd8"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          pointerEvents="none"
        />
      )}
    </g>
  );
}

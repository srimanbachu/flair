import type { CSSProperties, RefObject } from "react";
import type { Card } from "./model";
import { backgroundCSS, palettes } from "./model";
import { CodeView } from "./CodeView";
export function CardPreview({
  card: c,
  exportRef,
  scale,
  onPickBlock,
}: {
  card: Card;
  exportRef: RefObject<HTMLDivElement | null>;
  scale: number;
  onPickBlock?: (index: number) => void;
}) {
  const p = palettes[c.theme] || palettes.Midnight;
  const surface = `${p.bg}${Math.round(
    (1 - (c.window === "Glass" ? Math.max(35, c.glass) : c.glass) / 100) * 255,
  )
    .toString(16)
    .padStart(2, "0")}`;
  return (
    <div
      className="card-scaled"
      style={{ width: c.width * scale, height: c.height * scale }}
    >
      <div
        className="card-art"
        ref={exportRef}
        style={{
          width: c.width,
          height: c.height,
          transform: `scale(${scale})`,
          padding: c.padding,
        }}
      >
        <div
          className="card-background"
          style={{
            background: backgroundCSS(c),
            filter: `blur(${c.bgBlur}px)`,
            opacity: c.bgOpacity / 100,
          }}
        />
        {c.grain > 0 && (
          <svg
            className="grain"
            style={{ opacity: (c.grain / 100) * (c.bgOpacity / 100) }}
            width="100%"
            height="100%"
          >
            <filter id="grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency=".8"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
            <rect
              width="100%"
              height="100%"
              filter="url(#grain)"
              opacity=".5"
            />
          </svg>
        )}
        <div
          className="code-stack"
          style={
            {
              // Identity transforms/filters still force a raster layer, which
              // blurs text once the preview is scaled down, so skip them.
              transform:
                c.perspective || c.rotation
                  ? `perspective(1200px) rotateY(${c.perspective}deg) rotate(${c.rotation}deg)`
                  : undefined,
              filter: c.blur ? `blur(${c.blur}px)` : undefined,
              WebkitBoxReflect: c.reflection
                ? `below 14px linear-gradient(transparent,rgba(255,255,255,${c.reflection / 100}))`
                : undefined,
            } as CSSProperties
          }
        >
          {c.blocks.map((b, index) => (
            <div
              key={b.id}
              className={`code-window window-${c.window.toLowerCase()}`}
              title="Click to edit this code"
              onClick={() => onPickBlock?.(index)}
              style={{
                background: c.gradientBorder
                  ? `linear-gradient(${surface},${surface}) padding-box,linear-gradient(135deg,${c.color},${c.color2}) border-box`
                  : surface,
                color: p.fg,
                borderRadius: c.radius,
                border: `${c.border}px solid ${c.gradientBorder ? "transparent" : "#ffffff26"}`,
                boxShadow: `0 ${c.shadow / 2}px ${c.shadow}px #0005,0 0 ${c.glow}px ${c.color}88,${c.depth}px ${c.depth}px 0 #0005`,
                backdropFilter:
                  c.glass || c.window === "Glass" ? "blur(16px)" : undefined,
              }}
            >
              {(c.fileName || c.controls) && (
                <div className="code-window-bar">
                  {c.controls && (
                    <span className="window-buttons">
                      {c.window === "Windows" ? (
                        "−  □  ×"
                      ) : c.window === "Terminal" ? (
                        "❯_"
                      ) : c.window === "Minimal" ? (
                        "•••"
                      ) : (
                        <>
                          <i />
                          <i />
                          <i />
                        </>
                      )}
                    </span>
                  )}
                  {c.fileName && (
                    <span className="code-filename">{b.name}</span>
                  )}
                  <span className="language-badge">{b.label}</span>
                </div>
              )}
              <CodeView card={c} block={b} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

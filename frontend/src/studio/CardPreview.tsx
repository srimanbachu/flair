import { useEffect } from "react";
import type { CSSProperties, RefObject } from "react";
import type { Card } from "./model";
import { backgroundCSS, palettes } from "./model";
import { CodeView } from "./CodeView";
export function CardPreview({
  card: c,
  exportRef,
  scale,
  size,
  onMeasure,
  onPickBlock,
  onCodeChange,
}: {
  card: Card;
  exportRef: RefObject<HTMLDivElement | null>;
  scale: number;
  size: { w: number; h: number };
  onMeasure: (size: { w: number; h: number }) => void;
  onPickBlock?: (index: number) => void;
  onCodeChange: (id: string, code: string) => void;
}) {
  const p = palettes[c.theme] || palettes.Midnight;
  useEffect(() => {
    const el = exportRef.current;
    if (!el) return;
    // offsetWidth/Height ignore the preview's scale transform.
    const measure = () => onMeasure({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [exportRef, onMeasure]);
  const surface = `${p.bg}${Math.round(
    (1 - (c.window === "Glass" ? Math.max(35, c.glass) : c.glass) / 100) * 255,
  )
    .toString(16)
    .padStart(2, "0")}`;
  return (
    <div
      className="card-scaled"
      style={{ width: size.w * scale, height: size.h * scale }}
    >
      <div
        className={`card-art ${c.autoSize ? "card-auto" : ""}`}
        ref={exportRef}
        style={{
          width: c.autoSize ? undefined : c.width,
          height: c.autoSize ? undefined : c.height,
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
              onClick={(e) => {
                onPickBlock?.(index);
                if (!(e.target instanceof HTMLTextAreaElement))
                  e.currentTarget
                    .querySelector<HTMLTextAreaElement>(".code-editor")
                    ?.focus();
              }}
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
                  <span className="bar-side">
                    {c.controls && c.window !== "Windows" && (
                      <span className="window-buttons">
                        {c.window === "Terminal" ? (
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
                    {c.window === "Windows" && c.fileName && (
                      <span className="code-filename">{b.name}</span>
                    )}
                  </span>
                  <span className="code-filename">
                    {c.fileName && c.window !== "Windows" ? b.name : ""}
                  </span>
                  <span className="bar-side end">
                    <span className="language-badge">{b.label}</span>
                    {c.controls && c.window === "Windows" && (
                      // Windows puts minimise / maximise / close on the right.
                      <svg
                        className="windows-controls"
                        width="132"
                        height="16"
                        viewBox="0 0 132 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        aria-hidden="true"
                      >
                        <path d="M16 8h12" />
                        <rect x="60" y="2" width="12" height="12" rx="1.5" />
                        <path d="M104 2l12 12M116 2l-12 12" />
                      </svg>
                    )}
                  </span>
                </div>
              )}
              <div className="code-body">
                <CodeView card={c} block={b} />
                {/* A transparent textarea laid exactly over the highlighted
                    code: you see the colours, the caret and selection come
                    from the textarea. It is filtered out of exports. */}
                <textarea
                  className="code-editor"
                  aria-label={`Code block ${index + 1}`}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  value={b.code}
                  onChange={(e) => onCodeChange(b.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") e.currentTarget.blur();
                    if (e.key !== "Tab" || e.shiftKey) return;
                    e.preventDefault();
                    const el = e.currentTarget;
                    const start = el.selectionStart;
                    onCodeChange(
                      b.id,
                      el.value.slice(0, start) +
                        "  " +
                        el.value.slice(el.selectionEnd),
                    );
                    requestAnimationFrame(() =>
                      el.setSelectionRange(start + 2, start + 2),
                    );
                  }}
                  style={{
                    fontFamily: c.font,
                    fontSize: c.fontSize,
                    lineHeight: c.lineHeight,
                    letterSpacing: c.letterSpacing,
                    caretColor: p.fg,
                    paddingLeft: 28 + (c.lineNumbers ? 38 : 0),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

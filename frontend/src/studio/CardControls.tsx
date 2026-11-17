import { useRef, useState } from "react";
import { Copy, Download, ImageUp } from "lucide-react";
import { Field, Slider, Toggle } from "./Controls";
import type { Card } from "./model";
import { backgroundNames, backgroundCSS, palettes, sizes } from "./model";
import { cardTemplate, templateNames } from "./templates";
import { readImage } from "./storage";

const fonts: [string, string][] = [
  ["Mono", "monospace"],
  ["SF Mono", '"SFMono-Regular", Consolas, monospace'],
  ["Menlo", "Menlo, monospace"],
  ["Courier", '"Courier New", monospace'],
  ["Serif", "Georgia, serif"],
  ["Sans", "system-ui, sans-serif"],
];
const solidColors = [
  "#0b0b0d",
  "#1c1c21",
  "#2e2e35",
  "#e7e5e0",
  "#ffffff",
  "#f6e2b3",
  "#f4b8a8",
  "#f2b5d4",
  "#c9bdf5",
  "#b3cdf6",
  "#b5e3c4",
  "#9fe0d8",
  "#1e3a5f",
  "#14403b",
  "#5b2a1c",
  "#3b1d4f",
];
const gradientNames = backgroundNames.filter(
  (n) => !["Solid", "Image"].includes(n),
);
/** Backgrounds built from the two custom colours. */
const customGradients = ["Gradient", "Mesh", "Radial", "Blobs"];
export function CardControls({
  card: c,
  change,
  tab,
  notify,
  size,
  onExport,
  onCopyImage,
}: {
  card: Card;
  change: (c: Card) => void;
  tab: string;
  notify: (s: string) => void;
  size: { w: number; h: number };
  onExport: (format: "png" | "jpeg") => void;
  onCopyImage: () => void;
}) {
  const [sizeChoice, setSizeChoice] = useState("Custom");
  const [bgMode, setBgMode] = useState<"Solid" | "Gradient" | "Image">(
    c.background === "Solid"
      ? "Solid"
      : c.background === "Image"
        ? "Image"
        : "Gradient",
  );
  const imageInput = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Card>(key: K, value: Card[K]) =>
    change({ ...c, [key]: value });
  const slider = (
    key: keyof Card,
    label: string,
    min: number,
    max: number,
    step = 1,
    unit = "",
  ) => (
    <Slider
      key={key}
      label={label}
      value={c[key] as number}
      onChange={(v) => set(key, v)}
      min={min}
      max={max}
      step={step}
      unit={unit}
    />
  );
  return (
    <>
      <h2 className="inspector-title">{tab}</h2>
      {tab === "Typography" && (
        <>
          <span className="menu-label">Theme</span>
          <div className="theme-list">
            {Object.entries(palettes).map(([name, p]) => (
              <button
                key={name}
                aria-pressed={c.theme === name}
                className={c.theme === name ? "on" : ""}
                onClick={() => set("theme", name)}
              >
                <span className="theme-chip" style={{ background: p.bg }}>
                  {[p.keyword, p.string, p.number].map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
                {name}
              </button>
            ))}
          </div>
          <span className="menu-label">Font</span>
          <div className="font-grid" role="group" aria-label="Font family">
            {fonts.map(([label, family]) => (
              <button
                key={family}
                aria-pressed={c.font === family}
                className={c.font === family ? "on" : ""}
                style={{ fontFamily: family }}
                onClick={() => set("font", family)}
              >
                {label}
              </button>
            ))}
          </div>
          {slider("fontSize", "Size", 10, 40, 1, "px")}
          {slider("lineHeight", "Line height", 1, 2.5, 0.05)}
          {slider("letterSpacing", "Letter spacing", -1, 4, 0.1, "px")}
          <Toggle
            label="Line numbers"
            value={c.lineNumbers}
            onChange={(v) => set("lineNumbers", v)}
          />
        </>
      )}
      {tab === "Background" && (
        <>
          <div className="segmented" role="group" aria-label="Background type">
            {(["Solid", "Gradient", "Image"] as const).map((m) => (
              <button
                key={m}
                aria-pressed={bgMode === m}
                className={bgMode === m ? "active" : ""}
                onClick={() => setBgMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
          {bgMode === "Solid" && (
            <div className="color-grid" role="group" aria-label="Solid colors">
              {solidColors.map((color) => {
                const on = c.background === "Solid" && c.color === color;
                return (
                  <button
                    key={color}
                    className={`color-dot ${on ? "on" : ""}`}
                    style={{ background: color }}
                    aria-label={`Solid ${color}`}
                    aria-pressed={on}
                    onClick={() => change({ ...c, background: "Solid", color })}
                  />
                );
              })}
              <label className="color-dot custom" title="Custom color">
                <input
                  type="color"
                  aria-label="Custom solid color"
                  value={c.color}
                  onChange={(e) =>
                    change({ ...c, background: "Solid", color: e.target.value })
                  }
                />
              </label>
            </div>
          )}
          {bgMode === "Gradient" && (
            <>
              <div className="gradient-grid">
                {gradientNames.map((name) => (
                  <button
                    key={name}
                    title={name}
                    aria-label={name}
                    aria-pressed={c.background === name}
                    className={c.background === name ? "on" : ""}
                    style={{
                      background: backgroundCSS({ ...c, background: name }),
                    }}
                    onClick={() => set("background", name)}
                  />
                ))}
              </div>
              {customGradients.includes(c.background) && (
                <div className="color-pair">
                  <span>Colors</span>
                  {(["color", "color2"] as const).map((k, i) => (
                    <label
                      key={k}
                      className="color-dot custom-solid"
                      style={{ background: c[k] }}
                    >
                      <input
                        type="color"
                        aria-label={i ? "Secondary color" : "Primary color"}
                        value={c[k]}
                        onChange={(e) => set(k, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
          {bgMode === "Image" && (
            <div className="image-drop">
              {c.image ? (
                <>
                  <span
                    className="image-thumb"
                    style={{ backgroundImage: `url("${c.image}")` }}
                  />
                  <button
                    onClick={() =>
                      change({ ...c, image: "", background: "Aurora" })
                    }
                  >
                    Remove uploaded image
                  </button>
                </>
              ) : (
                <button onClick={() => imageInput.current?.click()}>
                  <ImageUp size={16} strokeWidth={1.75} />
                  Upload an image
                  <small>PNG, JPG, WebP or GIF · up to 5 MB</small>
                </button>
              )}
            </div>
          )}
          <input
            ref={imageInput}
            hidden
            type="file"
            aria-label="Upload background"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f)
                try {
                  change({
                    ...c,
                    image: await readImage(f),
                    background: "Image",
                  });
                  setBgMode("Image");
                } catch (err) {
                  notify(String(err));
                }
            }}
          />
          <span className="menu-label">Adjust</span>
          {slider("bgOpacity", "Background opacity", 0, 100, 1, "%")}
          {slider("bgBlur", "Background blur", 0, 40, 1, "px")}
          {slider("grain", "Grain", 0, 50, 1, "%")}
        </>
      )}
      {tab === "Window" && (
        <>
          <div className="window-grid" role="group" aria-label="Window style">
            {["macOS", "Windows", "Minimal", "Terminal", "Glass"].map((n) => (
              <button
                key={n}
                aria-label={n}
                aria-pressed={c.window === n}
                className={c.window === n ? "on" : ""}
                onClick={() => set("window", n)}
              >
                <span className={`mini-window mini-${n.toLowerCase()}`}>
                  <span className="mini-bar">
                    {n === "Windows" ? (
                      <em>— ▢ ✕</em>
                    ) : n === "Terminal" ? (
                      <em>❯_</em>
                    ) : n === "Minimal" ? null : (
                      <>
                        <i />
                        <i />
                        <i />
                      </>
                    )}
                  </span>
                  <span className="mini-line" />
                  <span className="mini-line short" />
                </span>
                {n}
              </button>
            ))}
          </div>
          <Toggle
            label="Show file names"
            value={c.fileName}
            onChange={(v) => set("fileName", v)}
          />
          <Toggle
            label="Show window controls"
            value={c.controls}
            onChange={(v) => set("controls", v)}
          />
          {slider("padding", "Outer spacing", 16, 160, 1, "px")}
          {slider("radius", "Corner radius", 0, 40, 1, "px")}
        </>
      )}
      {tab === "Effects" && (
        <>
          <span className="menu-label">Light</span>
          {slider("shadow", "Shadow", 0, 100, 1, "px")}
          {slider("glow", "Glow", 0, 80, 1, "px")}
          {slider("reflection", "Reflection", 0, 50, 1, "%")}
          <span className="menu-label">Edges</span>
          {slider("border", "Border", 0, 8, 1, "px")}
          <Toggle
            label="Gradient border"
            value={c.gradientBorder}
            onChange={(v) => set("gradientBorder", v)}
          />
          <span className="menu-label">Glass</span>
          {slider("glass", "Glass transparency", 0, 70, 1, "%")}
          {slider("blur", "Window blur", 0, 8, 0.5, "px")}
          <span className="menu-label">Depth</span>
          {slider("depth", "Depth", 0, 20, 1, "px")}
          {slider("perspective", "Perspective tilt", -25, 25, 1, "°")}
          {slider("rotation", "Rotation", -20, 20, 1, "°")}
        </>
      )}
      {tab === "Templates" && (
        <>
          <p className="muted">
            Replaces the current card. Undo with ⌘/Ctrl Z.
          </p>
          <div className="template-grid">
            {templateNames.map((name, i) => (
              <button key={name} onClick={() => change(cardTemplate(name))}>
                <span
                  className="template-art"
                  style={{
                    background: backgroundCSS({
                      ...c,
                      background: backgroundNames[i % 8],
                    }),
                  }}
                >
                  <i />
                </span>
                {name}
              </button>
            ))}
          </div>
        </>
      )}
      {tab === "Export" && (
        <>
          <span className="menu-label">Size</span>
          <div
            className="size-grid"
            role="group"
            aria-label="Export dimensions"
          >
            <button
              aria-pressed={c.autoSize}
              className={`size-auto ${c.autoSize ? "active" : ""}`}
              onClick={() => change({ ...c, autoSize: true })}
            >
              <span className="ratio ratio-auto" />
              Fit to code
            </button>
            {Object.entries(sizes).map(([name, [w, h]]) => {
              // Several presets share dimensions (X post / 16:9); prefer the
              // one the user clicked, otherwise the first that matches.
              const fits = (n: string) =>
                sizes[n]?.[0] === c.width && sizes[n]?.[1] === c.height;
              const current = fits(sizeChoice)
                ? sizeChoice
                : Object.keys(sizes).find(fits);
              const on = !c.autoSize && current === name;
              return (
                <button
                  key={name}
                  aria-pressed={on}
                  className={on ? "active" : ""}
                  onClick={() => {
                    setSizeChoice(name);
                    change({ ...c, autoSize: false, width: w, height: h });
                  }}
                >
                  <span
                    className="ratio"
                    style={{
                      width: 18 * Math.min(1, w / h),
                      height: 18 * Math.min(1, h / w),
                    }}
                  />
                  {name}
                </button>
              );
            })}
          </div>
          <div className="two-col">
            <Field label="Width (px)">
              <input
                type="number"
                min={320}
                max={2400}
                key={`width-${c.autoSize ? "auto" : c.width}`}
                defaultValue={c.autoSize ? Math.round(size.w) : c.width}
                onBlur={(e) => {
                  const v = Math.max(320, Math.min(2400, +e.target.value));
                  if (c.autoSize && v === Math.round(size.w)) return;
                  change({ ...c, autoSize: false, width: v });
                }}
              />
            </Field>
            <Field label="Height (px)">
              <input
                type="number"
                min={320}
                max={2400}
                key={`height-${c.autoSize ? "auto" : c.height}`}
                defaultValue={c.autoSize ? Math.round(size.h) : c.height}
                onBlur={(e) => {
                  const v = Math.max(320, Math.min(2400, +e.target.value));
                  if (c.autoSize && v === Math.round(size.h)) return;
                  change({ ...c, autoSize: false, height: v });
                }}
              />
            </Field>
          </div>
          <span className="menu-label">Quality</span>
          <div className="segmented" role="group" aria-label="Export quality">
            {[1, 2, 3].map((q) => (
              <button
                key={q}
                aria-pressed={c.quality === q}
                className={c.quality === q ? "active" : ""}
                onClick={() => set("quality", q)}
              >
                {q}×
              </button>
            ))}
          </div>
          <p className="muted export-note">
            {Math.round(size.w) * c.quality} × {Math.round(size.h) * c.quality}{" "}
            px · PNG keeps transparency, JPEG adds a dark base.
          </p>
          <div className="export-actions">
            <button className="primary" onClick={() => onExport("png")}>
              <Download size={15} />
              Download PNG
            </button>
            <button onClick={() => onExport("jpeg")}>Download JPEG</button>
            <button onClick={onCopyImage}>
              <Copy size={14} />
              Copy image
            </button>
          </div>
        </>
      )}
    </>
  );
}

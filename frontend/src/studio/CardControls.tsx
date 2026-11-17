import { useState } from "react";
import { Copy, Download, Trash2 } from "lucide-react";
import { Field, Slider, Toggle } from "./Controls";
import type { Annotation, Card, CodeBlock } from "./model";
import {
  backgroundNames,
  backgroundCSS,
  makeBlock,
  palettes,
  sizes,
  uid,
} from "./model";
import { cardTemplate, templateNames } from "./templates";
import { readImage } from "./storage";

const annotationKinds = [
  "arrow",
  "circle",
  "rectangle",
  "underline",
  "label",
  "marker",
  "callout",
  "emoji",
  "sticker",
];
/** These render as a glyph, so they have no editable text. */
const shapeAnnotations = ["arrow", "circle", "rectangle", "underline"];
const languages = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "python",
  "json",
  "sql",
  "bash",
  "css",
  "markup",
  "c",
  "cpp",
  "plain",
];
export function CardControls({
  card: c,
  change,
  tab,
  notify,
  onExport,
  onCopyImage,
}: {
  card: Card;
  change: (c: Card) => void;
  tab: string;
  notify: (s: string) => void;
  onExport: (format: "png" | "jpeg") => void;
  onCopyImage: () => void;
}) {
  const [sizeChoice, setSizeChoice] = useState("Custom");
  const set = <K extends keyof Card>(key: K, value: Card[K]) =>
    change({ ...c, [key]: value });
  const annotate = (id: string, patch: Partial<Annotation>) =>
    set(
      "annotations",
      c.annotations.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    );
  const block = (id: string, patch: Partial<CodeBlock>) =>
    set(
      "blocks",
      c.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
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
      {tab === "Code" && (
        <>
          {c.blocks.map((b, i) => {
            const effects = [
              b.highlights,
              b.words,
              b.blur,
              b.glow,
              b.comment,
            ].filter((v) => v.trim()).length;
            return (
              <section className="block-card" key={b.id}>
                <div className="block-head">
                  <input
                    className="block-name"
                    aria-label={`File name for block ${i + 1}`}
                    placeholder="file name"
                    value={b.name}
                    onChange={(e) => block(b.id, { name: e.target.value })}
                  />
                  <select
                    aria-label={`Language for block ${i + 1}`}
                    value={b.language}
                    onChange={(e) => block(b.id, { language: e.target.value })}
                  >
                    {languages.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <button
                    className="icon-btn"
                    title="Copy code"
                    aria-label="Copy code"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(b.code);
                        notify("Code copied.");
                      } catch {
                        notify(
                          "Clipboard is unavailable. Select and copy the code from the editor.",
                        );
                      }
                    }}
                  >
                    <Copy size={14} strokeWidth={1.75} />
                  </button>
                  {c.blocks.length > 1 && (
                    <button
                      className="icon-btn"
                      title="Remove block"
                      aria-label={`Remove block ${i + 1}`}
                      onClick={() =>
                        set(
                          "blocks",
                          c.blocks.filter((x) => x.id !== b.id),
                        )
                      }
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
                <textarea
                  className="code-input"
                  aria-label={`Code block ${i + 1}`}
                  spellCheck={false}
                  rows={Math.min(
                    18,
                    Math.max(6, b.code.split("\n").length + 1),
                  )}
                  value={b.code}
                  onChange={(e) => block(b.id, { code: e.target.value })}
                  onKeyDown={(e) => {
                    // Tab indents; Escape releases focus so Tab can move on.
                    if (e.key === "Escape") e.currentTarget.blur();
                    if (e.key !== "Tab" || e.shiftKey) return;
                    e.preventDefault();
                    const el = e.currentTarget;
                    const start = el.selectionStart;
                    const next =
                      el.value.slice(0, start) +
                      "  " +
                      el.value.slice(el.selectionEnd);
                    block(b.id, { code: next });
                    requestAnimationFrame(() =>
                      el.setSelectionRange(start + 2, start + 2),
                    );
                  }}
                />
                <details className="block-more">
                  <summary>
                    Line effects
                    {effects > 0 && <span className="count">{effects}</span>}
                  </summary>
                  <Field label="Highlight lines" hint="Ranges like 2-5, 8, 12">
                    <input
                      placeholder="2-5, 8"
                      value={b.highlights}
                      onChange={(e) =>
                        block(b.id, { highlights: e.target.value })
                      }
                    />
                  </Field>
                  <Field
                    label="Highlight words"
                    hint="Exact words, comma separated"
                  >
                    <input
                      placeholder="create, Infinity"
                      value={b.words}
                      onChange={(e) => block(b.id, { words: e.target.value })}
                    />
                  </Field>
                  <div className="two-col">
                    <Field label="Blur lines">
                      <input
                        placeholder="4-6"
                        value={b.blur}
                        onChange={(e) => block(b.id, { blur: e.target.value })}
                      />
                    </Field>
                    <Field label="Glow lines">
                      <input
                        placeholder="3, 7"
                        value={b.glow}
                        onChange={(e) => block(b.id, { glow: e.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="two-col">
                    <Field label="Comment dots">
                      <input
                        placeholder="2, 8"
                        value={b.comment}
                        onChange={(e) =>
                          block(b.id, { comment: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Corner label">
                      <input
                        value={b.label}
                        onChange={(e) => block(b.id, { label: e.target.value })}
                      />
                    </Field>
                  </div>
                  <small className="muted">
                    Blur is only visual. Remove secrets before sharing project
                    files.
                  </small>
                </details>
              </section>
            );
          })}
          <button
            className="wide dashed"
            disabled={c.blocks.length >= 30}
            onClick={() =>
              set("blocks", [
                ...c.blocks,
                makeBlock("// Another part of the story", "example.ts"),
              ])
            }
          >
            + Add code block
          </button>
        </>
      )}
      {tab === "Typography" && (
        <>
          <span className="menu-label">Syntax theme</span>
          <div className="swatch-grid">
            {Object.entries(palettes).map(([name, p]) => (
              <button
                key={name}
                className={c.theme === name ? "swatch chosen" : "swatch"}
                style={{ background: p.bg, color: p.fg }}
                onClick={() => set("theme", name)}
              >
                <span style={{ color: p.keyword }}>const</span>{" "}
                <span style={{ color: p.string }}>flair</span>
                <small>{name}</small>
              </button>
            ))}
          </div>
          <Field label="Font family">
            <select
              value={c.font}
              onChange={(e) => set("font", e.target.value)}
            >
              {[
                "monospace",
                '"SFMono-Regular", Consolas, monospace',
                '"Courier New", monospace',
                "Menlo, monospace",
                "Georgia, serif",
                "system-ui, sans-serif",
              ].map((f, i) => (
                <option key={f} value={f}>
                  {
                    [
                      "System mono",
                      "SF Mono / Consolas",
                      "Courier New",
                      "Menlo",
                      "Georgia",
                      "System sans",
                    ][i]
                  }
                </option>
              ))}
            </select>
          </Field>
          {slider("fontSize", "Font size", 10, 40, 1, "px")}
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
          <div className="swatch-grid">
            {backgroundNames.map((name) => (
              <button
                key={name}
                className={`bg-swatch ${c.background === name ? "chosen" : ""}`}
                style={{
                  background: backgroundCSS({ ...c, background: name }),
                }}
                onClick={() => set("background", name)}
              >
                <span>{name}</span>
              </button>
            ))}
          </div>
          <div className="two-col">
            <Field label="Primary">
              <input
                type="color"
                value={c.color}
                onChange={(e) => set("color", e.target.value)}
              />
            </Field>
            <Field label="Secondary">
              <input
                type="color"
                value={c.color2}
                onChange={(e) => set("color2", e.target.value)}
              />
            </Field>
          </div>
          <Field
            label="Upload background"
            hint="PNG, JPG, WebP, GIF · up to 5 MB"
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f)
                  try {
                    change({
                      ...c,
                      image: await readImage(f),
                      background: "Image",
                    });
                  } catch (err) {
                    notify(String(err));
                  }
              }}
            />
          </Field>
          {c.image && (
            <button
              onClick={() => change({ ...c, image: "", background: "Aurora" })}
            >
              Remove uploaded image
            </button>
          )}
          {slider("bgBlur", "Background blur", 0, 40, 1, "px")}
          {slider("bgOpacity", "Background opacity", 0, 100, 1, "%")}
          {slider("grain", "Noise / grain", 0, 50, 1, "%")}
        </>
      )}
      {tab === "Window" && (
        <>
          <span className="menu-label">Style</span>
          <div className="chip-grid" role="group" aria-label="Window style">
            {["macOS", "Windows", "Minimal", "Terminal", "Glass"].map((n) => (
              <button
                key={n}
                aria-pressed={c.window === n}
                className={c.window === n ? "active" : ""}
                onClick={() => set("window", n)}
              >
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
      {tab === "Annotations" && (
        <>
          <p className="muted">
            Add a detail, then drag it into place on the preview.
          </p>
          <div className="chip-grid">
            {annotationKinds.map((kind) => (
              <button
                key={kind}
                onClick={() =>
                  set("annotations", [
                    ...c.annotations,
                    {
                      id: uid(),
                      kind,
                      text:
                        (
                          {
                            emoji: "✨",
                            sticker: "🚀",
                            marker: String(c.annotations.length + 1),
                            label: "Look here",
                            callout: "A little detail that matters",
                          } as Record<string, string>
                        )[kind] || "",
                      x: 30,
                      y: 30,
                      color: "#ffe08a",
                      size: 24,
                    },
                  ])
                }
              >
                + {kind}
              </button>
            ))}
          </div>
          {c.annotations.map((a) => (
            <section className="block-card annotation-card" key={a.id}>
              <div className="block-head">
                <strong>{a.kind}</strong>
                <input
                  type="color"
                  aria-label={`${a.kind} color`}
                  value={a.color}
                  onChange={(e) => annotate(a.id, { color: e.target.value })}
                />
                <button
                  className="icon-btn"
                  aria-label={`Remove ${a.kind}`}
                  title="Remove"
                  onClick={() =>
                    set(
                      "annotations",
                      c.annotations.filter((x) => x.id !== a.id),
                    )
                  }
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>
              <div className="annotation-body">
                {!shapeAnnotations.includes(a.kind) && (
                  <input
                    aria-label="Text"
                    value={a.text}
                    onChange={(e) => annotate(a.id, { text: e.target.value })}
                  />
                )}
                <Slider
                  label="Size"
                  min={12}
                  max={80}
                  value={a.size}
                  onChange={(size) => annotate(a.id, { size })}
                />
              </div>
            </section>
          ))}
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
            {Object.entries(sizes).map(([name, [w, h]]) => {
              // Several presets share dimensions (X post / 16:9); prefer the
              // one the user clicked, otherwise the first that matches.
              const fits = (n: string) =>
                sizes[n]?.[0] === c.width && sizes[n]?.[1] === c.height;
              const current = fits(sizeChoice)
                ? sizeChoice
                : Object.keys(sizes).find(fits);
              const on = current === name;
              return (
                <button
                  key={name}
                  aria-pressed={on}
                  className={on ? "active" : ""}
                  onClick={() => {
                    setSizeChoice(name);
                    change({ ...c, width: w, height: h });
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
                key={`width-${c.width}`}
                defaultValue={c.width}
                onBlur={(e) =>
                  set("width", Math.max(320, Math.min(2400, +e.target.value)))
                }
              />
            </Field>
            <Field label="Height (px)">
              <input
                type="number"
                min={320}
                max={2400}
                key={`height-${c.height}`}
                defaultValue={c.height}
                onBlur={(e) =>
                  set("height", Math.max(320, Math.min(2400, +e.target.value)))
                }
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
            {c.width * c.quality} × {c.height * c.quality} px · PNG keeps
            transparency, JPEG adds a dark base.
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

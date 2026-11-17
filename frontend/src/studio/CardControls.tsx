import { useState } from "react";
import { Field, Slider, Toggle } from "./Controls";
import type { Card, CodeBlock } from "./model";
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

export function CardControls({
  card: c,
  change,
  tab,
  notify,
}: {
  card: Card;
  change: (c: Card) => void;
  tab: string;
  notify: (s: string) => void;
}) {
  const [sizeChoice, setSizeChoice] = useState("Custom");
  const set = <K extends keyof Card>(key: K, value: Card[K]) =>
    change({ ...c, [key]: value });
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
          {c.blocks.map((b, i) => (
            <section className="control-section" key={b.id}>
              <div className="section-title">
                <h3>Code block {i + 1}</h3>
                <button
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
                  Copy code
                </button>
                {c.blocks.length > 1 && (
                  <button
                    onClick={() =>
                      set(
                        "blocks",
                        c.blocks.filter((x) => x.id !== b.id),
                      )
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
              <Field label="File name">
                <input
                  value={b.name}
                  onChange={(e) => block(b.id, { name: e.target.value })}
                />
              </Field>
              <div className="two-col">
                <Field label="Language">
                  <select
                    value={b.language}
                    onChange={(e) => block(b.id, { language: e.target.value })}
                  >
                    {[
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
                    ].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Custom label">
                  <input
                    value={b.label}
                    onChange={(e) => block(b.id, { label: e.target.value })}
                  />
                </Field>
              </div>
              <textarea
                className="code-input"
                aria-label={`Code block ${i + 1}`}
                spellCheck={false}
                value={b.code}
                onChange={(e) => block(b.id, { code: e.target.value })}
              />
              <Field label="Highlight lines" hint="Use ranges: 2-5, 8, 12">
                <input
                  placeholder="2-5, 8"
                  value={b.highlights}
                  onChange={(e) => block(b.id, { highlights: e.target.value })}
                />
              </Field>
              <Field
                label="Highlight words"
                hint="Separate exact words with commas"
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
              <Field label="Comment indicators on lines">
                <input
                  placeholder="2, 8"
                  value={b.comment}
                  onChange={(e) => block(b.id, { comment: e.target.value })}
                />
              </Field>
              <small className="muted">
                Blur is a visual effect. Remove secrets before sharing project
                files.
              </small>
            </section>
          ))}
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
          <h3>Syntax theme</h3>
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
          <Field label="Window style">
            <select
              value={c.window}
              onChange={(e) => set("window", e.target.value)}
            >
              {["macOS", "Windows", "Minimal", "Terminal", "Glass"].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </Field>
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
          {slider("shadow", "Shadow", 0, 100, 1, "px")}
          {slider("glow", "Glow", 0, 80, 1, "px")}
          {slider("border", "Border", 0, 8, 1, "px")}
          <Toggle
            label="Gradient border"
            value={c.gradientBorder}
            onChange={(v) => set("gradientBorder", v)}
          />
          {slider("reflection", "Reflection", 0, 50, 1, "%")}
          {slider("blur", "Window blur", 0, 8, 0.5, "px")}
          {slider("glass", "Glass transparency", 0, 70, 1, "%")}
          {slider("depth", "Depth", 0, 20, 1, "px")}
          {slider("perspective", "Perspective tilt", -25, 25, 1, "°")}
          {slider("rotation", "Rotation", -20, 20, 1, "°")}
        </>
      )}
      {tab === "Annotations" && (
        <>
          <p className="muted">
            Add a detail, then drag it into position on the preview.
          </p>
          <div className="button-grid">
            {[
              "arrow",
              "circle",
              "rectangle",
              "underline",
              "label",
              "marker",
              "callout",
              "emoji",
              "sticker",
            ].map((kind) => (
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
            <section className="control-section" key={a.id}>
              <div className="section-title">
                <h3>{a.kind}</h3>
                <button
                  onClick={() =>
                    set(
                      "annotations",
                      c.annotations.filter((x) => x.id !== a.id),
                    )
                  }
                >
                  Remove
                </button>
              </div>
              <Field label="Text">
                <input
                  value={a.text}
                  onChange={(e) =>
                    set(
                      "annotations",
                      c.annotations.map((x) =>
                        x.id === a.id ? { ...x, text: e.target.value } : x,
                      ),
                    )
                  }
                />
              </Field>
              <Field label="Color">
                <input
                  type="color"
                  value={a.color}
                  onChange={(e) =>
                    set(
                      "annotations",
                      c.annotations.map((x) =>
                        x.id === a.id ? { ...x, color: e.target.value } : x,
                      ),
                    )
                  }
                />
              </Field>
              <Slider
                label="Size"
                min={12}
                max={80}
                value={a.size}
                onChange={(v) =>
                  set(
                    "annotations",
                    c.annotations.map((x) =>
                      x.id === a.id ? { ...x, size: v } : x,
                    ),
                  )
                }
              />
              <div className="two-col">
                {(["x", "y"] as const).map((axis) => (
                  <Slider
                    key={axis}
                    label={`${axis.toUpperCase()} position`}
                    min={0}
                    max={95}
                    value={Math.round(a[axis])}
                    onChange={(v) =>
                      set(
                        "annotations",
                        c.annotations.map((x) =>
                          x.id === a.id ? { ...x, [axis]: v } : x,
                        ),
                      )
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
      {tab === "Templates" && (
        <>
          <p className="muted">
            Applying a template replaces the current card. Save your work first.
          </p>
          <div className="template-list">
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
                  ⌘
                </span>
                <span>
                  {name}
                  <small>Use template ↗</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
      {tab === "Export" && (
        <>
          <Field label="Export dimensions">
            <select
              value={
                sizes[sizeChoice]?.[0] === c.width &&
                sizes[sizeChoice]?.[1] === c.height
                  ? sizeChoice
                  : "Custom"
              }
              onChange={(e) => {
                setSizeChoice(e.target.value);
                const s = sizes[e.target.value];
                if (s) change({ ...c, width: s[0], height: s[1] });
              }}
            >
              <option>Custom</option>
              {Object.keys(sizes).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
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
          <Field label="Export quality">
            <select
              value={c.quality}
              onChange={(e) => set("quality", +e.target.value)}
            >
              <option value={1}>1× · Standard</option>
              <option value={2}>2× · High resolution</option>
              <option value={3}>3× · Ultra</option>
            </select>
          </Field>
          <p className="muted">
            Output: {c.width * c.quality} × {c.height * c.quality} pixels. PNG
            keeps transparency; JPEG adds a dark base.
          </p>
          <p className="muted">
            Use the Export button above to download. Project JSON preserves
            editable code and styling.
          </p>
        </>
      )}
    </>
  );
}

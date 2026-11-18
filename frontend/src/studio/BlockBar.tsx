import { useEffect, useRef } from "react";
import { Copy, Plus, Trash2, WandSparkles } from "lucide-react";
import { Field } from "./Controls";
import type { Card, CodeBlock } from "./model";
import { makeBlock } from "./model";

/** Language id → [label shown on the card, file extension]. */
const languages: Record<string, [string, string]> = {
  typescript: ["TypeScript", "ts"],
  javascript: ["JavaScript", "js"],
  tsx: ["TSX", "tsx"],
  jsx: ["JSX", "jsx"],
  python: ["Python", "py"],
  json: ["JSON", "json"],
  sql: ["SQL", "sql"],
  bash: ["Bash", "sh"],
  css: ["CSS", "css"],
  markup: ["HTML", "html"],
  c: ["C", "c"],
  cpp: ["C++", "cpp"],
  plain: ["Text", "txt"],
};

/** Settings for the code block last clicked on the card. */
export function BlockBar({
  card: c,
  active,
  setActive,
  change,
  notify,
}: {
  card: Card;
  active: number;
  setActive: (i: number) => void;
  change: (c: Card) => void;
  notify: (s: string) => void;
}) {
  const index = Math.min(active, c.blocks.length - 1);
  const b = c.blocks[index];
  const update = (patch: Partial<CodeBlock>) =>
    change({
      ...c,
      blocks: c.blocks.map((x) => (x.id === b.id ? { ...x, ...patch } : x)),
    });
  const effects = [b.highlights, b.words, b.blur, b.glow, b.comment].filter(
    (v) => v.trim(),
  ).length;
  // The effects popover closes on a press anywhere outside it, or Escape.
  const pop = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      const el = pop.current;
      if (!el?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        el.open = false;
        el.querySelector("summary")?.focus();
        return;
      }
      if (!el.contains(event.target as Node)) el.open = false;
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);
  return (
    <div className="block-bar" role="group" aria-label="Code block settings">
      {c.blocks.length > 1 && (
        <div className="block-tabs">
          {c.blocks.map((x, i) => (
            <button
              key={x.id}
              aria-pressed={i === index}
              className={i === index ? "active" : ""}
              onClick={() => setActive(i)}
              title={x.name || `Block ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
      <input
        className="block-name"
        aria-label="File name"
        placeholder="file name"
        value={b.name}
        onChange={(e) => update({ name: e.target.value })}
      />
      <select
        aria-label="Language"
        value={b.language}
        onChange={(e) => {
          const next = e.target.value;
          const [oldLabel, oldExt] = languages[b.language] || ["", ""];
          const [label, ext] = languages[next];
          // Follow the language unless the user wrote their own label/name.
          update({
            language: next,
            label: !b.label || b.label === oldLabel ? label : b.label,
            name:
              oldExt && b.name.endsWith(`.${oldExt}`)
                ? `${b.name.slice(0, -oldExt.length)}${ext}`
                : b.name,
          });
        }}
      >
        {Object.entries(languages).map(([id, [label]]) => (
          <option key={id} value={id}>
            {id === "plain" ? "Plain text" : label}
          </option>
        ))}
      </select>
      <details className="effects-pop" ref={pop}>
        <summary title="Highlight, blur or glow lines">
          <WandSparkles size={14} strokeWidth={1.75} />
          Line effects
          {effects > 0 && <span className="count">{effects}</span>}
        </summary>
        <div className="effects-body">
          <Field label="Highlight lines" hint="Ranges like 2-5, 8, 12">
            <input
              placeholder="2-5, 8"
              value={b.highlights}
              onChange={(e) => update({ highlights: e.target.value })}
            />
          </Field>
          <Field label="Highlight words" hint="Exact words, comma separated">
            <input
              placeholder="create, Infinity"
              value={b.words}
              onChange={(e) => update({ words: e.target.value })}
            />
          </Field>
          <div className="two-col">
            <Field label="Blur lines">
              <input
                placeholder="4-6"
                value={b.blur}
                onChange={(e) => update({ blur: e.target.value })}
              />
            </Field>
            <Field label="Glow lines">
              <input
                placeholder="3, 7"
                value={b.glow}
                onChange={(e) => update({ glow: e.target.value })}
              />
            </Field>
          </div>
          <div className="two-col">
            <Field label="Comment dots">
              <input
                placeholder="2, 8"
                value={b.comment}
                onChange={(e) => update({ comment: e.target.value })}
              />
            </Field>
            <Field label="Corner label">
              <input
                value={b.label}
                onChange={(e) => update({ label: e.target.value })}
              />
            </Field>
          </div>
          <small className="muted">
            Blur is only visual. Remove secrets before sharing project files.
          </small>
        </div>
      </details>
      <span className="block-bar-spacer" />
      <button
        className="icon-btn"
        title="Copy code"
        aria-label="Copy code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(b.code);
            notify("Code copied.");
          } catch {
            notify("Clipboard is unavailable. Select the code on the card.");
          }
        }}
      >
        <Copy size={14} strokeWidth={1.75} />
      </button>
      {c.blocks.length > 1 && (
        <button
          className="icon-btn"
          title="Remove this block"
          aria-label="Remove block"
          onClick={() => {
            change({ ...c, blocks: c.blocks.filter((x) => x.id !== b.id) });
            setActive(Math.max(0, index - 1));
          }}
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      )}
      <button
        className="add-block"
        disabled={c.blocks.length >= 30}
        onClick={() => {
          change({
            ...c,
            blocks: [
              ...c.blocks,
              makeBlock("// Another part of the story", "example.ts"),
            ],
          });
          setActive(c.blocks.length);
        }}
      >
        <Plus size={14} />
        Add block
      </button>
    </div>
  );
}

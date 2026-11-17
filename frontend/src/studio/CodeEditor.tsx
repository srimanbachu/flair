import { useRef, useState } from "react";
import type { Card, CodeBlock } from "./model";

const PAD_TOP = 23;
const PAD_LEFT = 28; // .syntax padding (26) + highlight border (2)
const NUMBERS = 38; // .line-number column

let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(text: string, font: string, spacing: number) {
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return 0;
  measureCtx.font = font;
  return measureCtx.measureText(text).width + spacing * text.length;
}

/**
 * A transparent textarea laid exactly over the highlighted code. You see
 * the syntax colours underneath; typing and selection come from the
 * textarea. Browsers cannot thicken the native caret, so it is hidden and
 * a wide caret is drawn at the measured cursor position instead. Both the
 * textarea and the caret are filtered out of exports.
 */
export function CodeEditor({
  card: c,
  block: b,
  index,
  ink,
  onChange,
}: {
  card: Card;
  block: CodeBlock;
  index: number;
  ink: string;
  onChange: (code: string) => void;
}) {
  const [caret, setCaret] = useState<{
    x: number;
    y: number;
    tick: number;
  } | null>(null);
  const tick = useRef(0);
  const lineHeight = c.fontSize * c.lineHeight;
  const place = (el: HTMLTextAreaElement) => {
    if (
      document.activeElement !== el ||
      el.selectionStart !== el.selectionEnd
    ) {
      setCaret(null);
      return;
    }
    const before = el.value.slice(0, el.selectionStart).split("\n");
    const line = before.length - 1;
    const column = before[line].replace(/\t/g, "  ");
    setCaret({
      x:
        PAD_LEFT +
        (c.lineNumbers ? NUMBERS : 0) +
        textWidth(column, `${c.fontSize}px ${c.font}`, c.letterSpacing),
      y: PAD_TOP + line * lineHeight,
      tick: ++tick.current, // restarts the blink so a moving caret stays solid
    });
  };
  const sync = (e: { currentTarget: HTMLTextAreaElement }) =>
    place(e.currentTarget);
  const caretHeight = c.fontSize * 1.2;
  return (
    <>
      <textarea
        className="code-editor"
        aria-label={`Code block ${index + 1}`}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        value={b.code}
        onChange={(e) => {
          onChange(e.target.value);
          sync(e);
        }}
        onSelect={sync}
        onKeyUp={sync}
        onMouseUp={sync}
        onFocus={sync}
        onBlur={() => setCaret(null)}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.currentTarget.blur();
          if (e.key !== "Tab" || e.shiftKey) return;
          e.preventDefault();
          const el = e.currentTarget;
          const start = el.selectionStart;
          onChange(
            el.value.slice(0, start) + "  " + el.value.slice(el.selectionEnd),
          );
          requestAnimationFrame(() => {
            el.setSelectionRange(start + 2, start + 2);
            place(el);
          });
        }}
        style={{
          fontFamily: c.font,
          fontSize: c.fontSize,
          lineHeight: c.lineHeight,
          letterSpacing: c.letterSpacing,
          paddingLeft: PAD_LEFT + (c.lineNumbers ? NUMBERS : 0),
        }}
      />
      {caret && (
        <span
          key={caret.tick}
          className="code-caret"
          aria-hidden="true"
          style={{
            left: caret.x,
            top: caret.y + (lineHeight - caretHeight) / 2,
            height: caretHeight,
            width: Math.max(3, c.fontSize * 0.14),
            background: ink,
          }}
        />
      )}
    </>
  );
}

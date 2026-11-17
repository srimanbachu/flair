import { useRef, useState, useEffect, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { Board, CanvasItem, Point } from "./canvasModel";
import { bounds, makeItem, boardTemplate, boardTemplates } from "./canvasModel";
import { CanvasShape } from "./CanvasShape";
import { Field, Slider, Toggle } from "./Controls";
import { uid } from "./model";
import { readImage } from "./storage";
import { validateBoard } from "./projectFiles";
const tools = [
  "select",
  "hand",
  "pen",
  "pencil",
  "brush",
  "eraser",
  "rectangle",
  "ellipse",
  "triangle",
  "diamond",
  "arrow",
  "line",
  "text",
  "sticky",
  "code",
  "icon",
  "frame",
];
const symbols: Record<string, string> = {
  select: "↖",
  hand: "✋",
  pen: "✎",
  pencil: "✐",
  brush: "🖌",
  eraser: "⌫",
  rectangle: "▭",
  ellipse: "○",
  triangle: "△",
  diamond: "◇",
  arrow: "↗",
  line: "╱",
  text: "T",
  sticky: "▣",
  code: "‹/›",
  icon: "⚛",
  frame: "▧",
};
export function Canvas({
  board,
  change,
  svgRef,
  notify,
}: {
  board: Board;
  change: (b: Board) => void;
  svgRef: RefObject<SVGSVGElement | null>;
  notify: (s: string) => void;
}) {
  const [tool, setTool] = useState("select");
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [draft, setDraft] = useState<CanvasItem[] | null>(null);
  const [comment, setComment] = useState("");
  const [marquee, setMarquee] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [present, setPresent] = useState(-1);
  const [live, setLive] = useState(false);
  const [room, setRoom] = useState("studio");
  const channel = useRef<BroadcastChannel | null>(null);
  const current = useRef({ board, change, notify });
  useEffect(() => {
    current.current = { board, change, notify };
  });
  useEffect(() => {
    if (!live || !room.trim()) return;
    if (!("BroadcastChannel" in window)) return;
    const c = new BroadcastChannel(`flair.canvas.${room.trim()}`);
    channel.current = c;
    c.onmessage = (event) => {
      if (event.data?.type === "request")
        c.postMessage({ type: "state", board: current.current.board });
      if (event.data?.type === "state") {
        try {
          current.current.change(validateBoard(event.data.board));
        } catch {
          current.current.notify(
            "A shared canvas update was invalid and was ignored.",
          );
        }
      }
    };
    c.postMessage({ type: "request" });
    return () => {
      c.close();
      channel.current = null;
    };
  }, [live, room]);
  const changeBoard = (next: Board) => {
    channel.current?.postMessage({ type: "state", board: next });
    change(next);
  };
  const gesture = useRef<{
    start: Point;
    screen: Point;
    items: CanvasItem[];
    ids: string[];
    kind: string;
    id?: string;
    view: typeof view;
  } | null>(null);
  const clipboard = useRef<CanvasItem[]>([]);
  const host = useRef<HTMLDivElement>(null);
  const presenting = present >= 0;
  /* Zoom around a screen point. Updates are coalesced to one per frame so
     fast trackpad/wheel streams stay smooth instead of queueing renders. */
  const pendingView = useRef<typeof view | null>(null);
  const frame = useRef(0);
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  const zoomAt = useCallback((factor: number, sx?: number, sy?: number) => {
    const r = host.current?.getBoundingClientRect();
    if (!r) return;
    const v = pendingView.current || viewRef.current;
    const x = sx ?? r.width / 2,
      y = sy ?? r.height / 2;
    const z = Math.max(0.1, Math.min(8, v.z * factor));
    pendingView.current = {
      z,
      x: x - ((x - v.x) * z) / v.z,
      y: y - ((y - v.y) * z) / v.z,
    };
    if (!frame.current)
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (pendingView.current) setView(pendingView.current);
        pendingView.current = null;
      });
  }, []);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    // Native, non-passive listener: React's onWheel is passive, so it cannot
    // stop the browser from zooming the whole page on pinch / Ctrl+wheel.
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (presenting) return;
      const r = el.getBoundingClientRect();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? r.height : 1;
      const delta = Math.max(-120, Math.min(120, e.deltaY * unit));
      // Pinch gestures arrive as ctrl+wheel with small deltas; boost them.
      const speed = e.ctrlKey || e.metaKey ? 0.012 : 0.004;
      zoomAt(Math.exp(-delta * speed), e.clientX - r.left, e.clientY - r.top);
    };
    const gesture = (e: Event) => e.preventDefault();
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("gesturestart", gesture);
    el.addEventListener("gesturechange", gesture);
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("gesturestart", gesture);
      el.removeEventListener("gesturechange", gesture);
    };
  }, [zoomAt, presenting]);
  const items = draft || board.items;
  const active = board.items.filter((i) => selected.includes(i.id));
  const first = active[0];
  const frames = board.items.filter((i) => i.kind === "frame");
  const commit = (next: CanvasItem[]) => changeBoard({ ...board, items: next });
  const patch = (p: Partial<CanvasItem>) =>
    commit(
      board.items.map((i) =>
        !selected.includes(i.id)
          ? i
          : {
              ...i,
              ...p,
              ...(["pen", "pencil", "brush"].includes(i.kind) &&
              (p.w !== undefined || p.h !== undefined)
                ? {
                    points: i.points.map((point) => ({
                      x: (point.x * (p.w ?? i.w)) / Math.max(1, i.w),
                      y: (point.y * (p.h ?? i.h)) / Math.max(1, i.h),
                    })),
                  }
                : {}),
            },
      ),
    );
  const duplicate = () => {
    const source = clipboard.current.length ? clipboard.current : active;
    const ids = new Map(source.map((i) => [i.id, uid()]));
    const groups = new Map(
      source.filter((i) => i.group).map((i) => [i.group, uid()]),
    );
    const copies = source.map((i) => ({
      ...i,
      id: ids.get(i.id)!,
      x: i.x + 24,
      y: i.y + 24,
      group: groups.get(i.group) || "",
      from: ids.get(i.from) || i.from,
      to: ids.get(i.to) || i.to,
    }));
    commit([...board.items, ...copies]);
    setSelected(copies.map((i) => i.id));
  };
  const remove = () => {
    commit(
      board.items.filter(
        (i) =>
          !selected.includes(i.id) &&
          !selected.includes(i.from) &&
          !selected.includes(i.to),
      ),
    );
    setSelected([]);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable]",
        )
      )
        return;
      if (
        (e.metaKey || e.ctrlKey) &&
        ["=", "+", "-", "_", "0"].includes(e.key)
      ) {
        // Keep browser page zoom away from the canvas.
        e.preventDefault();
        if (e.key === "0") setView((v) => ({ ...v, z: 1 }));
        else zoomAt(e.key === "-" || e.key === "_" ? 1 / 1.25 : 1.25);
        return;
      }
      if (e.key === "Escape") {
        setSelected([]);
        setPresent(-1);
        setTool("select");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        setSelected(board.items.map((i) => i.id));
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        clipboard.current = structuredClone(active);
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "v") {
        duplicate();
        e.preventDefault();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        clipboard.current = [];
        duplicate();
        e.preventDefault();
      }
      if (e.key === "ArrowRight" && present >= 0)
        setPresent((p) => Math.min(frames.length - 1, p + 1));
      if (e.key === "ArrowLeft" && present >= 0)
        setPresent((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const point = (e: ReactPointerEvent): Point => {
    const r = host.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - view.x) / view.z,
      y: (e.clientY - r.top - view.y) / view.z,
    };
  };
  const down = (e: ReactPointerEvent, id?: string, resize = false) => {
    if (present >= 0) return;
    e.preventDefault();
    const p = point(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === "hand" || e.button === 1) {
      gesture.current = {
        start: p,
        screen: { x: e.clientX, y: e.clientY },
        items: board.items,
        ids: [],
        kind: "pan",
        view,
      };
      return;
    }
    if (tool === "eraser") {
      if (id)
        commit(
          board.items.filter(
            (i) => i.id !== id && i.from !== id && i.to !== id,
          ),
        );
      return;
    }
    if (tool === "select") {
      if (!id) {
        if (!e.shiftKey) setSelected([]);
        gesture.current = {
          start: p,
          screen: { x: e.clientX, y: e.clientY },
          items: board.items,
          ids: e.shiftKey ? selected : [],
          kind: "marquee",
          view,
        };
        setMarquee({ x: p.x, y: p.y, w: 0, h: 0 });
        return;
      }
      const target = board.items.find((i) => i.id === id)!;
      const group = target.group
        ? board.items.filter((i) => i.group === target.group).map((i) => i.id)
        : [id];
      const ids = e.shiftKey
        ? selected.includes(id)
          ? selected.filter((x) => !group.includes(x))
          : [...new Set([...selected, ...group])]
        : selected.includes(id)
          ? selected
          : group;
      setSelected(ids);
      gesture.current = {
        start: p,
        screen: { x: e.clientX, y: e.clientY },
        items: board.items,
        ids,
        kind: resize ? "resize" : "move",
        view,
      };
      return;
    }
    const n = makeItem(tool, p.x, p.y);
    if (["pen", "pencil", "brush"].includes(tool)) n.points = [{ x: 0, y: 0 }];
    if (tool === "frame") n.text = `Frame ${frames.length + 1}`;
    setDraft([...board.items, n]);
    setSelected([n.id]);
    gesture.current = {
      start: p,
      screen: { x: e.clientX, y: e.clientY },
      items: [...board.items, n],
      ids: [n.id],
      kind: "draw",
      id: n.id,
      view,
    };
  };
  const move = (e: ReactPointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const p = point(e);
    const dx = p.x - g.start.x,
      dy = p.y - g.start.y;
    if (g.kind === "pan") {
      setView({
        ...g.view,
        x: g.view.x + e.clientX - g.screen.x,
        y: g.view.y + e.clientY - g.screen.y,
      });
      return;
    }
    if (g.kind === "marquee") {
      const r = {
        x: Math.min(g.start.x, p.x),
        y: Math.min(g.start.y, p.y),
        w: Math.abs(dx),
        h: Math.abs(dy),
      };
      setMarquee(r);
      const hits = board.items.filter(
        (i) =>
          i.x + i.w >= r.x &&
          i.x <= r.x + r.w &&
          i.y + i.h >= r.y &&
          i.y <= r.y + r.h,
      );
      const groups = new Set(hits.map((i) => i.group).filter(Boolean));
      setSelected([
        ...new Set([
          ...g.ids,
          ...board.items
            .filter((i) => hits.includes(i) || groups.has(i.group))
            .map((i) => i.id),
        ]),
      ]);
      return;
    }
    const snap = (v: number) => (board.snap ? Math.round(v / 10) * 10 : v);
    setDraft(
      g.items.map((i) => {
        if (!g.ids.includes(i.id)) return i;
        if (g.kind === "move")
          return { ...i, x: snap(i.x + dx), y: snap(i.y + dy) };
        if (g.kind === "resize")
          return {
            ...i,
            w: Math.max(30, snap(i.w + dx)),
            h: Math.max(30, snap(i.h + dy)),
          };
        if (["pen", "pencil", "brush"].includes(i.kind)) {
          const live = (draft || g.items).find((n) => n.id === i.id)!;
          return {
            ...i,
            points: [...live.points, { x: dx, y: dy }],
            w: Math.max(30, dx),
            h: Math.max(30, dy),
          };
        }
        if (["arrow", "line"].includes(i.kind)) return { ...i, w: dx, h: dy };
        return {
          ...i,
          x: Math.min(g.start.x, p.x),
          y: Math.min(g.start.y, p.y),
          w: Math.max(40, Math.abs(dx)),
          h: Math.max(40, Math.abs(dy)),
        };
      }),
    );
  };
  const up = () => {
    setMarquee(null);
    if (draft) {
      commit(
        draft.map((i) => {
          if (!["pen", "pencil", "brush"].includes(i.kind) || !i.points.length)
            return i;
          const minX = Math.min(...i.points.map((p) => p.x)),
            minY = Math.min(...i.points.map((p) => p.y));
          return {
            ...i,
            x: i.x + minX,
            y: i.y + minY,
            w: Math.max(1, ...i.points.map((p) => p.x - minX)),
            h: Math.max(1, ...i.points.map((p) => p.y - minY)),
            points: i.points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
          };
        }),
      );
      setDraft(null);
      if (!["pen", "pencil", "brush"].includes(tool)) setTool("select");
    }
    gesture.current = null;
  };
  const align = (mode: string) => {
    if (active.length < 2) return;
    const b = bounds(active);
    const left = b.x + 40,
      top = b.y + 40,
      right = b.x + b.w - 40,
      bottom = b.y + b.h - 40;
    const sorted = [...active].sort((a, b) => a.x - b.x);
    let space = 0;
    if (mode === "distribute" && active.length > 2)
      space =
        (right - left - active.reduce((s, i) => s + i.w, 0)) /
        (active.length - 1);
    let cursor = left;
    const positions = new Map(
      sorted.map((i) => {
        const x = cursor;
        cursor += i.w + space;
        return [i.id, x];
      }),
    );
    commit(
      board.items.map((i) =>
        !selected.includes(i.id)
          ? i
          : {
              ...i,
              ...(mode === "left"
                ? { x: left }
                : mode === "right"
                  ? { x: right - i.w }
                  : mode === "top"
                    ? { y: top }
                    : mode === "bottom"
                      ? { y: bottom - i.h }
                      : mode === "center"
                        ? { x: (left + right - i.w) / 2 }
                        : mode === "middle"
                          ? { y: (top + bottom - i.h) / 2 }
                          : { x: positions.get(i.id)! }),
            },
      ),
    );
  };
  const fit = () => {
    const b = bounds(board.items);
    const r = host.current!.getBoundingClientRect();
    const z = Math.max(
      0.1,
      Math.min(2, (r.width - 100) / b.w, (r.height - 100) / b.h),
    );
    setView({
      x: (r.width - b.w * z) / 2 - b.x * z,
      y: (r.height - b.h * z) / 2 - b.y * z,
      z,
    });
  };
  const presentationFrame = present >= 0 ? frames[present] : undefined;
  const renderItems = presentationFrame
    ? board.items.filter((i) => i.id !== presentationFrame.id)
    : items;
  return (
    <div className={`canvas-layout ${present >= 0 ? "presenting" : ""}`}>
      <aside className="inspector">
        <div className="panel-heading">
          <span className="eyebrow">ROOM TO THINK</span>
          <h2>Canvas</h2>
          <p>Connect the dots. Make ideas visible.</p>
        </div>
        <section className="local-sharing">
          <Toggle
            label="Live sharing between browser tabs"
            value={live}
            onChange={setLive}
          />
          {live && (
            <>
              <Field label="Local room">
                <input value={room} onChange={(e) => setRoom(e.target.value)} />
              </Field>
              <p className="muted">
                Open Flair in another tab in this browser and join the same
                room. Latest edit wins. This does not connect across devices.
              </p>
            </>
          )}
        </section>
        <Field label="Board title">
          <input
            value={board.title}
            onChange={(e) => changeBoard({ ...board, title: e.target.value })}
          />
        </Field>
        <Field label="Background">
          <select
            value={board.background}
            onChange={(e) =>
              changeBoard({ ...board, background: e.target.value })
            }
          >
            {["Dots", "Grid", "Plain"].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>
        <Toggle
          label="Snap to 10px grid"
          value={board.snap}
          onChange={(snap) => changeBoard({ ...board, snap })}
        />
        <Field label="Insert image">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f)
                try {
                  const n = {
                    ...makeItem(
                      "image",
                      (-view.x + 80) / view.z,
                      (-view.y + 80) / view.z,
                    ),
                    image: await readImage(f),
                    w: 300,
                    h: 220,
                  };
                  commit([...board.items, n]);
                  setSelected([n.id]);
                } catch (err) {
                  notify(String(err));
                }
            }}
          />
        </Field>
        {first ? (
          <section className="control-section">
            <div className="section-title">
              <h3>
                {active.length > 1 ? `${active.length} objects` : first.kind}
              </h3>
              <button onClick={() => setSelected([])}>Deselect</button>
            </div>
            <Field label="Text / code">
              <textarea
                rows={4}
                value={first.text}
                onChange={(e) => patch({ text: e.target.value })}
              />
            </Field>
            {first.kind === "icon" && (
              <Field label="Developer icon">
                <select
                  value={first.text}
                  onChange={(e) => patch({ text: e.target.value })}
                >
                  {[
                    "⚛",
                    "GitHub",
                    "⬡ Node.js",
                    "▤ Database",
                    "▣ Server",
                    "↔ API",
                    "☁ Cloud",
                    "🐳 Docker",
                    "🔒 Auth",
                    "🚀",
                    "✨",
                  ].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </Field>
            )}
            <div className="two-col">
              <Field label="Fill">
                <input
                  type="color"
                  value={first.fill}
                  onChange={(e) => patch({ fill: e.target.value })}
                />
              </Field>
              <Field label="Stroke / text">
                <input
                  type="color"
                  value={first.stroke}
                  onChange={(e) => patch({ stroke: e.target.value })}
                />
              </Field>
            </div>
            <Toggle
              label="Gradient fill"
              value={first.gradient}
              onChange={(gradient) => patch({ gradient })}
            />
            <Slider
              label="Opacity"
              value={first.opacity}
              onChange={(opacity) => patch({ opacity })}
            />
            <Slider
              label="Stroke width"
              min={1}
              max={12}
              value={first.strokeWidth}
              onChange={(strokeWidth) => patch({ strokeWidth })}
            />
            <Slider
              label="Text size"
              min={10}
              max={72}
              value={first.fontSize}
              onChange={(fontSize) => patch({ fontSize })}
            />
            <Field label="Font">
              <select
                value={first.font}
                onChange={(e) => patch({ font: e.target.value })}
              >
                {["sans-serif", "serif", "monospace", "cursive"].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Toggle
              label="Bold text"
              value={first.bold}
              onChange={(bold) => patch({ bold })}
            />
            <div className="two-col">
              {(["w", "h"] as const).map((k) => (
                <Field key={k} label={k === "w" ? "Width" : "Height"}>
                  <input
                    type="number"
                    min={20}
                    max={5000}
                    value={Math.round(first[k])}
                    onChange={(e) =>
                      patch({
                        [k]: Math.max(20, Math.min(5000, +e.target.value)),
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <Slider
              label="Rotation"
              min={-180}
              max={180}
              value={first.rotation}
              onChange={(rotation) => patch({ rotation })}
            />
            {["arrow", "line"].includes(first.kind) && (
              <>
                {(["from", "to"] as const).map((k) => (
                  <Field
                    key={k}
                    label={k === "from" ? "Connect from" : "Connect to"}
                  >
                    <select
                      value={first[k]}
                      onChange={(e) => patch({ [k]: e.target.value })}
                    >
                      <option value="">Free endpoint</option>
                      {board.items
                        .filter(
                          (i) =>
                            ![
                              "arrow",
                              "line",
                              "pen",
                              "pencil",
                              "brush",
                            ].includes(i.kind) && i.id !== first.id,
                        )
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.text.slice(0, 24) || i.kind}
                          </option>
                        ))}
                    </select>
                  </Field>
                ))}
              </>
            )}
            {first.kind === "frame" && (
              <button
                className="wide"
                onClick={() => {
                  const group = uid();
                  const children = board.items
                    .filter(
                      (i) =>
                        i.id === first.id ||
                        (i.x >= first.x &&
                          i.y >= first.y &&
                          i.x + i.w <= first.x + first.w &&
                          i.y + i.h <= first.y + first.h),
                    )
                    .map((i) => i.id);
                  commit(
                    board.items.map((i) =>
                      children.includes(i.id) ? { ...i, group } : i,
                    ),
                  );
                  setSelected(children);
                }}
              >
                Group frame contents
              </button>
            )}
            <div className="button-grid">
              <button
                onClick={() => {
                  clipboard.current = [];
                  duplicate();
                }}
              >
                Duplicate
              </button>
              <button onClick={remove}>Delete</button>
              <button
                onClick={() => {
                  commit([
                    ...board.items.filter((i) => !selected.includes(i.id)),
                    ...active,
                  ]);
                }}
              >
                Bring to front
              </button>
              <button
                onClick={() =>
                  commit([
                    ...active,
                    ...board.items.filter((i) => !selected.includes(i.id)),
                  ])
                }
              >
                Send to back
              </button>
              <button
                disabled={active.length < 2}
                onClick={() => patch({ group: uid() })}
              >
                Group
              </button>
              <button
                disabled={!first.group}
                onClick={() => patch({ group: "" })}
              >
                Ungroup
              </button>
            </div>
            {active.length > 1 && (
              <>
                <h3>Align selection</h3>
                <div className="button-grid">
                  {[
                    "left",
                    "center",
                    "right",
                    "top",
                    "middle",
                    "bottom",
                    "distribute",
                  ].map((n) => (
                    <button key={n} onClick={() => align(n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </>
            )}
            <h3>Local comments</h3>
            {first.comments.map((c, i) => (
              <div className="local-comment" key={i}>
                {c}
                <button
                  aria-label="Delete comment"
                  onClick={() =>
                    patch({
                      comments: first.comments.filter((_, j) => j !== i),
                    })
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <Field label="Leave feedback">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What could be better?"
              />
            </Field>
            <button
              disabled={!comment.trim()}
              onClick={() => {
                patch({ comments: [...first.comments, comment.trim()] });
                setComment("");
              }}
            >
              Add comment
            </button>
          </section>
        ) : (
          <div className="canvas-help">
            <h3>A few quick moves</h3>
            <p>Pick a tool, then drag to draw. Select an object to style it.</p>
            <p>
              Shift-click to select several. Drag the corner to resize. Use the
              hand to pan and the mouse wheel to zoom.
            </p>
            <p>⌘/Ctrl C · V · D to copy, paste, duplicate. Delete to remove.</p>
          </div>
        )}
        <section className="control-section">
          <h3>Starting points</h3>
          {boardTemplates.map((n) => (
            <button
              className="wide template-button"
              key={n}
              onClick={() => {
                changeBoard(boardTemplate(n));
                setSelected([]);
                setView({ x: 0, y: 0, z: 0.7 });
              }}
            >
              {n} ↗
            </button>
          ))}
          <small className="muted">
            Templates replace this board. Save first.
          </small>
        </section>
        <section className="control-section">
          <h3>Layers · {board.items.length}</h3>
          {[...board.items].reverse().map((i) => (
            <button
              className={`layer-row ${selected.includes(i.id) ? "chosen" : ""}`}
              key={i.id}
              onClick={() => {
                setSelected([i.id]);
                setTool("select");
              }}
            >
              {symbols[i.kind]} {i.text.slice(0, 25) || i.kind}
            </button>
          ))}
        </section>
        <p className="muted">
          Comments stay in this browser and in downloaded project files. Share
          files for asynchronous collaboration; live multi-user editing is
          unavailable in local mode.
        </p>
      </aside>
      <main className="canvas-main">
        <div
          className="canvas-toolbar"
          role="toolbar"
          aria-label="Drawing tools"
        >
          {tools.map((t) => (
            <button
              key={t}
              title={t}
              aria-label={t}
              aria-pressed={tool === t}
              className={tool === t ? "active" : ""}
              onClick={() => setTool(t)}
            >
              {symbols[t]}
            </button>
          ))}
        </div>
        <div
          ref={host}
          className={`canvas-surface canvas-bg-${board.background.toLowerCase()}`}
          style={{
            cursor:
              tool === "hand"
                ? "grab"
                : tool === "select"
                  ? "default"
                  : "crosshair",
            backgroundPosition: `${view.x}px ${view.y}px`,
            backgroundSize: `${20 * view.z}px ${20 * view.z}px`,
          }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            style={{ touchAction: "none" }}
            viewBox={
              presentationFrame
                ? `${presentationFrame.x} ${presentationFrame.y} ${presentationFrame.w} ${presentationFrame.h}`
                : undefined
            }
            onPointerDown={(e) => down(e)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => {
              setDraft(null);
              gesture.current = null;
            }}
          >
            <g
              transform={
                presentationFrame
                  ? undefined
                  : `translate(${view.x} ${view.y}) scale(${view.z})`
              }
            >
              {renderItems.map((i) => (
                <g
                  key={i.id}
                  data-item={i.id}
                  onPointerDown={(e) => {
                    if (tool === "select" || tool === "eraser") {
                      e.stopPropagation();
                      down(e, i.id);
                    }
                  }}
                >
                  <CanvasShape
                    item={i}
                    items={items}
                    selected={present < 0 && selected.includes(i.id)}
                  />
                </g>
              ))}
              {present < 0 &&
                active.length === 1 &&
                !["arrow", "line", "pen", "pencil", "brush"].includes(
                  first.kind,
                ) && (
                  <rect
                    x={first.x + first.w - 5}
                    y={first.y + first.h - 5}
                    width={12}
                    height={12}
                    fill="#8fdcd8"
                    stroke="#0b0b0d"
                    style={{ cursor: "nwse-resize" }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      down(e, first.id, true);
                    }}
                  />
                )}
              {marquee && (
                <rect
                  x={marquee.x}
                  y={marquee.y}
                  width={marquee.w}
                  height={marquee.h}
                  fill="#8fdcd814"
                  stroke="#8fdcd8"
                  strokeDasharray="4 4"
                  pointerEvents="none"
                />
              )}
            </g>
          </svg>
          {board.items.length === 0 && (
            <div className="canvas-empty">
              <span>✧</span>
              <h2>Big ideas need a little space.</h2>
              <p>
                Draw your first shape, add some code,
                <br />
                or start with a template.
              </p>
            </div>
          )}
        </div>
        <div className="canvas-bottom">
          <div className="zoom-controls">
            <button aria-label="Zoom out" onClick={() => zoomAt(1 / 1.25)}>
              −
            </button>
            <span>{Math.round(view.z * 100)}%</span>
            <button aria-label="Zoom in" onClick={() => zoomAt(1.25)}>
              +
            </button>
            <button onClick={fit}>Fit</button>
          </div>
          <span className="muted">
            {selected.length
              ? `${selected.length} selected · Shift-click for more`
              : tool + " tool"}
          </span>
          <button
            disabled={!frames.length}
            onClick={() => setPresent(present >= 0 ? -1 : 0)}
          >
            {present >= 0 ? "Exit presentation" : "Present frames"}
          </button>
        </div>
        {present >= 0 && (
          <div className="presentation-nav">
            <button
              disabled={present === 0}
              onClick={() => setPresent((p) => p - 1)}
            >
              ←
            </button>
            <span>
              {present + 1} / {frames.length} · {frames[present]?.text}
            </span>
            <button
              disabled={present === frames.length - 1}
              onClick={() => setPresent((p) => p + 1)}
            >
              →
            </button>
            <button onClick={() => setPresent(-1)}>Exit (Esc)</button>
          </div>
        )}
      </main>
    </div>
  );
}

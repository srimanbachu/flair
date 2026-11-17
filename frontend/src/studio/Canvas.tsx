import { Fragment, useRef, useState, useEffect, useCallback } from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowUpRight,
  Atom,
  Bold,
  BringToFront,
  Circle,
  Code2,
  Copy,
  Diamond,
  Eraser,
  Frame,
  Group,
  Hand,
  Keyboard,
  ImagePlus,
  Layers,
  Maximize,
  Minus,
  MousePointer2,
  PenLine,
  Pencil,
  Plus,
  Presentation,
  SendToBack,
  Settings2,
  RectangleHorizontal,
  Square,
  StickyNote,
  Trash2,
  Triangle,
  Type,
  Ungroup,
  X,
  Image as ImageIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { Board, CanvasItem, Point } from "./canvasModel";
import { bounds, makeItem, boardTemplate, boardTemplates } from "./canvasModel";
import { CanvasShape } from "./CanvasShape";
import { Field, Slider, Toggle } from "./Controls";
import { uid } from "./model";
import { readImage } from "./storage";
import { validateBoard } from "./projectFiles";
type Tool = { id: string; label: string; Icon: LucideIcon; key: string };
const toolGroups: Tool[][] = [
  [
    { id: "hand", label: "Hand", Icon: Hand, key: "H" },
    { id: "select", label: "Select", Icon: MousePointer2, key: "V" },
  ],
  [
    {
      id: "rectangle",
      label: "Rectangle",
      Icon: RectangleHorizontal,
      key: "R",
    },
    { id: "square", label: "Square", Icon: Square, key: "S" },
    { id: "ellipse", label: "Ellipse", Icon: Circle, key: "O" },
    { id: "triangle", label: "Triangle", Icon: Triangle, key: "⇧T" },
    { id: "diamond", label: "Diamond", Icon: Diamond, key: "D" },
    { id: "arrow", label: "Arrow", Icon: ArrowUpRight, key: "A" },
    { id: "line", label: "Line", Icon: Minus, key: "L" },
  ],
  [
    { id: "pen", label: "Draw", Icon: PenLine, key: "P" },
    { id: "text", label: "Text", Icon: Type, key: "T" },
    { id: "sticky", label: "Sticky note", Icon: StickyNote, key: "N" },
    { id: "code", label: "Code", Icon: Code2, key: "C" },
    { id: "icon", label: "Icon", Icon: Atom, key: "K" },
    { id: "frame", label: "Frame", Icon: Frame, key: "F" },
    { id: "image", label: "Image", Icon: ImagePlus, key: "I" },
  ],
  [{ id: "eraser", label: "Eraser", Icon: Eraser, key: "E" }],
];
const tools = toolGroups.flat();
/** Single-key shortcuts; Shift+T is triangle because T is text. */
const toolKeys: Record<string, string> = Object.fromEntries(
  tools.map((t) => [
    t.key.replace("⇧", "").toLowerCase() +
      (t.key.startsWith("⇧") ? "+shift" : ""),
    t.id,
  ]),
);
const shortcutList: [string, string][] = [
  ...tools.map((t): [string, string] => [t.key, t.label]),
  ["Esc", "Back to grab, clear selection"],
  ["Space + drag", "Pan from any tool"],
  ["Shift + drag", "Box-select with grab · keep shapes square"],
  ["Double-click", "Edit text"],
  ["⌘/Ctrl + / −", "Zoom in / out"],
  ["⌘/Ctrl 0", "Zoom to 100%"],
  ["⇧1", "Fit to content"],
  ["⌘/Ctrl A", "Select all"],
  ["⌘/Ctrl C · V · D", "Copy · paste · duplicate"],
  ["⌘/Ctrl G", "Group (⇧ to ungroup)"],
  ["] · [", "Bring to front · send to back"],
  ["Arrow keys", "Nudge (⇧ for 10px)"],
  ["Delete", "Remove selection"],
  ["⌘/Ctrl Z", "Undo (⇧ to redo)"],
  ["?", "Show shortcuts"],
];
const kindIcon: Record<string, LucideIcon> = {
  ...Object.fromEntries(tools.map((t) => [t.id, t.Icon])),
  pencil: Pencil,
  brush: PenLine,
  image: ImageIcon,
};
const kindLabel = (kind: string) =>
  tools.find((t) => t.id === kind)?.label ||
  kind.charAt(0).toUpperCase() + kind.slice(1);
const strokeColors = [
  "#d8dbe0",
  "#8fdcd8",
  "#f4a259",
  "#f25f5c",
  "#a78bfa",
  "#6cc28a",
];
const fillColors = [
  "transparent",
  "#1d1f24",
  "#12403f",
  "#4a2c17",
  "#4a1f24",
  "#2f2650",
  "#f4d985",
];
const freehand = ["pen", "pencil", "brush"];
const editable = (kind: string) =>
  !freehand.includes(kind) &&
  !["image", "arrow", "line", "icon"].includes(kind);
function Swatches({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="swatch-row" role="group" aria-label={label}>
      <span>{label}</span>
      <div>
        {options.map((c) => (
          <button
            key={c}
            className={`dot ${value === c ? "on" : ""} ${c === "transparent" ? "none" : ""}`}
            style={c === "transparent" ? undefined : { background: c }}
            aria-label={`${label} ${c === "transparent" ? "none" : c}`}
            aria-pressed={value === c}
            onClick={() => onChange(c)}
          />
        ))}
        <input
          type="color"
          aria-label={`Custom ${label.toLowerCase()} color`}
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  Icon,
  onClick,
  disabled = false,
}: {
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="icon-btn"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={15} strokeWidth={1.75} />
    </button>
  );
}
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
  const [tool, setTool] = useState("hand");
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [draft, setDraft] = useState<CanvasItem[] | null>(null);
  const [comment, setComment] = useState("");
  const [panel, setPanel] = useState<"board" | "layers" | "keys" | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(
    null,
  );
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
  const flushView = () => {
    if (!frame.current)
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (pendingView.current) setView(pendingView.current);
        pendingView.current = null;
      });
  };
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
    flushView();
  }, []);
  const panBy = useCallback((dx: number, dy: number) => {
    const v = pendingView.current || viewRef.current;
    pendingView.current = { ...v, x: v.x - dx, y: v.y - dy };
    flushView();
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
      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch arrives as ctrl+wheel with small deltas; boost it.
        const delta = Math.max(-120, Math.min(120, e.deltaY * unit));
        zoomAt(Math.exp(-delta * 0.012), e.clientX - r.left, e.clientY - r.top);
        return;
      }
      // Two-finger scroll (or a mouse wheel) pans; Shift turns a vertical
      // wheel into horizontal movement for mice without a side wheel.
      const dx = e.deltaX * unit,
        dy = e.deltaY * unit;
      if (e.shiftKey && !dx) panBy(dy, 0);
      else panBy(dx, dy);
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
  }, [zoomAt, panBy, presenting]);
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
              ...(freehand.includes(i.kind) &&
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
  const startEditing = (id: string) => {
    const item = board.items.find((i) => i.id === id);
    if (!item || !editable(item.kind) || present >= 0) return;
    setSelected([id]);
    setEditing({ id, text: item.text });
  };
  const fit = (target: CanvasItem[] = board.items, max = 2) => {
    const b = bounds(target);
    const r = host.current!.getBoundingClientRect();
    const z = Math.max(
      0.1,
      Math.min(max, (r.width - 100) / b.w, (r.height - 100) / b.h),
    );
    setView({
      x: (r.width - b.w * z) / 2 - b.x * z,
      y: (r.height - b.h * z) / 2 - b.y * z,
      z,
    });
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
        setPanel(null);
        setTool("hand");
        return;
      }
      if (present >= 0) {
        if (e.key === "ArrowRight" || e.key === " ")
          setPresent((p) => Math.min(frames.length - 1, p + 1));
        if (e.key === "ArrowLeft") setPresent((p) => Math.max(0, p - 1));
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if (e.shiftKey && e.code === "Digit1") {
        e.preventDefault();
        fit();
        return;
      }
      if (e.key === "Enter" && active.length === 1 && editable(first.kind)) {
        e.preventDefault();
        startEditing(first.id);
        return;
      }
      if (e.key === "?") {
        setPanel((p) => (p === "keys" ? null : "keys"));
        return;
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const id = toolKeys[e.key.toLowerCase() + (e.shiftKey ? "+shift" : "")];
        if (id) {
          e.preventDefault();
          if (id === "image") imageInput.current?.click();
          else setTool(id);
          return;
        }
        if ((e.key === "]" || e.key === "[") && active.length) {
          const rest = board.items.filter((i) => !selected.includes(i.id));
          commit(e.key === "]" ? [...rest, ...active] : [...active, ...rest]);
          return;
        }
        const nudge = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        }[e.key];
        if (nudge && active.length) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          commit(
            board.items.map((i) =>
              selected.includes(i.id)
                ? { ...i, x: i.x + nudge[0] * step, y: i.y + nudge[1] * step }
                : i,
            ),
          );
          return;
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) patch({ group: "" });
        else if (active.length > 1) patch({ group: uid() });
        return;
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
    };
    const release = (e: KeyboardEvent) => {
      if (e.key === " ") setSpaceHeld(false);
    };
    const blur = () => setSpaceHeld(false);
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", blur);
    };
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
    if (panel === "board") setPanel(null);
    const p = point(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    // Grab pans on empty space but still picks up objects; Shift+drag on
    // empty space box-selects. Space or the middle button always pans.
    if (
      spaceHeld ||
      e.button === 1 ||
      (tool === "hand" && !id && !e.shiftKey)
    ) {
      setPanning(true);
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
    if (tool === "select" || tool === "hand") {
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
    if (tool === "text") {
      const t = {
        ...makeItem("text", p.x, p.y - 22),
        text: "",
        w: 200,
        h: 44,
      };
      commit([...board.items, t]);
      setSelected([t.id]);
      setEditing({ id: t.id, text: "" });
      setTool("hand");
      return;
    }
    const n = makeItem(tool === "square" ? "rectangle" : tool, p.x, p.y);
    if (freehand.includes(tool)) n.points = [{ x: 0, y: 0 }];
    if (tool === "frame") n.text = `Frame ${frames.length + 1}`;
    setDraft([...board.items, n]);
    setSelected([n.id]);
    gesture.current = {
      start: p,
      screen: { x: e.clientX, y: e.clientY },
      items: [...board.items, n],
      ids: [n.id],
      kind: tool === "square" ? "draw-square" : "draw",
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
        if (freehand.includes(i.kind)) {
          const live = (draft || g.items).find((n) => n.id === i.id)!;
          return {
            ...i,
            points: [...live.points, { x: dx, y: dy }],
            w: Math.max(30, dx),
            h: Math.max(30, dy),
          };
        }
        if (["arrow", "line"].includes(i.kind)) return { ...i, w: dx, h: dy };
        if (g.kind === "draw-square" || e.shiftKey) {
          const side = Math.max(40, Math.abs(dx), Math.abs(dy));
          return {
            ...i,
            x: dx < 0 ? g.start.x - side : g.start.x,
            y: dy < 0 ? g.start.y - side : g.start.y,
            w: side,
            h: side,
          };
        }
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
          if (!freehand.includes(i.kind) || !i.points.length) return i;
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
      if (!freehand.includes(tool)) setTool("hand");
    }
    gesture.current = null;
    setPanning(false);
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
  const insertImage = async (file: File) => {
    try {
      const r = host.current!.getBoundingClientRect();
      const n = {
        ...makeItem(
          "image",
          (r.width / 2 - view.x) / view.z - 150,
          (r.height / 2 - view.y) / view.z - 110,
        ),
        image: await readImage(file),
        w: 300,
        h: 220,
      };
      commit([...board.items, n]);
      setSelected([n.id]);
      setTool("select");
    } catch (err) {
      notify(String(err));
    }
  };
  const applyTemplate = (name: string) => {
    const next = boardTemplate(name);
    changeBoard(next);
    setSelected([]);
    setPanel(null);
    fit(next.items, 1);
  };
  /* Commit inline edits as a single history step. Empty text boxes are
     removed; free text boxes grow to fit what was typed. */
  const finishEditing = () => {
    if (!editing) return;
    const item = board.items.find((i) => i.id === editing.id);
    setEditing(null);
    if (!item) return;
    if (item.kind === "text" && !editing.text.trim()) {
      commit(board.items.filter((i) => i.id !== item.id));
      setSelected([]);
      return;
    }
    if (editing.text === item.text) return;
    const lines = editing.text.split("\n");
    const fitted =
      item.kind === "text"
        ? {
            w: Math.max(
              item.w,
              Math.max(...lines.map((l) => l.length)) * item.fontSize * 0.6 +
                24,
            ),
            h: Math.max(item.h, lines.length * item.fontSize * 1.3 + 20),
          }
        : {};
    commit(
      board.items.map((i) =>
        i.id === item.id ? { ...i, text: editing.text, ...fitted } : i,
      ),
    );
  };
  const editItem = editing && board.items.find((i) => i.id === editing.id);
  const presentationFrame = present >= 0 ? frames[present] : undefined;
  const renderItems = (
    presentationFrame
      ? board.items.filter((i) => i.id !== presentationFrame.id)
      : items
  ).map((i) => (editing && i.id === editing.id ? { ...i, text: "" } : i));
  const isLine = first && ["arrow", "line"].includes(first.kind);
  const hasText =
    first &&
    !freehand.includes(first.kind) &&
    !["image", "arrow", "line"].includes(first.kind);
  return (
    <div className={`canvas-layout ${present >= 0 ? "presenting" : ""}`}>
      <main className="canvas-main">
        <div
          ref={host}
          className={`canvas-surface canvas-bg-${board.background.toLowerCase()} tool-${tool}`}
          style={{
            cursor: panning
              ? "grabbing"
              : spaceHeld || tool === "hand"
                ? "grab"
                : tool === "select"
                  ? "default"
                  : tool === "text"
                    ? "text"
                    : tool === "eraser"
                      ? "cell"
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
              setPanning(false);
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
                    if (spaceHeld) return;
                    if (tool === "text" && editable(i.kind)) {
                      e.stopPropagation();
                      e.preventDefault();
                      startEditing(i.id);
                      setTool("hand");
                    } else if (["select", "hand", "eraser"].includes(tool)) {
                      e.stopPropagation();
                      down(e, i.id);
                    }
                  }}
                  onDoubleClick={() => startEditing(i.id)}
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
                !["arrow", "line", ...freehand].includes(first.kind) && (
                  <rect
                    x={first.x + first.w - 5}
                    y={first.y + first.h - 5}
                    width={10}
                    height={10}
                    rx={2}
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
          {editItem &&
            editing &&
            !presentationFrame &&
            (() => {
              const z = view.z;
              const lines = Math.max(1, editing.text.split("\n").length);
              const lineH = editItem.fontSize * 1.3 * z;
              const height = lines * lineH + 8;
              const isCode = editItem.kind === "code";
              const isFrame = editItem.kind === "frame";
              const top = isFrame
                ? view.y + (editItem.y - editItem.fontSize * 1.6) * z
                : isCode
                  ? view.y + (editItem.y + 14) * z
                  : view.y + (editItem.y + editItem.h / 2) * z - height / 2;
              return (
                <textarea
                  className="canvas-text-editor"
                  aria-label="Edit text"
                  autoFocus
                  spellCheck={!isCode}
                  value={editing.text}
                  placeholder={editItem.kind === "text" ? "Type something" : ""}
                  onChange={(e) =>
                    setEditing({ id: editing.id, text: e.target.value })
                  }
                  onFocus={(e) => {
                    const end = e.currentTarget.value.length;
                    e.currentTarget.setSelectionRange(end, end);
                  }}
                  onBlur={finishEditing}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Escape") e.currentTarget.blur();
                    if (
                      e.key === "Enter" &&
                      (isCode ? e.metaKey || e.ctrlKey : !e.shiftKey)
                    ) {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  style={{
                    left: view.x + (editItem.x + (isCode ? 12 : 0)) * z,
                    top,
                    width: Math.max(80, (editItem.w - (isCode ? 24 : 0)) * z),
                    height: isCode
                      ? Math.max(height, (editItem.h - 28) * z)
                      : height,
                    fontSize: editItem.fontSize * z,
                    lineHeight: `${lineH}px`,
                    fontFamily: isCode ? "monospace" : editItem.font,
                    fontWeight: editItem.bold ? 700 : 400,
                    textAlign: isCode || isFrame ? "left" : "center",
                    color:
                      editItem.kind === "sticky"
                        ? "#30281b"
                        : isCode
                          ? "#bfe3c2"
                          : editItem.stroke,
                  }}
                />
              );
            })()}
          {board.items.length === 0 && (
            <div className="canvas-empty">
              <h2>Start sketching</h2>
              <p>
                Pick a tool above or begin from a template. Double-click
                anything to edit its text, and press <kbd>?</kbd> for shortcuts.
              </p>
              <div className="template-chips">
                {boardTemplates
                  .filter((n) => n !== "Blank canvas")
                  .map((n) => (
                    <button key={n} onClick={() => applyTemplate(n)}>
                      {n}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="canvas-panel board-bar">
          <input
            className="board-title"
            aria-label="Board title"
            value={board.title}
            onChange={(e) => changeBoard({ ...board, title: e.target.value })}
          />
          <button
            className={`icon-btn ${panel === "layers" ? "active" : ""}`}
            title="Layers"
            aria-label="Layers"
            aria-expanded={panel === "layers"}
            onClick={() => setPanel(panel === "layers" ? null : "layers")}
          >
            <Layers size={15} strokeWidth={1.75} />
          </button>
          <button
            className={`icon-btn ${panel === "board" ? "active" : ""}`}
            title="Board settings"
            aria-label="Board settings"
            aria-expanded={panel === "board"}
            onClick={() => setPanel(panel === "board" ? null : "board")}
          >
            <Settings2 size={15} strokeWidth={1.75} />
          </button>
        </div>

        {panel === "board" && (
          <div className="canvas-panel board-menu">
            <span className="menu-label">Background</span>
            <div className="segmented">
              {["Dots", "Grid", "Plain"].map((n) => (
                <button
                  key={n}
                  aria-pressed={board.background === n}
                  className={board.background === n ? "active" : ""}
                  onClick={() => changeBoard({ ...board, background: n })}
                >
                  {n}
                </button>
              ))}
            </div>
            <Toggle
              label="Snap to grid"
              value={board.snap}
              onChange={(snap) => changeBoard({ ...board, snap })}
            />
            <Toggle
              label="Live sharing between browser tabs"
              value={live}
              onChange={setLive}
            />
            {live && (
              <>
                <Field label="Local room">
                  <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                  />
                </Field>
                <p className="muted">
                  Open Flair in another tab and join the same room. Latest edit
                  wins; this does not connect across devices.
                </p>
              </>
            )}
            <span className="menu-label">Templates · replace this board</span>
            {boardTemplates.map((n) => (
              <button
                className="menu-item"
                key={n}
                onClick={() => applyTemplate(n)}
              >
                {n}
              </button>
            ))}
          </div>
        )}

        {panel === "layers" && (
          <div className="canvas-panel layers-panel">
            <span className="menu-label">Layers · {board.items.length}</span>
            {!board.items.length && <p className="muted">Nothing here yet.</p>}
            {[...board.items].reverse().map((i) => {
              const Icon = kindIcon[i.kind] || Square;
              return (
                <button
                  className={`layer-row ${selected.includes(i.id) ? "chosen" : ""}`}
                  key={i.id}
                  onClick={() => {
                    setSelected([i.id]);
                    setTool("select");
                  }}
                >
                  <Icon size={13} strokeWidth={1.75} />
                  <span>
                    {i.text.split("\n")[0].slice(0, 28) || kindLabel(i.kind)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div
          className="canvas-toolbar"
          role="toolbar"
          aria-label="Drawing tools"
        >
          {toolGroups.map((group, gi) => (
            <Fragment key={gi}>
              {gi > 0 && <span className="tool-sep" aria-hidden="true" />}
              {group.map((t) => (
                <button
                  key={t.id}
                  title={`${t.label} — ${t.key}`}
                  aria-label={t.label}
                  aria-keyshortcuts={t.key.replace("⇧", "Shift+")}
                  aria-pressed={tool === t.id}
                  className={tool === t.id ? "active" : ""}
                  onClick={() =>
                    t.id === "image"
                      ? imageInput.current?.click()
                      : setTool(t.id)
                  }
                >
                  <t.Icon size={17} strokeWidth={1.75} />
                  <kbd>{t.key.replace("⇧", "")}</kbd>
                </button>
              ))}
            </Fragment>
          ))}
        </div>
        <input
          ref={imageInput}
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) insertImage(f);
          }}
        />

        {first && present < 0 && (
          <aside className="canvas-panel props-panel" aria-label="Selection">
            <div className="props-head">
              <strong>
                {active.length > 1
                  ? `${active.length} objects`
                  : kindLabel(first.kind)}
              </strong>
              <button
                className="icon-btn"
                aria-label="Deselect"
                title="Deselect (Esc)"
                onClick={() => setSelected([])}
              >
                <X size={14} />
              </button>
            </div>
            {active.length === 1 && editable(first.kind) && (
              <button
                className="edit-hint"
                onClick={() => startEditing(first.id)}
              >
                <Type size={13} strokeWidth={1.75} />
                Edit text on canvas
                <kbd>Enter</kbd>
              </button>
            )}
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
            <Swatches
              label="Stroke"
              value={first.stroke}
              options={strokeColors}
              onChange={(stroke) => patch({ stroke })}
            />
            {!isLine &&
              !freehand.includes(first.kind) &&
              first.kind !== "text" && (
                <Swatches
                  label="Fill"
                  value={first.fill}
                  options={fillColors}
                  onChange={(fill) => patch({ fill })}
                />
              )}
            <Slider
              label="Stroke width"
              min={1}
              max={12}
              value={first.strokeWidth}
              onChange={(strokeWidth) => patch({ strokeWidth })}
            />
            <Slider
              label="Opacity"
              value={first.opacity}
              unit="%"
              onChange={(opacity) => patch({ opacity })}
            />
            {hasText && (
              <>
                <Slider
                  label="Text size"
                  min={10}
                  max={72}
                  value={first.fontSize}
                  onChange={(fontSize) => patch({ fontSize })}
                />
                <div className="font-row">
                  <select
                    aria-label="Font"
                    value={first.font}
                    onChange={(e) => patch({ font: e.target.value })}
                  >
                    {["sans-serif", "serif", "monospace", "cursive"].map(
                      (n) => (
                        <option key={n}>{n}</option>
                      ),
                    )}
                  </select>
                  <button
                    className={`icon-btn ${first.bold ? "active" : ""}`}
                    aria-label="Bold text"
                    aria-pressed={first.bold}
                    onClick={() => patch({ bold: !first.bold })}
                  >
                    <Bold size={15} />
                  </button>
                </div>
              </>
            )}
            <div className="icon-row" role="group" aria-label="Arrange">
              <ActionButton
                label={"Duplicate"}
                Icon={Copy}
                onClick={() => {
                  clipboard.current = [];
                  duplicate();
                }}
              />
              <ActionButton
                label={"Bring to front"}
                Icon={BringToFront}
                onClick={() =>
                  commit([
                    ...board.items.filter((i) => !selected.includes(i.id)),
                    ...active,
                  ])
                }
              />
              <ActionButton
                label={"Send to back"}
                Icon={SendToBack}
                onClick={() =>
                  commit([
                    ...active,
                    ...board.items.filter((i) => !selected.includes(i.id)),
                  ])
                }
              />
              <ActionButton
                label={"Group"}
                Icon={Group}
                onClick={() => patch({ group: uid() })}
                disabled={active.length < 2}
              />
              <ActionButton
                label={"Ungroup"}
                Icon={Ungroup}
                onClick={() => patch({ group: "" })}
                disabled={!first.group}
              />
              <ActionButton label={"Delete"} Icon={Trash2} onClick={remove} />
            </div>
            {active.length > 1 && (
              <div className="icon-row" role="group" aria-label="Align">
                <ActionButton
                  label={"Align left"}
                  Icon={AlignStartVertical}
                  onClick={() => align("left")}
                />
                <ActionButton
                  label={"Align center"}
                  Icon={AlignCenterVertical}
                  onClick={() => align("center")}
                />
                <ActionButton
                  label={"Align right"}
                  Icon={AlignEndVertical}
                  onClick={() => align("right")}
                />
                <ActionButton
                  label={"Align top"}
                  Icon={AlignStartHorizontal}
                  onClick={() => align("top")}
                />
                <ActionButton
                  label={"Align middle"}
                  Icon={AlignCenterHorizontal}
                  onClick={() => align("middle")}
                />
                <ActionButton
                  label={"Align bottom"}
                  Icon={AlignEndHorizontal}
                  onClick={() => align("bottom")}
                />
                <ActionButton
                  label={"Distribute"}
                  Icon={AlignHorizontalSpaceAround}
                  onClick={() => align("distribute")}
                />
              </div>
            )}
            <details className="panel-more">
              <summary>More options</summary>
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
                unit="°"
                value={first.rotation}
                onChange={(rotation) => patch({ rotation })}
              />
              {!isLine && (
                <Toggle
                  label="Gradient fill"
                  value={first.gradient}
                  onChange={(gradient) => patch({ gradient })}
                />
              )}
              {isLine &&
                (["from", "to"] as const).map((k) => (
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
                            !["arrow", "line", ...freehand].includes(i.kind) &&
                            i.id !== first.id,
                        )
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.text.slice(0, 24) || kindLabel(i.kind)}
                          </option>
                        ))}
                    </select>
                  </Field>
                ))}
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
            </details>
            <details className="panel-more">
              <summary>
                Comments
                {first.comments.length ? ` · ${first.comments.length}` : ""}
              </summary>
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
                    <X size={12} />
                  </button>
                </div>
              ))}
              <form
                className="comment-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!comment.trim()) return;
                  patch({ comments: [...first.comments, comment.trim()] });
                  setComment("");
                }}
              >
                <input
                  aria-label="Leave feedback"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Leave a note…"
                />
                <button type="submit" disabled={!comment.trim()}>
                  Add comment
                </button>
              </form>
              <small className="muted">
                Comments stay in this browser and in project files.
              </small>
            </details>
          </aside>
        )}

        <div className="canvas-panel zoom-controls">
          <button
            aria-label="Zoom out"
            title="Zoom out (⌘ −)"
            onClick={() => zoomAt(1 / 1.25)}
          >
            <Minus size={14} />
          </button>
          <button
            className="zoom-value"
            title="Reset to 100% (⌘ 0)"
            onClick={() => setView({ ...view, z: 1 })}
          >
            <span>{Math.round(view.z * 100)}%</span>
          </button>
          <button
            aria-label="Zoom in"
            title="Zoom in (⌘ +)"
            onClick={() => zoomAt(1.25)}
          >
            <Plus size={14} />
          </button>
          <button
            aria-label="Fit to content"
            title="Fit to content"
            onClick={() => fit()}
          >
            <Maximize size={14} />
          </button>
        </div>

        {panel === "keys" && (
          <div
            className="canvas-panel keys-panel"
            role="dialog"
            aria-label="Keyboard shortcuts"
          >
            <div className="props-head">
              <strong>Keyboard shortcuts</strong>
              <button
                className="icon-btn"
                aria-label="Close shortcuts"
                onClick={() => setPanel(null)}
              >
                <X size={14} />
              </button>
            </div>
            <dl>
              {shortcutList.map(([k, label]) => (
                <Fragment key={k + label}>
                  <dt>{label}</dt>
                  <dd>
                    <kbd>{k}</kbd>
                  </dd>
                </Fragment>
              ))}
            </dl>
          </div>
        )}
        <div className="canvas-panel canvas-corner">
          <button
            className={`icon-btn ${panel === "keys" ? "active" : ""}`}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            onClick={() => setPanel(panel === "keys" ? null : "keys")}
          >
            <Keyboard size={15} strokeWidth={1.75} />
          </button>
          <button
            disabled={!frames.length}
            title={frames.length ? "Present frames" : "Add a frame to present"}
            onClick={() => setPresent(present >= 0 ? -1 : 0)}
          >
            <Presentation size={15} strokeWidth={1.75} />
            Present frames
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

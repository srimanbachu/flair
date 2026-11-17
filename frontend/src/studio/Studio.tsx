import { useState, useRef, useEffect, useCallback } from "react";
import {
  Navigate,
  NavLink,
  useLocation,
  useMatch,
  useNavigate,
} from "react-router-dom";
import {
  Code2,
  PenTool,
  FolderOpen,
  Undo2,
  Redo2,
  Download,
  Save,
  ChevronDown,
  X,
  Plus,
  Upload,
  Sparkles,
  Type,
  Palette,
  AppWindow,
  LayoutTemplate,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toPng, toJpeg, toBlob } from "html-to-image";
import type { Card } from "./model";
import { defaultCard, exportScale, uid, cardTabs } from "./model";
import type { Board } from "./canvasModel";
import { emptyBoard } from "./canvasModel";
import { CardControls } from "./CardControls";
import { CardPreview } from "./CardPreview";
import { BlockBar } from "./BlockBar";
import { Canvas } from "./Canvas";
import type { SavedProject } from "./storage";
import { download, readProjects, removeProject, saveProject } from "./storage";
import { parseProject, validateBoard, validateCard } from "./projectFiles";
import flairLogo from "../assets/flair.png";
import "./studio.css";
const tabIcons: Record<string, LucideIcon> = {
  Typography: Type,
  Background: Palette,
  Window: AppWindow,
  Effects: Sparkles,
  Templates: LayoutTemplate,
  Export: Download,
};
type Workspace = { kind: "card" | "canvas"; card: Card; board: Board };
function initial(): Workspace {
  try {
    const s = JSON.parse(localStorage.getItem("flair.draft.v1") || "null");
    if (s)
      return {
        kind: s.kind === "canvas" ? "canvas" : "card",
        card: validateCard(s.card),
        board: validateBoard(s.board),
      };
  } catch {
    /* Recover a fresh draft if storage is unavailable or corrupt. */
  }
  return { kind: "card", card: defaultCard(), board: emptyBoard() };
}
export default function Studio() {
  const [work, setWork] = useState(initial);
  const location = useLocation();
  const navigate = useNavigate();
  // The URL decides the workspace: /cards or /canvas.
  const routeKind = location.pathname.startsWith("/canvas")
    ? "canvas"
    : location.pathname.startsWith("/cards")
      ? "card"
      : null;
  const workspacePath = (kind: Workspace["kind"]) =>
    kind === "canvas" ? "/canvas" : "/cards";
  const [past, setPast] = useState<Workspace[]>([]);
  const [future, setFuture] = useState<Workspace[]>([]);
  const [activeBlock, setActiveBlock] = useState(0);
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Saving draft…");
  const [library, setLibrary] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>(readProjects);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(0.55);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [projectId, setProjectId] = useState<string | null>(null);
  if (routeKind && routeKind !== work.kind) {
    // A saved project belongs to one workspace, so forget it on switch.
    setWork({ ...work, kind: routeKind });
    setProjectId(null);
  }
  // Card inspector tabs are routes too: /cards/background, /cards/export…
  const tabSlug = useMatch("/cards/:tab")?.params.tab;
  const tab = cardTabs.find((t) => t.toLowerCase() === tabSlug) ?? cardTabs[0];
  const openTab = (t: string) => navigate(`/cards/${t.toLowerCase()}`);
  const preview = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((s: string) => {
    setToast(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 5000);
  }, []);
  useEffect(() => {
    if (!library) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector<HTMLElement>('[role="dialog"]');
    const selector =
      'button:not(:disabled), input, select, textarea, [tabindex="0"]';
    modal?.querySelector<HTMLElement>(selector)?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLibrary(false);
      if (event.key !== "Tab" || !modal) return;
      const nodes = [...modal.querySelectorAll<HTMLElement>(selector)];
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [library]);
  const replaceWorkspace = (next: Workspace) => {
    setWork(next);
    setPast([]);
    setFuture([]);
    setSaved(false);
    setProjectId(null);
  };
  const change = useCallback(
    (next: Workspace) => {
      setPast((p) => [...p, work]);
      setFuture([]);
      setWork(next);
      setSaved(false);
      setDraftStatus("Saving draft…");
    },
    [work],
  );
  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture((f) => [work, ...f]);
    setWork(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    setSaved(false);
  }, [past, work]);
  const redo = useCallback(() => {
    if (!future.length) return;
    setPast((p) => [...p, work]);
    setWork(future[0]);
    setFuture((f) => f.slice(1));
    setSaved(false);
  }, [future, work]);
  useEffect(() => {
    const persist = () => {
      try {
        localStorage.setItem("flair.draft.v1", JSON.stringify(work));
        setDraftStatus("Draft saved locally");
      } catch {
        setDraftStatus("Draft could not be saved");
        notify(
          "Browser storage is full or unavailable. Download a project file to keep your work.",
        );
      }
    };
    const t = setTimeout(persist, 600);
    window.addEventListener("pagehide", persist);
    return () => {
      clearTimeout(t);
      window.removeEventListener("pagehide", persist);
    };
  }, [work, notify]);
  // The rendered card size: measured from content in auto mode.
  const dims =
    work.card.autoSize && natural.w
      ? natural
      : { w: work.card.width, h: work.card.height };
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(
        Math.min(
          1,
          (entry.contentRect.width - 64) / dims.w,
          (entry.contentRect.height - 64) / dims.h,
        ),
      ),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dims.w, dims.h, work.kind]);
  const save = useCallback(() => {
    try {
      const id = projectId || uid();
      saveProject({
        id,
        name: work.kind === "card" ? work.card.title : work.board.title,
        kind: work.kind,
        updated: new Date().toISOString(),
        data: work.kind === "card" ? work.card : work.board,
      });
      setProjectId(id);
      setSaved(true);
      setProjects(readProjects());
      notify("Saved to your local library.");
    } catch {
      notify(
        "Could not save: browser storage is full. Download a project file.",
      );
    }
  }, [work, projectId, notify]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "s") {
        e.preventDefault();
        save();
      }
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [undo, redo, save]);
  const projectFile = () => {
    download(
      "flair-project.json",
      JSON.stringify(
        {
          format: "flair",
          version: 1,
          kind: work.kind,
          data: work.kind === "card" ? work.card : work.board,
        },
        null,
        2,
      ),
    );
    setMenu(false);
  };
  const exportCanvas = async (format: string) => {
    const { canvasSVG } = await import("./CanvasExport");
    const { text, bounds: b } = canvasSVG(work.board);
    if (format === "svg") {
      download("flair-canvas.svg", text, "image/svg+xml");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([text], { type: "image/svg+xml" }),
    );
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error("Canvas image could not be rendered."));
        img.src = url;
      });
      const factor = Math.min(2, 8192 / Math.max(b.w, b.h));
      const canvas = document.createElement("canvas");
      canvas.width = b.w * factor;
      canvas.height = b.h * factor;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0e0e11";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.download = "flair-canvas.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  const cardImageOptions = (format: string) => ({
    pixelRatio: exportScale(dims.w, dims.h, work.card.quality),
    width: Math.round(dims.w),
    height: Math.round(dims.h),
    style: { transform: "none" },
    backgroundColor: format === "jpeg" ? "#0b0b0d" : undefined,
    // Editing overlays (textarea, drawn caret) never appear in images.
    filter: (node: HTMLElement) =>
      !node.classList?.contains("code-editor") &&
      !node.classList?.contains("code-caret"),
  });
  const copyCardImage = async () => {
    if (!preview.current) return;
    setBusy(true);
    try {
      await document.fonts.ready;
      const node = preview.current;
      // Hand the clipboard a promise so Safari keeps the user gesture.
      const blob = toBlob(node, cardImageOptions("png")).then((b) => {
        if (!b) throw new Error("Image could not be rendered.");
        return b;
      });
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      notify("Image copied to clipboard.");
    } catch {
      notify("Copying images isn't available here. Download a PNG instead.");
    } finally {
      setBusy(false);
    }
  };
  const exportImage = async (format: string) => {
    setMenu(false);
    setBusy(true);
    try {
      if (work.kind === "canvas") {
        await exportCanvas(format);
      } else {
        if (!preview.current) return;
        await document.fonts.ready;
        const url = await (format === "jpeg" ? toJpeg : toPng)(
          preview.current,
          cardImageOptions(format),
        );
        const a = document.createElement("a");
        a.download = `flair-card.${format === "jpeg" ? "jpg" : "png"}`;
        a.href = url;
        a.click();
      }
      notify("Export downloaded.");
    } catch (err) {
      notify(
        `Export failed. ${err instanceof Error ? err.message : "Please try again."}`,
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="studio">
      {/* Canonical tab URLs: /cards and unknown tabs go to a real tab. */}
      {routeKind === "card" && tabSlug !== tab.toLowerCase() && (
        <Navigate to={`/cards/${tab.toLowerCase()}`} replace />
      )}
      <header className="studio-header">
        <a className="brand" href="/" aria-label="Flair home">
          Flair
          <img className="brand-logo" src={flairLogo} alt="" />
        </a>
        <div className="mode-switch" aria-label="Workspace">
          <NavLink to="/cards">
            <Code2 size={16} />
            Code Cards
          </NavLink>
          <NavLink to="/canvas">
            <PenTool size={16} />
            Canvas
          </NavLink>
        </div>
        <div className="header-actions">
          <span className="draft-status" role="note" title={draftStatus}>
            <i className="status-dot" />
            <span>{draftStatus}</span>
          </span>
          <button
            title={`Start a new ${work.kind === "card" ? "card" : "canvas"} (undo with ⌘/Ctrl Z)`}
            onClick={() => {
              // Undoable, so no confirmation is needed.
              change(
                work.kind === "card"
                  ? { ...work, card: defaultCard() }
                  : { ...work, board: emptyBoard() },
              );
              setProjectId(null);
              setActiveBlock(0);
              notify(
                `Started a new ${work.kind === "card" ? "card" : "canvas"}. Press ⌘/Ctrl Z to undo.`,
              );
            }}
          >
            <Plus size={16} />
            <span>New {work.kind === "card" ? "card" : "canvas"}</span>
          </button>
          <button onClick={() => setLibrary(true)}>
            <FolderOpen size={16} />
            <span>My projects</span>
          </button>
          <button
            className="icon-button"
            title="Undo (⌘/Ctrl Z)"
            aria-label="Undo"
            disabled={!past.length}
            onClick={undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            className="icon-button"
            title="Redo (⌘/Ctrl Shift Z)"
            aria-label="Redo"
            disabled={!future.length}
            onClick={redo}
          >
            <Redo2 size={17} />
          </button>
          <button onClick={save}>
            <Save size={16} />
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
          <div className="export-wrap">
            <button
              className="primary"
              disabled={busy}
              onClick={() => setMenu(!menu)}
            >
              <Download size={16} />
              {busy ? "Exporting…" : "Export"}
              <ChevronDown size={14} />
            </button>
            {menu && (
              <>
                <button
                  className="menu-dismiss"
                  aria-label="Close export menu"
                  onClick={() => setMenu(false)}
                />
                <div className="export-menu">
                  <button onClick={() => exportImage("png")}>
                    PNG image <small>Share your creation</small>
                  </button>
                  {work.kind === "card" ? (
                    <button onClick={() => exportImage("jpeg")}>
                      JPEG image <small>Smaller file size</small>
                    </button>
                  ) : (
                    <button onClick={() => exportImage("svg")}>
                      SVG vector <small>Scalable canvas</small>
                    </button>
                  )}
                  <button onClick={projectFile}>
                    Editable project <small>JSON · save or share a copy</small>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      {work.kind === "card" ? (
        <div className="card-workspace">
          <nav className="tool-rail" aria-label="Card settings">
            {cardTabs.map((t) => {
              const Icon = tabIcons[t] || Code2;
              return (
                <button
                  key={t}
                  title={t}
                  aria-label={t}
                  aria-pressed={tab === t}
                  className={tab === t ? "active" : ""}
                  onClick={() => openTab(t)}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <small>{t}</small>
                </button>
              );
            })}
          </nav>
          <aside className="inspector">
            <CardControls
              card={work.card}
              tab={tab}
              change={(card) => change({ ...work, card })}
              notify={notify}
              size={dims}
              onExport={exportImage}
              onCopyImage={copyCardImage}
            />
          </aside>
          <main className="card-main">
            <div className="workspace-heading">
              <input
                className="card-title-input"
                aria-label="Card title"
                value={work.card.title}
                placeholder="Untitled card"
                onChange={(e) =>
                  change({
                    ...work,
                    card: { ...work.card, title: e.target.value },
                  })
                }
              />
              <button
                className="size-chip"
                title="Change export size"
                onClick={() => openTab("Export")}
              >
                {work.card.autoSize && "Auto · "}
                {Math.round(dims.w)} × {Math.round(dims.h)}
                <ChevronDown size={12} />
              </button>
            </div>
            <div className="preview-stage" ref={stage}>
              <CardPreview
                card={work.card}
                exportRef={preview}
                scale={Math.max(0.08, scale)}
                size={dims}
                onMeasure={setNatural}
                onPickBlock={setActiveBlock}
                onCodeChange={(id, code) =>
                  change({
                    ...work,
                    card: {
                      ...work.card,
                      blocks: work.card.blocks.map((b) =>
                        b.id === id ? { ...b, code } : b,
                      ),
                    },
                  })
                }
              />
            </div>
            <BlockBar
              card={work.card}
              active={activeBlock}
              setActive={setActiveBlock}
              change={(card) => change({ ...work, card })}
              notify={notify}
            />
          </main>
        </div>
      ) : (
        <Canvas
          board={work.board}
          change={(board) => change({ ...work, board })}
          svgRef={svg}
          notify={notify}
        />
      )}
      <input
        hidden
        ref={importRef}
        type="file"
        accept="application/json,.json"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            if (f.size > 20 * 1024 * 1024)
              throw new Error("Project must be under 20 MB.");
            const p = parseProject(await f.text());
            replaceWorkspace({
              ...work,
              kind: p.kind,
              ...(p.kind === "card" ? { card: p.data } : { board: p.data }),
            });
            navigate(workspacePath(p.kind));
            setProjectId(null);
            setLibrary(false);
            notify("Project imported. Save it to add it to your library.");
          } catch (err) {
            notify(
              err instanceof Error
                ? err.message
                : "Could not import this project.",
            );
          }
        }}
      />
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {library && (
        <div className="modal-backdrop">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="My projects"
            className="library-modal"
          >
            <div className="section-title">
              <h2>My projects</h2>
              <button
                aria-label="Close library"
                onClick={() => setLibrary(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="muted">
              Stored only in this browser. Download a project file for a
              portable backup.
            </p>
            <div className="library-actions">
              <button
                onClick={() => {
                  replaceWorkspace({
                    ...work,
                    ...(work.kind === "card"
                      ? { card: defaultCard() }
                      : { board: emptyBoard() }),
                  });
                  setProjectId(null);
                  setLibrary(false);
                }}
              >
                <Plus size={16} />
                New {work.kind === "card" ? "card" : "canvas"}
              </button>
              <button onClick={() => importRef.current?.click()}>
                <Upload size={16} />
                Import JSON
              </button>
            </div>
            {!projects.length && (
              <div className="library-empty">
                <FolderOpen size={38} />
                <h3>No saved projects yet</h3>
                <p>Press ⌘/Ctrl S to save the current card or canvas here.</p>
              </div>
            )}
            <div className="project-grid">
              {projects.map((p) => (
                <article key={p.id}>
                  <div className={`project-cover cover-${p.kind}`}>
                    {p.kind === "card" ? (
                      <Code2 size={32} />
                    ) : (
                      <PenTool size={32} />
                    )}
                    <span>{p.kind === "card" ? "CODE CARD" : "CANVAS"}</span>
                  </div>
                  <h3>{p.name || "Untitled"}</h3>
                  <small>{new Date(p.updated).toLocaleString()}</small>
                  <div className="section-title">
                    <button
                      onClick={() => {
                        try {
                          replaceWorkspace({
                            ...work,
                            kind: p.kind,
                            ...(p.kind === "card"
                              ? { card: validateCard(p.data) }
                              : { board: validateBoard(p.data) }),
                          });
                          navigate(workspacePath(p.kind));
                          setProjectId(p.id);
                          setLibrary(false);
                        } catch {
                          notify("This project could not be opened.");
                        }
                      }}
                    >
                      Open project
                    </button>
                    <button
                      aria-label={`Delete ${p.name}`}
                      onClick={() => {
                        try {
                          removeProject(p.id);
                          setProjects(readProjects());
                          if (projectId === p.id) setProjectId(null);
                          notify(
                            "Project removed from library. The current draft is kept.",
                          );
                        } catch {
                          notify("Could not update local storage.");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

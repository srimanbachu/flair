import { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import type { Card } from "./model";
import { defaultCard, uid, cardTabs } from "./model";
import type { Board } from "./canvasModel";
import { emptyBoard } from "./canvasModel";
import { CardControls } from "./CardControls";
import { CardPreview } from "./CardPreview";
import { Canvas } from "./Canvas";
import type { SavedProject } from "./storage";
import { download, readProjects, removeProject, saveProject } from "./storage";
import { parseProject, validateBoard, validateCard } from "./projectFiles";
import flairLogo from "../assets/flair.png";
import "./studio.css";
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
  const [past, setPast] = useState<Workspace[]>([]);
  const [future, setFuture] = useState<Workspace[]>([]);
  const [tab, setTab] = useState("Code");
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(false);
  const [draftStatus, setDraftStatus] = useState("Saving draft…");
  const [library, setLibrary] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>(readProjects);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(0.55);
  const [projectId, setProjectId] = useState<string | null>(null);
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
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(
        Math.min(
          1,
          (entry.contentRect.width - 64) / work.card.width,
          (entry.contentRect.height - 80) / work.card.height,
        ),
      ),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [work.card.width, work.card.height, work.kind]);
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
  const exportImage = async (format: string) => {
    setMenu(false);
    setBusy(true);
    try {
      if (work.kind === "canvas") {
        await exportCanvas(format);
      } else {
        if (!preview.current) return;
        await document.fonts.ready;
        const options = {
          pixelRatio: work.card.quality,
          width: work.card.width,
          height: work.card.height,
          style: { transform: "none" },
          backgroundColor: format === "jpeg" ? "#0b0b0d" : undefined,
        };
        const url = await (format === "jpeg" ? toJpeg : toPng)(
          preview.current,
          options,
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
  const cardHeight = work.card.blocks.reduce(
    (sum, b) =>
      sum +
      b.code.split("\n").length * work.card.fontSize * work.card.lineHeight +
      51 +
      (work.card.fileName || work.card.controls ? 52 : 0) +
      20,
    -20,
  );
  const contentClipped =
    cardHeight > work.card.height - work.card.padding * 2 ||
    work.card.blocks.some(
      (b) =>
        Math.max(...b.code.split("\n").map((line) => line.length)) *
          work.card.fontSize *
          0.62 +
          52 +
          (work.card.lineNumbers ? 38 : 0) >
        work.card.width - work.card.padding * 2,
    );
  return (
    <div className="studio">
      <header className="studio-header">
        <a className="brand" href="/" aria-label="Flair home">
          Flair
          <img className="brand-logo" src={flairLogo} alt="" />
        </a>
        <div className="mode-switch" aria-label="Workspace">
          <button
            className={work.kind === "card" ? "active" : ""}
            onClick={() => {
              setWork({ ...work, kind: "card" });
              setProjectId(null);
            }}
          >
            <Code2 size={16} />
            Code Cards
          </button>
          <button
            className={work.kind === "canvas" ? "active" : ""}
            onClick={() => {
              setWork({ ...work, kind: "canvas" });
              setProjectId(null);
            }}
          >
            <PenTool size={16} />
            Canvas
          </button>
        </div>
        <div className="header-actions">
          <span className="draft-status" role="note" title={draftStatus}>
            <i className="status-dot" />
            <span>{draftStatus}</span>
          </span>
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
            {cardTabs.map((t, i) => (
              <button
                key={t}
                title={t}
                aria-label={t}
                aria-pressed={tab === t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                <span>{["⌘", "Aa", "◒", "▣", "✧", "↗", "▦", "⇩"][i]}</span>
                <small>{t}</small>
              </button>
            ))}
          </nav>
          <aside className="inspector">
            <CardControls
              card={work.card}
              tab={tab}
              change={(card) => change({ ...work, card })}
              notify={notify}
            />
          </aside>
          <main className="card-main">
            <div className="workspace-heading">
              <div>
                <span className="eyebrow">THE SPOTLIGHT IS YOURS</span>
                <h1>{work.card.title}</h1>
              </div>
              <span className="live-badge">
                <i />
                Live preview
              </span>
            </div>
            <div className="preview-stage" ref={stage}>
              <CardPreview
                card={work.card}
                exportRef={preview}
                scale={Math.max(0.08, scale)}
                change={(card) => change({ ...work, card })}
              />
            </div>
            <div className="preview-status">
              <span>
                <Sparkles size={14} />
                {contentClipped
                  ? "Content may be cropped. Increase dimensions or reduce type size."
                  : "A little code. A lot of personality."}
              </span>
              <button onClick={() => setTab("Export")}>
                {work.card.width} × {work.card.height} <ChevronDown size={12} />
              </button>
            </div>
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
              <div>
                <span className="eyebrow">YOUR CREATIVE CORNER</span>
                <h2>My projects</h2>
              </div>
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
                <h3>A home for your best ideas.</h3>
                <p>Save your first card or canvas to find it here.</p>
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
                          setProjectId(p.id);
                          setLibrary(false);
                        } catch {
                          notify("This project could not be opened.");
                        }
                      }}
                    >
                      Open project ↗
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

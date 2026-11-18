import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { IconEntry } from "./catalog";
import { jsxSource, svgSource } from "./source";
import { copyText } from "./clipboard";

export function IconInspector({ entry, notify }: {
  entry: IconEntry;
  notify: (message: string) => void;
}) {
  const [size, setSize] = useState(24);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [copied, setCopied] = useState("");
  const svg = useRef<SVGSVGElement>(null);
  const { Icon, name } = entry;
  async function copy(format: "JSX" | "SVG") {
    try {
      if (!svg.current) return;
      await copyText(format === "JSX" ? jsxSource(name, size, strokeWidth) : svgSource(svg.current));
      setCopied(`${name}:${format}`);
      notify(`${name} ${format} copied to clipboard.`);
    } catch {
      notify("Could not access your clipboard. Select and copy the JSX below.");
    }
  }
  return <aside className="dev-inspector" aria-label="Icon details">
    <div className="dev-preview"><Icon ref={svg} size={size} strokeWidth={strokeWidth} aria-hidden="true" /></div>
    <h2>{name}</h2>
    <p>Lucide React · Outline</p>
    <div className="dev-options">
      <label>Size <select aria-label="Icon size" value={size} onChange={(event) => setSize(Number(event.target.value))}>
        {[16, 20, 24, 32, 48, 64].map((value) => <option key={value} value={value}>{value} px</option>)}
      </select></label>
      <label>Stroke <select aria-label="Stroke width" value={strokeWidth} onChange={(event) => setStrokeWidth(Number(event.target.value))}>
        {[1, 1.5, 2, 2.5, 3].map((value) => <option key={value} value={value}>{value} px</option>)}
      </select></label>
    </div>
    <div className="dev-copy-actions">{(["JSX", "SVG"] as const).map((format) =>
      <button key={format} className={format === "JSX" ? "primary" : "dev-copy-svg"} onClick={() => copy(format)}>
        {copied === `${name}:${format}` ? <Check size={14} /> : <Copy size={14} />} Copy {format}
      </button>)}
    </div>
    <pre className="dev-source" tabIndex={0} aria-label="JSX source"><code>{jsxSource(name, size, strokeWidth)}</code></pre>
    <p className="dev-inspector-note">Ready to drop into your next project.</p>
    <a className="dev-license" href="https://lucide.dev/license" target="_blank" rel="noreferrer">Lucide · ISC license ↗</a>
  </aside>;
}

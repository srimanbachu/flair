import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { collections } from "./catalog";
import type { IconEntry } from "./catalog";
import { jsxSource, svgSource } from "./source";
import { copyText } from "./clipboard";
import { Artwork } from "./Artwork";
import { useIconData } from "./useIconData";

export function IconInspector({
  entry,
  notify,
}: {
  entry: IconEntry;
  notify: (message: string) => void;
}) {
  const [size, setSize] = useState(24);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [copied, setCopied] = useState("");
  const { data, error, retry } = useIconData(entry);
  const collection = collections.find(
    (item) => item.prefix === entry.collection,
  )!;
  const copyKey = `${entry.id}:${size}:${strokeWidth}`;
  async function copy(format: "JSX" | "SVG") {
    if (!data) return;
    try {
      await copyText(
        format === "JSX"
          ? jsxSource(data.artwork, size, strokeWidth, data.license)
          : svgSource(data.artwork, size, strokeWidth, data.license),
      );
      setCopied(`${copyKey}:${format}`);
      notify(`${entry.name} ${format} copied to clipboard.`);
    } catch {
      notify(
        "Could not access your clipboard. Select and copy the source below.",
      );
    }
  }
  return (
    <aside
      id="dev-icon-details"
      className="dev-inspector"
      aria-label="Icon details"
    >
      <div className="dev-preview" aria-busy={!data && !error}>
        {data ? (
          <Artwork
            artwork={data.artwork}
            size={size}
            strokeWidth={strokeWidth}
          />
        ) : error ? (
          <div role="alert">
            <p>{error}</p>
            <button onClick={retry}>Retry loading icon</button>
          </div>
        ) : (
          <span className="dev-icon-loading">Loading icon…</span>
        )}
      </div>
      <h2>{entry.name}</h2>
      <p>
        {collection.label} ·{" "}
        {data?.artwork.stroke ? "Outline" : data ? "Vector" : "Loading…"}
      </p>
      <div className="dev-options">
        <label>
          Size{" "}
          <select
            aria-label="Icon size"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          >
            {[16, 20, 24, 32, 48, 64].map((value) => (
              <option key={value} value={value}>
                {value} px
              </option>
            ))}
          </select>
        </label>
        <label>
          Stroke{" "}
          <select
            aria-label="Stroke width"
            value={strokeWidth}
            disabled={!data?.artwork.stroke}
            title={
              data && !data.artwork.stroke
                ? "This icon uses filled shapes."
                : undefined
            }
            onChange={(event) => setStrokeWidth(Number(event.target.value))}
          >
            {[1, 1.5, 2, 2.5, 3].map((value) => (
              <option key={value} value={value}>
                {value} px
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="dev-copy-actions">
        {(["JSX", "SVG"] as const).map((format) => (
          <button
            key={format}
            disabled={!data}
            className={format === "JSX" ? "primary" : "dev-copy-svg"}
            onClick={() => copy(format)}
          >
            {copied === `${copyKey}:${format}` ? (
              <Check size={14} />
            ) : (
              <Copy size={14} />
            )}{" "}
            Copy {format}
          </button>
        ))}
      </div>
      <pre className="dev-source" tabIndex={0} aria-label="JSX source">
        <code>
          {data
            ? jsxSource(data.artwork, size, strokeWidth)
            : "Loading source…"}
        </code>
      </pre>
      <p className="dev-inspector-note">
        Self-contained SVG and JSX. No icon package required.
      </p>
      <a
        className="dev-license"
        href={`${import.meta.env.BASE_URL}icons/NOTICE.txt`}
        target="_blank"
        rel="noreferrer"
      >
        Icon licenses ↗
      </a>
    </aside>
  );
}

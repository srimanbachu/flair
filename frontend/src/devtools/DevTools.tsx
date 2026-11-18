import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { catalog, defaultIcon } from "./catalog";
import { searchIcons } from "./search";
import type { Category } from "./search";
import { IconSearch } from "./IconSearch";
import { IconGrid } from "./IconGrid";
import { IconInspector } from "./IconInspector";
import "./devtools.css";

export default function DevTools({
  notify,
}: {
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("All icons");
  const [selected, setSelected] = useState(defaultIcon);
  const [limit, setLimit] = useState(96);
  const results = useMemo(
    () => searchIcons(catalog, query, category),
    [query, category],
  );
  return (
    <main className="dev-tools">
      <div className="dev-content">
        <header className="dev-heading">
          <div>
            <span className="dev-eyebrow">THE DEVELOPER'S CORNER</span>
            <h1>
              Dev Tools<span>.</span>
            </h1>
            <p>
              Small tools. A little less friction. Start with the perfect icon.
            </p>
          </div>
          <span className="dev-library-badge">Lucide React</span>
        </header>
        <IconSearch
          query={query}
          category={category}
          onQuery={(value) => {
            setQuery(value);
            setLimit(96);
          }}
          onCategory={(value) => {
            setCategory(value);
            setLimit(96);
          }}
        />
        <p className="dev-result-count" role="status">
          {results.length.toLocaleString()} icons
          {query.trim() && ` matching “${query.trim()}”`}
        </p>
        {results.length ? (
          <IconGrid
            entries={results}
            selected={selected.name}
            limit={limit}
            onSelect={(entry) => {
              setSelected(entry);
              if (window.matchMedia("(max-width: 680px)").matches)
                document
                  .getElementById("dev-icon-details")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            onMore={() => setLimit((value) => value + 96)}
          />
        ) : (
          <div className="dev-empty">
            <SearchX size={28} />
            <h2>No icons found</h2>
            <p>Try a different name or browse all icons.</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory("All icons");
                setLimit(96);
              }}
            >
              Reset search
            </button>
          </div>
        )}
      </div>
      <IconInspector entry={selected} notify={notify} />
    </main>
  );
}

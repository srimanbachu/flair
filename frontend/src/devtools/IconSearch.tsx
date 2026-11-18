import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { categories } from "./search";
import type { Category } from "./search";
import { collections } from "./catalog";

export function IconSearch({
  query,
  category,
  collection,
  onQuery,
  onCategory,
  onCollection,
}: {
  query: string;
  category: Category;
  collection: string;
  onQuery: (value: string) => void;
  onCategory: (value: Category) => void;
  onCollection: (value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  // "/" jumps to search from anywhere on the page, as in most icon sites.
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      event.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return (
    <div className="dev-toolbar">
      <div className="dev-search">
        <Search size={16} aria-hidden="true" />
        <input
          ref={input}
          aria-label="Search icons"
          placeholder="Search icons…"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
        {query ? (
          <button
            aria-label="Clear search"
            onClick={() => {
              onQuery("");
              input.current?.focus();
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <kbd aria-hidden="true">/</kbd>
        )}
      </div>
      <select
        className="dev-collection-select"
        aria-label="Icon collection"
        value={collection}
        onChange={(event) => onCollection(event.target.value)}
      >
        <option value="all">All collections</option>
        {collections.map((item) => (
          <option key={item.prefix} value={item.prefix}>
            {item.label} · {item.count.toLocaleString()}
          </option>
        ))}
      </select>
      <div className="dev-categories" aria-label="Icon categories">
        {categories.map((value) => (
          <button
            key={value}
            aria-pressed={category === value}
            className={category === value ? "active" : ""}
            onClick={() => onCategory(value)}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

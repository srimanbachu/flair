import { Search, X } from "lucide-react";
import { categories } from "./search";
import type { Category } from "./search";

export function IconSearch({ query, category, onQuery, onCategory }: {
  query: string;
  category: Category;
  onQuery: (value: string) => void;
  onCategory: (value: Category) => void;
}) {
  return <div className="dev-toolbar">
    <div className="dev-search">
      <Search size={16} aria-hidden="true" />
      <input aria-label="Search icons" placeholder="Search icons…" value={query}
        onChange={(event) => onQuery(event.target.value)} />
      {query && <button aria-label="Clear search" onClick={() => onQuery("")}><X size={14} /></button>}
    </div>
    <div className="dev-categories" aria-label="Icon categories">
      {categories.map((value) => <button key={value} aria-pressed={category === value}
        className={category === value ? "active" : ""} onClick={() => onCategory(value)}>{value}</button>)}
    </div>
  </div>;
}

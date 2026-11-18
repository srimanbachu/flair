import type { IconEntry } from "./catalog";
import { IconTile } from "./IconTile";

export function IconGrid({
  entries,
  selected,
  limit,
  onSelect,
  onMore,
}: {
  entries: IconEntry[];
  selected: string;
  limit: number;
  onSelect: (entry: IconEntry) => void;
  onMore: () => void;
}) {
  return (
    <>
      <div className="dev-icon-grid" aria-label="Icon catalog">
        {entries.slice(0, limit).map((entry) => (
          <IconTile
            key={entry.id}
            entry={entry}
            selected={selected === entry.id}
            onSelect={onSelect}
          />
        ))}
      </div>
      {entries.length > limit && (
        <button className="dev-load-more" onClick={onMore}>
          Show more icons · {entries.length - limit} remaining
        </button>
      )}
    </>
  );
}

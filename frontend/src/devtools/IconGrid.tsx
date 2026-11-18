import type { IconEntry } from "./catalog";
import { IconTile } from "./IconTile";

export function IconGrid({
  entries,
  selected,
  limit,
  onMore,
}: {
  entries: IconEntry[];
  selected: string;
  limit: number;
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

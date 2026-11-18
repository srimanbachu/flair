import type { IconEntry } from "./catalog";
import { Artwork } from "./Artwork";
import { useIconData } from "./useIconData";

export function IconTile({
  entry,
  selected,
  onSelect,
}: {
  entry: IconEntry;
  selected: boolean;
  onSelect: (entry: IconEntry) => void;
}) {
  const { name, label } = entry;
  const { data, error } = useIconData(entry);
  return (
    <button
      className={`dev-icon-tile${selected ? " selected" : ""}`}
      aria-label={name}
      aria-pressed={selected}
      title={name}
      data-icon-id={entry.id}
      onClick={() => onSelect(entry)}
    >
      {data ? (
        <Artwork artwork={data.artwork} size={24} />
      ) : (
        <span className="dev-icon-placeholder" aria-hidden="true">
          {error ? "!" : "·"}
        </span>
      )}
      <span>{label}</span>
    </button>
  );
}

import type { IconEntry } from "./catalog";

export function IconTile({
  entry,
  selected,
  onSelect,
}: {
  entry: IconEntry;
  selected: boolean;
  onSelect: (entry: IconEntry) => void;
}) {
  const { Icon, name, label } = entry;
  return (
    <button
      className={`dev-icon-tile${selected ? " selected" : ""}`}
      aria-label={name}
      aria-pressed={selected}
      title={name}
      onClick={() => onSelect(entry)}
    >
      <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

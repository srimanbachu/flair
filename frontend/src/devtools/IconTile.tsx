import type { IconEntry } from "./catalog";
import { Link } from "react-router-dom";
import { iconPath } from "./iconRoutes";
import { Artwork } from "./Artwork";
import { useIconData } from "./useIconData";

export function IconTile({
  entry,
  selected,
}: {
  entry: IconEntry;
  selected: boolean;
}) {
  const { name, label } = entry;
  const { data, error } = useIconData(entry);
  return (
    <Link
      to={iconPath(entry)}
      className={`dev-icon-tile${selected ? " selected" : ""}`}
      aria-label={name}
      aria-current={selected ? "page" : undefined}
      title={name}
      data-icon-id={entry.id}
    >
      {data ? (
        <Artwork artwork={data.artwork} size={24} />
      ) : (
        <span className="dev-icon-placeholder" aria-hidden="true">
          {error ? "!" : "·"}
        </span>
      )}
      <span>{label}</span>
    </Link>
  );
}

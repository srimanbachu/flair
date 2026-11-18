import { useId, useMemo } from "react";
import type { IconData } from "./iconData";
import { iconBody } from "./source";

export function Artwork({
  artwork,
  size,
  strokeWidth,
}: {
  artwork: IconData;
  size: number;
  strokeWidth?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const body = useMemo(
    () => iconBody(artwork, strokeWidth, `icon-${id}-`),
    [artwork, strokeWidth, id],
  );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${artwork.width} ${artwork.height}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

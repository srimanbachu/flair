import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type IconEntry = { name: string; label: string; Icon: LucideIcon };

// Use the installed package as the source of truth; no hand-maintained icon list.
export const catalog: IconEntry[] = Object.entries(icons)
  .map(([name, Icon]) => ({
    name,
    label: name.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
    Icon,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const defaultIcon = catalog.find((icon) => icon.name === "Terminal")!;

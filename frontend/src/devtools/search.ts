import type { IconEntry } from "./catalog";

export const categories = ["All icons", "Development"] as const;
export type Category = (typeof categories)[number];
const development = /code|terminal|braces|brackets|bug|database|server|git|file|folder|cloud|network|webhook|workflow|cpu|memory|binary|container|package|blocks|component|puzzle|command|keyboard|monitor|laptop|hard.drive|ethernet|usb|circuit|regex|variable|function/i;

export function searchIcons(icons: IconEntry[], query: string, category: Category) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return icons.filter((icon) => {
    const text = `${icon.name} ${icon.label}`.toLowerCase().replace(/[-_]/g, " ");
    return (category === "All icons" || development.test(icon.label)) &&
      words.every((word) => text.includes(word.replace(/[-_]/g, " ")));
  });
}

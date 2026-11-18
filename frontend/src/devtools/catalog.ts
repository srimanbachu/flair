import manifest from "./data/manifest.json";

export type IconEntry = {
  id: string;
  key: string;
  name: string;
  label: string;
  collection: string;
};

export const collections = manifest.collections;
export const catalog: IconEntry[] = collections.flatMap((collection) =>
  collection.names.map((key) => ({
    id: `${collection.prefix}:${key}`,
    key,
    name: key
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(""),
    label: key.replaceAll("-", " "),
    collection: collection.prefix,
  })),
);

export const defaultIcon = catalog.find(
  (icon) => icon.id === "lucide:terminal",
)!;

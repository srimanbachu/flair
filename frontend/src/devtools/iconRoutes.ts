import { catalog, collections } from "./catalog";
import type { IconEntry } from "./catalog";

const slugs = new Map(
  collections.map((collection) => [
    collection.prefix,
    collection.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
  ]),
);

export function iconPath(entry: IconEntry) {
  return `/dev-tools/${slugs.get(entry.collection)}/${entry.key}`;
}

const iconsByPath = new Map(catalog.map((entry) => [iconPath(entry), entry]));

export function iconAtPath(pathname: string) {
  return iconsByPath.get(pathname.replace(/\/+$/, ""));
}

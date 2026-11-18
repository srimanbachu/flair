import { collections } from "./catalog";
import type { IconEntry } from "./catalog";

export type IconData = {
  body: string;
  width: number;
  height: number;
  stroke: boolean;
};
type CollectionData = {
  icons: Record<string, IconData>;
  license: string;
  licenseId: string;
};
export type LoadedIcon = {
  artwork: IconData;
  license: string;
  licenseId: string;
};
const pending = new Map<string, Promise<CollectionData>>();
const loaded = new Map<string, CollectionData>();
type CollectionState = { error?: string };
const empty: CollectionState = {};
const states = new Map<string, CollectionState>();
const listeners = new Map<string, Set<() => void>>();

export function getCollectionState(prefix: string) {
  return states.get(prefix) ?? empty;
}

export function subscribeCollection(prefix: string, listener: () => void) {
  const group = listeners.get(prefix) ?? new Set<() => void>();
  group.add(listener);
  listeners.set(prefix, group);
  return () => {
    group.delete(listener);
  };
}

function publish(prefix: string, state: CollectionState) {
  states.set(prefix, state);
  listeners.get(prefix)?.forEach((listener) => listener());
}

function extract(data: CollectionData, key: string): LoadedIcon {
  const artwork = data.icons[key];
  if (!artwork) throw new Error("Icon is missing from this collection.");
  return { artwork, license: data.license, licenseId: data.licenseId };
}

export function peekIcon(entry: IconEntry): LoadedIcon | undefined {
  const data = loaded.get(entry.collection);
  return data ? extract(data, entry.key) : undefined;
}

export async function loadIcon(entry: IconEntry): Promise<LoadedIcon> {
  let request = pending.get(entry.collection);
  if (!request) {
    const collection = collections.find(
      (item) => item.prefix === entry.collection,
    );
    if (!collection) throw new Error("Unknown icon collection.");
    publish(entry.collection, {});
    request = fetch(`${import.meta.env.BASE_URL}icons/${collection.file}`)
      .then(async (response) => {
        if (!response.ok)
          throw new Error("The icon collection could not be loaded.");
        const data: CollectionData = await response.json();
        if (
          !data.icons ||
          !data.license ||
          !collection.names.every((key) => data.icons[key]?.body)
        )
          throw new Error("The icon collection is incomplete.");
        loaded.set(entry.collection, data);
        publish(entry.collection, {});
        return data;
      })
      .catch((error: unknown) => {
        pending.delete(entry.collection);
        publish(entry.collection, {
          error: "Couldn't load this icon. Try again.",
        });
        throw error;
      });
    pending.set(entry.collection, request);
  }
  return extract(await request, entry.key);
}

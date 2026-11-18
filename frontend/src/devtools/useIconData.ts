import { useEffect, useSyncExternalStore } from "react";
import type { IconEntry } from "./catalog";
import {
  getCollectionState,
  loadIcon,
  peekIcon,
  subscribeCollection,
} from "./iconData";

export function useIconData(entry: IconEntry) {
  const state = useSyncExternalStore(
    (listener) => subscribeCollection(entry.collection, listener),
    () => getCollectionState(entry.collection),
  );
  useEffect(() => {
    void loadIcon(entry).catch(() => {
      /* The shared state reports loading errors. */
    });
  }, [entry]);
  return {
    data: peekIcon(entry),
    error: state.error,
    retry: () => {
      void loadIcon(entry).catch(() => {
        /* Keep the retry action available. */
      });
    },
  };
}

import { lsGetJSON, lsSetJSON } from "../utils";
import { setStore } from "../store";

export const DISCOVERY_COLLECTION = "discovery";

export function getCollection(name: string): string[] {
  return lsGetJSON(`collection_${name}`, []);
}

export function getCollectionItems(name: string): TrackItem[] {
  return lsGetJSON(`collection_items_${name}`, []);
}

export function addToCollection(name: string, items: TrackItem[]) {
  const currentIds = getCollection(name);
  const currentItems = getCollectionItems(name);
  
  const newIds = [...currentIds];
  const newItems = [...currentItems];
  
  items.forEach(item => {
    if (!newIds.includes(item.id)) {
      newIds.push(item.id);
      newItems.push({ ...item, modified: Date.now() });
    }
  });
  
  lsSetJSON(`collection_${name}`, newIds);
  lsSetJSON(`collection_items_${name}`, newItems);
  setStore("libraryUpdated", Date.now());
}

export function removeFromCollection(name: string, ids: string[]) {
  const currentIds = getCollection(name);
  const currentItems = getCollectionItems(name);
  
  const newIds = currentIds.filter(id => !ids.includes(id));
  const newItems = currentItems.filter(item => !ids.includes(item.id));
  
  lsSetJSON(`collection_${name}`, newIds);
  lsSetJSON(`collection_items_${name}`, newItems);
  setStore("libraryUpdated", Date.now());
}

export function deleteCollection(name: string) {
  localStorage.removeItem(`collection_${name}`);
  localStorage.removeItem(`collection_items_${name}`);
  setStore("libraryUpdated", Date.now());
}

export function fetchCollection(name: string) {
  // Logic to fetch or refresh collection data
  setStore("libraryUpdated", Date.now());
}

export function getLibraryAlbums() {
  return lsGetJSON("library_albums", []);
}

export function recordTrackPlay(track: TrackItem) {
  // Logic to record plays
}

export function cacheTrackOnFinished(track: TrackItem) {
  // Logic for caching
}

export function setCachingMode(mode: string) {
  // Logic for setting caching mode
}

export function syncLibrary(mode: string) {
  // Logic for syncing library
}

export function createCollection(name: string) {
  const keys = getCollectionsKeys();
  if (!keys.includes(name)) {
    lsSetJSON("collection_keys", [...keys, name]);
    setStore("libraryUpdated", Date.now());
  }
}

export function getCollectionsKeys(): string[] {
  return lsGetJSON("collection_keys", ["history", "favorites", "liked", "listenLater"]);
}

export const CACHED_COLLECTION = "cached";

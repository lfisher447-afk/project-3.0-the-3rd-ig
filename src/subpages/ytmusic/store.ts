import React, { lazy, useSyncExternalStore } from "react";
import {
  shuffle,
  convertSStoHHMMSS,
  parseDuration,
  clamp,
  isTopicAuthor,
  normalizeAuthorKey,
  pickImage,
  withTopicSuffix,
} from "./utils";
import {
  config,
  playerBackground,
  setConfig,
  VOLUME_PRESETS,
  drawer,
  setDrawer,
} from "./config";
import {
  addToCollection,
  recordTrackPlay,
  cacheTrackOnFinished,
  getLibraryAlbums,
} from "./modules/library";
import { player } from "./modules/playback";
import { cssVar, themer } from "./modules/theme";

// Types are defined in types.d.ts which is global

export type SetStoreFunction<T> = {
  <K extends keyof T>(key: K, value: T[K] | ((prev: T[K]) => T[K])): void;
  <K1 extends keyof T, K2 extends keyof T[K1]>(
    k1: K1,
    k2: K2,
    value: T[K1][K2] | ((prev: T[K1][K2]) => T[K1][K2]),
  ): void;
  (fn: (prev: T) => T): void;
  (value: Partial<T>): void;
  (...args: any[]): void;
};

export function createStore<T extends object>(initialState: T): [
  T,
  SetStoreFunction<T>,
  () => T,
  (listener: () => void) => () => void,
] {
  let state = { ...initialState };
  let version = 0;
  const listeners = new Set<() => void>();

  const notify = () => {
    version++;
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const setStore: SetStoreFunction<T> = (...args: any[]) => {
    if (args.length === 1) {
      if (typeof args[0] === "function") {
        state = args[0](state);
      } else if (typeof args[0] === "object" && args[0] !== null) {
        state = { ...state, ...args[0] };
      }
    } else if (args.length === 2) {
      const [key, val] = args;
      const current = (state as any)[key];
      const next = typeof val === "function" ? val(current) : val;
      state = { ...state, [key]: next };
    } else if (args.length === 3) {
      const [k1, k2, val] = args;
      const currentParent = (state as any)[k1] || {};
      const currentChild = currentParent[k2];
      const nextChild = typeof val === "function" ? val(currentChild) : val;
      state = {
        ...state,
        [k1]: {
          ...currentParent,
          [k2]: nextChild,
        },
      };
    }
    notify();
  };

  const proxy = new Proxy({} as T, {
    get(_, prop) {
      return (state as any)[prop];
    },
    set(_, prop, val) {
      (state as any)[prop] = val;
      notify();
      return true;
    },
    has(_, prop) {
      return prop in state;
    },
    ownKeys() {
      return Reflect.ownKeys(state);
    },
    getOwnPropertyDescriptor(_, prop) {
      return Reflect.getOwnPropertyDescriptor(state, prop);
    },
  });

  const useStore = () => {
    useSyncExternalStore(subscribe, () => version);
    return proxy;
  };

  return [proxy, setStore, useStore, subscribe] as const;
}

const storeInit = {
  api: "/api/ytmusic",
  useSaavn: false,
  locale: "en",
  translations: {} as Record<string, string>,
  libraryUpdated: 0,
  actionsMenu: undefined as TrackItem | undefined,
  snackbar: "",
  syncState: "synced" as SyncState,
};

export const [store, setStore, useAppStore] = createStore(storeInit);

export function t(key: TranslationKeys, value: string = ""): string {
  const translations = store.translations;
  const translatedString = translations[key] || (key as string);
  return value ? translatedString.replace("$", value) : translatedString;
}

export async function updateLang() {
  const locale = store.locale || "en";
  try {
    const response = await fetch(`/src/subpages/ytmusic/locales/${locale}.json`);
    const data = await response.json();
    setStore("translations", data);
  } catch (e) {
    console.error("Failed to load locale", e);
  }
}

// Lazy loaded features
const Search = lazy(() => import("./features/Search"));
const Library = lazy(() => import("./features/List"));
const List = lazy(() => import("./features/List"));
const Queue = lazy(() => import("./features/Queue"));
const Player = lazy(() => import("./features/Player"));
const Settings = lazy(() => import("./features/Settings"));

export const [navStore, setNavStore, useNavStore] = createStore({
  active: "search" as MainFeature,
  player: { ref: null as HTMLElement | null, state: false, component: Player },
  queue: { ref: null as HTMLElement | null, component: Queue },
  search: { ref: null as HTMLElement | null, component: Search },
  library: { ref: null as HTMLElement | null, component: Library },
  list: { ref: null as HTMLElement | null, component: List },
  settings: { ref: null as HTMLElement | null, component: Settings },
});

export type MainFeature = "queue" | "search" | "library" | "list" | "settings";

export function openSubView(feature: MainFeature) {
  setNavStore("active", feature);
}

export function closeSubView() {
  setNavStore("active", "search");
}

export const params = new URLSearchParams(window.location.search);

export function updateParam(key: string, value?: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  const newUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
  window.history.replaceState({}, "", newUrl);
}

const blankImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export const [playerStore, setPlayerStore, usePlayerStore] = createStore({
  audio: new Audio(),
  playbackState: "none" as "none" | "playing" | "paused" | "loading",
  context: { id: "", src: "" as Context },
  status: "",
  currentTime: 0,
  fullDuration: 0,
  playbackRate: 1.0,
  loop: false,
  volume: 1.0,
  stream: { title: "", author: "", authorId: "", id: "", duration: "" } as TrackItem,
  mediaArtwork: blankImage,
  isMusic: true,
  audioURL: "",
  videoURL: "",
  isWatching: false,
  saveProgress: false,
  proxy: "",
});

export const [queueStore, setQueueStore, useQueueStore] = createStore({
  list: [] as TrackItem[],
  history: [] as TrackItem[],
  removeMode: false,
  isLoading: false,
});

export function addToQueue(items: TrackItem[], options: { replace?: boolean, prepend?: boolean } = {}) {
  setQueueStore("list", prev => {
    let combined = options.replace ? items : (options.prepend ? [...items, ...prev] : [...prev, ...items]);
    return combined;
  });
}

export function playNext() {
  const next = queueStore.list[0];
  if (next) {
    setPlayerStore("stream", next);
    setQueueStore("list", prev => prev.slice(1));
    player(next.id);
  }
}

export function playPrev() {
  const prev = queueStore.history[0];
  if (prev) {
    setPlayerStore("stream", prev);
    setQueueStore("history", h => h.slice(1));
    player(prev.id);
  }
}

export function totalQueueDuration(list: TrackItem[]): string {
  const total = list.reduce((acc, item) => acc + parseDuration(item.duration), 0);
  return convertSStoHHMMSS(total);
}

export const [searchStore, setSearchStore, useSearchStore] = createStore({
  query: "",
  results: [] as YTItem[],
  isLoading: false,
  page: 1,
  suggestions: { data: [] as string[], index: -1, controller: new AbortController() },
});

export const [listStore, setListStore, useListStore] = createStore({
  isLoading: false,
  isSubscribed: false,
  isSortable: false,
  isReversed: false,
  isShared: false,
  showStreamsNumber: false,
  list: [] as TrackItem[],
  length: 0,
  reservedCollections: ["history", "favorites", "liked", "listenLater", "channels", "playlists", "cached", "discovery"],
  name: "",
  url: "",
  type: "collection" as "channels" | "playlists" | "collection" | "album",
  id: "",
  page: 1,
  author: "",
  img: "",
  hasContinuation: false,
  artistAlbums: [] as YTAlbumItem[],
  artistEps: [] as YTAlbumItem[],
});

export async function getList(id: string, type: string) {
  setListStore("isLoading", true);
  openSubView("list");
  try {
    const res = await fetch(`/api/ytmusic/${type}?id=${id}`);
    const data = await res.json();
    setListStore(data);
  } catch (e) {
    console.error("Failed to fetch list", e);
  } finally {
    setListStore("isLoading", false);
  }
}

export async function loadAll() {
  const { id, type } = listStore;
  if (!id || type !== "playlists") return;

  setListStore("isLoading", true);
  try {
    const res = await fetch(`/api/ytmusic/playlist?id=${id}&all=true`);
    const data = await res.json();
    setListStore("list", data.list);
    setListStore("hasContinuation", false);
  } catch (e) {
    console.error("Failed to load all items", e);
  } finally {
    setListStore("isLoading", false);
  }
}

export async function getSearchResults(isForm?: boolean) {
  const { query, page } = searchStore;
  if (!query && !isForm) return;

  setSearchStore("isLoading", true);
  try {
    const filter = config.searchFilter || "all";
    const res = await fetch(`/api/ytmusic/search?q=${encodeURIComponent(query)}&f=${filter}&page=${page}`);
    const data = await res.json();
    
    if (page === 1) {
      setSearchStore("results", data);
    } else {
      setSearchStore("results", prev => [...prev, ...data]);
    }
  } catch (e) {
    console.error("Failed to fetch search results", e);
  } finally {
    setSearchStore("isLoading", false);
  }
}

export async function getSearchSuggestions(query: string) {
  if (!query) return;
  
  // Abort previous request
  searchStore.suggestions.controller.abort();
  const controller = new AbortController();
  setSearchStore("suggestions", "controller", controller);

  try {
    const res = await fetch(`/api/ytmusic/search-suggestions?q=${encodeURIComponent(query)}&music=true`, {
      signal: controller.signal
    });
    const data = await res.json();
    setSearchStore("suggestions", "data", data);
  } catch (e: any) {
    if (e.name !== "AbortError") {
      console.error("Failed to fetch suggestions", e);
    }
  }
}

export function clearSuggestions() {
  setSearchStore("suggestions", { data: [], index: -1, controller: searchStore.suggestions.controller });
}

export function resetList() {
  setListStore({
    list: [],
    name: "",
    id: "",
    img: "",
    type: "collection",
    artistAlbums: [],
    artistEps: []
  } as any);
}

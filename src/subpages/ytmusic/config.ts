import { useSyncExternalStore } from "react";

export type PanelRatio = "1:1" | "2:3" | "3:4" | "1:2" | "2:5";
export type CachingMode = "auto" | "on-demand" | "off";
export type PlayerBackground = "none" | "frost" | "frost-motion" | "blur" | "blur-motion";

const CACHING_MODES: CachingMode[] = ["auto", "on-demand", "off"];
const PLAYER_BACKGROUNDS: PlayerBackground[] = ["none", "frost", "frost-motion", "blur", "blur-motion"];
export const VOLUME_PRESETS = [0, 0.2, 0.5, 1, 2, 3, 5, 10, 15, 25, 50, 75, 100];

export interface LibrarySections {
  subfeed: boolean;
  featured: boolean;
  listenLater: boolean;
  history: boolean;
  favorites: boolean;
  liked: boolean;
  cached: boolean;
  discovery: boolean;
}

export type LibrarySectionKey = keyof LibrarySections;

const defaultLibrarySections: LibrarySections = {
  subfeed: true,
  featured: true,
  listenLater: true,
  history: true,
  favorites: true,
  liked: true,
  cached: true,
  discovery: true,
};

export let config = {
  language: "en",
  shareAction: "play" as "play" | "watch",
  quality: "medium" as "low" | "medium" | "high" | "worst",
  stableVolume: false,
  watchMode: "",
  discover: true,
  history: true,
  searchBarLinkCapture: true,
  searchSuggestions: true,
  saveRecentSearches: true,
  loadImage: true,
  playerBackground: "none" as PlayerBackground,
  panelRatio: "2:5" as PanelRatio,
  roundness: "0.4rem",
  theme: "auto" as "auto" | "light" | "dark",
  persistentShuffle: false,
  durationFilter: "",
  similarContent: false,
  contextualFill: false,
  authorGrouping: false,
  searchFilter: "all",
  volume: "100",
  dbsync: "",
  sortBy: "modified" as "modified" | "name" | "artist" | "duration",
  sortOrder: "desc" as "asc" | "desc",
  cachingMode: "auto" as CachingMode,
  librarySections: { ...defaultLibrarySections },
  sponsorblock: false,
  hasCompletedBoot: false,
  hasCompletedSetup: false,
  backupProxy: "auto" as "auto" | "omada" | "schenkel" | "kemonomimi" | "cobalt" | "custom",
  customProxyUrl: "",
};

type AppConfig = typeof config;

// Load from local storage
const lsKey = "ytmusic_config";
try {
  const saved = localStorage.getItem(lsKey);
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.assign(config, parsed);
  }
} catch (e) {
  console.error("Failed to load config", e);
}

const configListeners = new Set<() => void>();
let configVersion = 0;

function notifyConfig() {
  configVersion++;
  configListeners.forEach((l) => l());
}

export function useConfig() {
  useSyncExternalStore(
    (onStoreChange) => {
      configListeners.add(onStoreChange);
      return () => configListeners.delete(onStoreChange);
    },
    () => configVersion,
  );
  return config;
}

export function setConfig<K extends keyof AppConfig>(key: K, val: AppConfig[K]) {
  (config as any)[key] = val;
  localStorage.setItem(lsKey, JSON.stringify(config));
  notifyConfig();
}

export function librarySections(): LibrarySections {
  return config.librarySections;
}

export function useLibrarySections(): LibrarySections {
  useConfig();
  return config.librarySections;
}

export function setLibrarySection(key: LibrarySectionKey, val: boolean) {
  const updated = {
    ...config.librarySections,
    [key]: val,
  };
  setConfig("librarySections", updated);
}

export function cachingMode(): CachingMode {
  return config.cachingMode;
}

export function useCachingMode(): CachingMode {
  useConfig();
  return config.cachingMode;
}

export function setCachingMode(mode: CachingMode) {
  if (!CACHING_MODES.includes(mode)) return;
  setConfig("cachingMode", mode);
}

export function playerBackground(): PlayerBackground {
  return config.playerBackground;
}

export function usePlayerBackground(): PlayerBackground {
  useConfig();
  return config.playerBackground;
}

export function setPlayerBackground(background: PlayerBackground) {
  if (!PLAYER_BACKGROUNDS.includes(background)) return;
  setConfig("playerBackground", background);
}

export let drawer = {
  recentSearches: [] as string[],
  discovery: [] as any[],
  lastMainFeature: "search" as "search" | "library",
  lastList: null as { id: string; type: string; shared?: boolean } | null,
};

const drawerKey = "ytmusic_drawer";
try {
  const saved = localStorage.getItem(drawerKey);
  if (saved) {
    Object.assign(drawer, JSON.parse(saved));
  }
} catch (e) {}

export function setDrawer<K extends keyof typeof drawer>(key: K, val: (typeof drawer)[K]) {
  (drawer as any)[key] = val;
  localStorage.setItem(drawerKey, JSON.stringify(drawer));
}

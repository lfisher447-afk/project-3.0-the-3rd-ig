import { useSyncExternalStore } from "react";
import { lsGetJSON, lsSetJSON } from "@utils";

export type PanelRatio = "1:1" | "2:3" | "3:4" | "1:2" | "2:5";

/**
 * auto: plays are cached to OPFS as they are played.
 * on-demand: audio is only cached when the user adds a track to the Cached collection.
 * off: OPFS is unused, the Cached collection is hidden and any cache is cleared.
 */
export type CachingMode = "auto" | "on-demand" | "off";

const CACHING_MODES: CachingMode[] = ["auto", "on-demand", "off"];

/**
 * Artwork background of the music player.
 * frost / frost-motion: artwork behind a pane that blurs and veils it.
 * blur / blur-motion: artwork behind a pane that only blurs.
 * The -motion variants pan the artwork with the playback progress.
 */
export type PlayerBackground =
  | "none"
  | "frost"
  | "frost-motion"
  | "blur"
  | "blur-motion";

const PLAYER_BACKGROUNDS: PlayerBackground[] = [
  "none",
  "frost",
  "frost-motion",
  "blur",
  "blur-motion",
];

/** Selectable player volume levels, in percent. */
export const VOLUME_PRESETS = [
  0, 0.2, 0.5, 1, 2, 3, 5, 10, 15, 25, 50, 75, 100,
];

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
  language: "",
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

const savedStore = lsGetJSON<Record<string, unknown> | null>("config", null);
if (savedStore) {
  (Object.keys(config) as (keyof AppConfig)[]).forEach((key) => {
    if (savedStore[key] !== undefined) {
      if (
        key === "librarySections" &&
        typeof savedStore[key] === "object" &&
        savedStore[key] !== null
      ) {
        const sections = savedStore[key] as Record<string, unknown>;
        delete sections.frequentlyPlayed;
        delete sections.gallery;
        config.librarySections = {
          ...defaultLibrarySections,
          ...(sections as Partial<LibrarySections>),
        };
      } else if (key !== ("cacheLimit" as keyof AppConfig)) {
        (config as Record<keyof AppConfig, unknown>)[key] = savedStore[key];
      }
    }
  });
}

// Guard against hand-edited or stale values before they can drive cache writes.
if (!CACHING_MODES.includes(config.cachingMode)) config.cachingMode = "auto";
if (!PLAYER_BACKGROUNDS.includes(config.playerBackground))
  config.playerBackground = "none";
if (config.shareAction !== "play" && config.shareAction !== "watch")
  config.shareAction = "play";

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

export function setConfig<K extends keyof AppConfig>(
  key: K,
  val: AppConfig[K],
) {
  config[key] = val;
  lsSetJSON("config", config);
  notifyConfig();
}

/* Library sections */
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
  config.librarySections = updated;
  setConfig("librarySections", updated);
}

/* Audio caching */
export function cachingMode(): CachingMode {
  return config.cachingMode;
}

export function useCachingMode(): CachingMode {
  useConfig();
  return config.cachingMode;
}

export function setCachingModeSignal(mode: CachingMode) {
  if (!CACHING_MODES.includes(mode)) return;
  config.cachingMode = mode;
  setConfig("cachingMode", mode);
}

/* Player artwork background */
export function playerBackground(): PlayerBackground {
  return config.playerBackground;
}

export function usePlayerBackground(): PlayerBackground {
  useConfig();
  return config.playerBackground;
}

export function setPlayerBackground(background: PlayerBackground) {
  if (!PLAYER_BACKGROUNDS.includes(background)) return;
  config.playerBackground = background;
  setConfig("playerBackground", background);
}

/* Transitory local saves thats not supposed to be transferrable */
export let drawer = {
  recentSearches: [] as string[],
  discovery: [] as (YTItem & { frequency: number })[],
  lastMainFeature: "search" as "search" | "library",
  lastList: null as { id: string; type: string; shared?: boolean } | null,
};
const savedDrawer = lsGetJSON<Record<string, unknown> | null>("drawer", null);
if (savedDrawer) {
  let hadLegacyPlays = false;
  if ("libraryPlays" in savedDrawer) {
    delete savedDrawer.libraryPlays;
    hadLegacyPlays = true;
  }
  (Object.keys(drawer) as (keyof AppDrawer)[]).forEach((key) => {
    if (savedDrawer[key] !== undefined) {
      if (
        key === "lastMainFeature" &&
        savedDrawer[key] !== "search" &&
        savedDrawer[key] !== "library"
      )
        return;
      (drawer as Record<keyof AppDrawer, unknown>)[key] = savedDrawer[key];
    }
  });
  if (hadLegacyPlays) {
    lsSetJSON("drawer", drawer);
  }
}

type AppDrawer = typeof drawer;

export function setDrawer<K extends keyof AppDrawer>(
  key: K,
  val: AppDrawer[K],
) {
  drawer[key] = val;
  lsSetJSON("drawer", drawer);
}

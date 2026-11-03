import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  useCallback,
} from "react";
import {
  updateLang,
  useAppStore,
  useNavStore,
  playerStore,
  playNext,
  playPrev,
} from "./store";
import NavBar from "./components/NavBar";
import MiniPlayer from "./components/MiniPlayer";
import ActionsMenu from "./components/ActionsMenu";
import SnackBar from "./components/SnackBar";
import BootOS from "./components/BootOS";
import { useConfig } from "./config";

interface YtMusicMainProps {
  className?: string;
}

export const YtMusicMain: React.FC<YtMusicMainProps> = () => {
  const config = useConfig();
  const [showBootOS, setShowBootOS] = useState(() => !config.hasCompletedBoot);
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(orientation: portrait)").matches
      : false
  );

  const mainRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Targeted store selectors to prevent unnecessary re-renders
  const actionsMenu = useAppStore((state) => state.actionsMenu);
  const activeFeature = useNavStore((state) => state.active);
  const isPlayerOpen = useNavStore((state) => state.player.state);

  // Dynamic orientation & language sync
  useEffect(() => {
    updateLang();

    const mql = window.matchMedia("(orientation: portrait)");
    const updateOrientation = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mql.addEventListener("change", updateOrientation);

    // Global keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (playerStore.audio.paused) {
          playerStore.audio.play().catch(() => {});
        } else {
          playerStore.audio.pause();
        }
      } else if (e.key === "ArrowLeft" && e.shiftKey) {
        e.preventDefault();
        playPrev();
      } else if (e.key === "ArrowRight" && e.shiftKey) {
        e.preventDefault();
        playNext();
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        playerStore.audio.muted = !playerStore.audio.muted;
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      mql.removeEventListener("change", updateOrientation);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Component references from navStore
  const navStore = useNavStore();
  const Queue = navStore.queue.component;
  const Search = navStore.search.component;
  const Library = navStore.library.component;
  const List = navStore.list.component;
  const Settings = navStore.settings.component;
  const Player = navStore.player.component;

  const renderActiveFeature = useCallback(() => {
    switch (activeFeature) {
      case "queue":
        return <Queue />;
      case "list":
        return <List />;
      case "settings":
        return <Settings />;
      case "library":
        return <Library />;
      case "search":
      default:
        return <Search />;
    }
  }, [activeFeature, Queue, List, Settings, Library, Search]);

  return (
    <div className="relative h-[calc(100vh-64px)] w-full bg-black overflow-hidden font-sans text-zinc-100 select-none">
      {/* Ambient background glow for high-end aesthetic */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <main
        ref={mainRef}
        className="relative flex h-full w-full z-10 overflow-hidden"
      >
        {/* Left Panel - Full Player Engine */}
        <div
          ref={leftPanelRef}
          className={`w-full lg:w-[450px] flex-shrink-0 border-r border-zinc-900/80 bg-zinc-950/90 backdrop-blur-xl overflow-hidden transition-all duration-500 ease-in-out absolute lg:relative z-30 h-full shadow-2xl ${
            isPlayerOpen
              ? "translate-x-0 opacity-100"
              : "-translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100"
          }`}
        >
          <Suspense
            fallback={
              <div className="h-full flex flex-col items-center justify-center p-10 space-y-4">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm tracking-wide animate-pulse">
                  Loading Player Engine...
                </p>
              </div>
            }
          >
            <Player />
          </Suspense>
        </div>

        {/* Right Panel - Dynamic Features & Content Area */}
        <div
          ref={rightPanelRef}
          className="w-full flex-grow bg-zinc-950/60 backdrop-blur-md overflow-hidden flex flex-col relative z-20"
        >
          <div className="flex-grow overflow-y-auto overflow-x-hidden custom-scrollbar">
            <Suspense
              fallback={
                <div className="h-full flex flex-col items-center justify-center p-10 space-y-4">
                  <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-zinc-500 text-sm tracking-wide animate-pulse text-center">
                    Calibrating Feature...
                  </p>
                </div>
              }
            >
              {renderActiveFeature()}
            </Suspense>
          </div>

          {/* Bottom Dock / Playback Controls */}
          <div className="flex-shrink-0 border-t border-zinc-900/80 bg-zinc-950/85 backdrop-blur-xl shadow-lg">
            <MiniPlayer />
            <NavBar />
          </div>
        </div>
      </main>

      {/* Modals & Overlays */}
      {actionsMenu && (
        <Suspense fallback={null}>
          <ActionsMenu />
        </Suspense>
      )}

      <SnackBar />

      {showBootOS && <BootOS onComplete={() => setShowBootOS(false)} />}
    </div>
  );
};

export default YtMusicMain;

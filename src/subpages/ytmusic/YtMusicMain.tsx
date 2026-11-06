import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  lazy,
} from "react";
import {
  updateLang,
  setStore,
  useAppStore,
  useNavStore,
  setNavStore,
  usePlayerStore,
  playerStore,
  playNext,
  playPrev,
} from "./store";
import NavBar from "./components/NavBar";
import MiniPlayer from "./components/MiniPlayer";
import ActionsMenu from "./components/ActionsMenu";
import SnackBar from "./components/SnackBar";
import { useConfig } from "./config";

import { SlidersHorizontal } from "lucide-react";

export const YtMusicMain: React.FC<any> = ({ onOpenDsp }) => {
  const config = useConfig();
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(orientation: portrait)").matches
      : false,
  );

  const mainRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const store = useAppStore();
  const navStore = useNavStore();
  const playerState = usePlayerStore();

  useEffect(() => {
    updateLang();
    
    const mql = window.matchMedia("(orientation: portrait)");
    const updateOrientation = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    mql.addEventListener("change", updateOrientation);

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).isContentEditable
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
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      mql.removeEventListener("change", updateOrientation);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const Queue = navStore.queue.component;
  const Search = navStore.search.component;
  const Library = navStore.library.component;
  const List = navStore.list.component;
  const Settings = navStore.settings.component;
  const Player = navStore.player.component;

  const renderActiveFeature = () => {
    switch (navStore.active) {
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
  };

  return (
    <div className="relative h-[calc(100vh-64px)] bg-black overflow-hidden font-sans text-zinc-100 flex flex-col">
      {/* Top Bar with DSP quick trigger */}
      <div className="h-11 px-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-wide">YouTube Music Pro Deck</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-cyan-300">
            Lossless Stream Engine
          </span>
        </div>
        {onOpenDsp && (
          <button
            type="button"
            onClick={onOpenDsp}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 text-[11px] font-mono font-bold transition cursor-pointer"
            title="Open Audio Equalizer & Studio DSP"
          >
            <SlidersHorizontal size={13} />
            <span>Studio EQ</span>
          </button>
        )}
      </div>

      <main
        ref={mainRef}
        className="flex flex-1 w-full overflow-hidden transition-transform duration-500"
      >
        {/* Left Panel - Player (Hidden on mobile unless active) */}
        <div 
            className={`w-full lg:w-[450px] flex-shrink-0 border-r border-zinc-900 bg-zinc-950 overflow-hidden transition-all duration-500 absolute lg:relative z-30 h-full ${navStore.player.state ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} 
            ref={leftPanelRef}
        >
          <Suspense fallback={<div className="p-10 text-zinc-500 animate-pulse text-xs font-mono">Loading Player Engine...</div>}>
            <Player />
          </Suspense>
        </div>
        
        {/* Right Panel - Features */}
        <div className="w-full flex-grow bg-zinc-950 overflow-hidden flex flex-col relative z-20" ref={rightPanelRef}>
          <div className="flex-grow overflow-hidden">
            <Suspense fallback={<div className="p-10 text-zinc-500 animate-pulse text-center text-xs font-mono">Calibrating Feature...</div>}>
              {renderActiveFeature()}
            </Suspense>
          </div>
          
          <div className="flex-shrink-0 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
            <MiniPlayer />
            <NavBar />
          </div>
        </div>
      </main>

      {store.actionsMenu && (
        <Suspense fallback={null}>
          <ActionsMenu />
        </Suspense>
      )}
      
      <SnackBar />
    </div>
  );
};

export default YtMusicMain;

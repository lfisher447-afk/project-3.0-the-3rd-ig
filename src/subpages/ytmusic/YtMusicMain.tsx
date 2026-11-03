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
import BootOS from "./components/BootOS";
import { useConfig } from "./config";

export const YtMusicMain: React.FC<any> = () => {
  const config = useConfig();
  const [showBootOS, setShowBootOS] = useState(() => !config.hasCompletedBoot);
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
    <div className="relative h-[calc(100vh-64px)] bg-black overflow-hidden font-sans text-zinc-100">
      <main
        ref={mainRef}
        className="flex h-full w-full transition-transform duration-500"
      >
        {/* Left Panel - Player (Hidden on mobile unless active) */}
        <div 
            className={`w-full lg:w-[450px] flex-shrink-0 border-r border-zinc-900 bg-zinc-950 overflow-hidden transition-all duration-500 absolute lg:relative z-30 h-full ${navStore.player.state ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} 
            ref={leftPanelRef}
        >
          <Suspense fallback={<div className="p-10 text-zinc-500 animate-pulse">Loading Player Engine...</div>}>
            <Player />
          </Suspense>
        </div>
        
        {/* Right Panel - Features */}
        <div className="w-full flex-grow bg-zinc-950 overflow-hidden flex flex-col relative z-20" ref={rightPanelRef}>
          <div className="flex-grow overflow-hidden">
            <Suspense fallback={<div className="p-10 text-zinc-500 animate-pulse text-center">Calibrating Feature...</div>}>
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

      {showBootOS && (
        <BootOS onComplete={() => setShowBootOS(false)} />
      )}
    </div>
  );
};

export default YtMusicMain;

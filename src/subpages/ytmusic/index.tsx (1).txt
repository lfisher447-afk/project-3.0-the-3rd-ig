import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  lazy,
} from "react";
import { createRoot } from "react-dom/client";
import { syncLibrary } from "@modules/library";
import { themer } from "@modules/theme";
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
  stepVolume,
  toggleMute,
  params,
} from "@stores";
import { handleNavClick } from "@components/HeaderNav";
import NavBar from "@components/NavBar";
import BootOS from "@components/BootOS";
import { config, useConfig } from "@config";
import { cn } from "@components/common";
import "./styles/global.css";

const MiniPlayer = lazy(() => import("@components/MiniPlayer"));
const ActionsMenu = lazy(() => import("@components/ActionsMenu"));
const SnackBar = lazy(() => import("@components/SnackBar"));

export default function App() {
  const currentConfig = useConfig();
  const [showBootOS, setShowBootOS] = useState(
    () => !currentConfig.hasCompletedBoot || !currentConfig.hasCompletedSetup
  );
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
    if ("launchQueue" in window) {
      (window as any).launchQueue.setConsumer(() => {});
    }

    const mql = window.matchMedia("(orientation: portrait)");
    const updateOrientation = (e: MediaQueryListEvent) =>
      setIsPortrait(e.matches);
    mql.addEventListener("change", updateOrientation);

    let scrollTimeout: number;
    const checkScrollCompletion = () => {
      if (!mql.matches || !mainRef.current) return;
      const scrollLeft = mainRef.current.scrollLeft;
      const maxScroll =
        mainRef.current.scrollWidth - mainRef.current.clientWidth;

      if (maxScroll > 0 && scrollLeft >= maxScroll - 5) {
        if (navStore.player.state) {
          setNavStore("player", "state", false);
        }
      } else if (scrollLeft <= 5) {
        if (!navStore.player.state) {
          setNavStore("player", "state", true);
        }
      }
    };

    const onScroll = () => {
      if (!mql.matches || !mainRef.current) return;
      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(checkScrollCompletion, 60);
    };

    const mainEl = mainRef.current;
    mainEl?.addEventListener("scroll", onScroll, { passive: true });
    mainEl?.addEventListener("scrollend", checkScrollCompletion, {
      passive: true,
    });

    const focusSearchInput = (attempt = 0) => {
      const searchInput =
        document.querySelector<HTMLInputElement>(".superInput");
      if (searchInput) searchInput.focus();
      else if (attempt < 10)
        requestAnimationFrame(() => focusSearchInput(attempt + 1));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable ||
        document.querySelector("dialog[open]")
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
      } else if (e.key === "ArrowLeft" && !e.shiftKey) {
        e.preventDefault();
        playerStore.audio.currentTime = Math.max(
          0,
          playerStore.audio.currentTime - 5,
        );
      } else if (e.key === "ArrowRight" && !e.shiftKey) {
        e.preventDefault();
        playerStore.audio.currentTime = Math.min(
          playerStore.fullDuration || Infinity,
          playerStore.audio.currentTime + 5,
        );
      } else if (
        (e.shiftKey && e.key === "ArrowRight") ||
        (e.shiftKey && (e.key === "N" || e.key === "n")) ||
        e.key === "]"
      ) {
        e.preventDefault();
        playNext();
      } else if (
        (e.shiftKey && e.key === "ArrowLeft") ||
        (e.shiftKey && (e.key === "P" || e.key === "p")) ||
        e.key === "["
      ) {
        e.preventDefault();
        playPrev();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        stepVolume(1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        stepVolume(-1);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "1") {
        e.preventDefault();
        handleNavClick("queue");
      } else if (e.key === "2") {
        e.preventDefault();
        handleNavClick("search");
      } else if (e.key === "3") {
        e.preventDefault();
        handleNavClick("library");
      } else if (e.key === "/") {
        e.preventDefault();
        handleNavClick("search");
        focusSearchInput();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    import("@modules/start.ts").then((mod) => mod.default()).then(() => {
      if (params.has("s")) {
        setNavStore("player", "state", true);
        leftPanelRef.current?.scrollIntoView({ behavior: "instant" });
      } else {
        setNavStore("player", "state", false);
        rightPanelRef.current?.scrollIntoView({ behavior: "instant" });
      }
      setStore("syncState", "synced");
      syncLibrary("init");
    });

    return () => {
      mql.removeEventListener("change", updateOrientation);
      window.clearTimeout(scrollTimeout);
      mainEl?.removeEventListener("scroll", onScroll);
      mainEl?.removeEventListener("scrollend", checkScrollCompletion);
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
    <>
      <main
        ref={mainRef}
        className={cn(isPortrait && !navStore.player.state && "player-closed")}
      >
        <div className="left-panel" ref={leftPanelRef}>
          <Suspense fallback={null}>
            <Player />
          </Suspense>
        </div>
        <div className="right-panel" ref={rightPanelRef}>
          <div className="right-panel-content">
            <Suspense fallback={null}>{renderActiveFeature()}</Suspense>
          </div>

          {isPortrait && (
            <>
              {!navStore.player.state &&
                (playerState.playbackState !== "none" ||
                  Boolean(playerState.stream.id)) && (
                  <Suspense fallback={null}>
                    <MiniPlayer />
                  </Suspense>
                )}
              {navStore.active !== "list" && navStore.active !== "settings" && (
                <NavBar />
              )}
            </>
          )}
        </div>
      </main>

      {store.actionsMenu?.id && (
        <Suspense fallback={null}>
          <ActionsMenu />
        </Suspense>
      )}
      {store.snackbar && (
        <Suspense fallback={null}>
          <SnackBar />
        </Suspense>
      )}
      {showBootOS && (
        <BootOS onComplete={() => setShowBootOS(false)} />
      )}
    </>
  );
}

// Bootstrap application
updateLang().then(() => {
  themer();
  const rootEl = document.getElementById("root") || document.body;
  const root = createRoot(rootEl);
  root.render(<App />);
});

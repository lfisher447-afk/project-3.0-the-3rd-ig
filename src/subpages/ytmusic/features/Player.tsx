import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  Suspense,
  lazy,
} from "react";
import "../Player.css";
import { MediaDetails } from "../components/MediaPartials";
import { useConfig, usePlayerBackground, type PlayerBackground } from "../config";
import { cssVar } from "../modules/theme";
import {
  params,
  usePlayerStore,
  setNavStore,
  setStore,
  t,
  updateParam,
} from "../store";

const Lyrics = lazy(() => import("../components/Lyrics"));
const Video = lazy(() => import("../components/Video"));
const Controls = lazy(() => import("../components/Controls"));
const MediaArtwork = lazy(() => import("../components/MediaArtwork"));

export default function PlayerFeature() {
  const playerSection = useRef<HTMLDivElement>(null);
  const [showLyrics, setShowLyrics] = useState(false);

  const config = useConfig();
  const playerStore = usePlayerStore();
  const currentBackgroundSetting = usePlayerBackground();

  const background = useMemo<PlayerBackground>(
    () => (playerStore.isMusic ? currentBackgroundSetting : "none"),
    [playerStore.isMusic, currentBackgroundSetting],
  );

  const showBg = background !== "none";

  function updateStaticBackgroundPosition() {
    if (!playerSection.current) return;
    const { offsetHeight, offsetWidth } = playerSection.current;
    if (offsetHeight === 0) {
      requestAnimationFrame(updateStaticBackgroundPosition);
      return;
    }
    const diff = offsetHeight - offsetWidth;
    const shift = Math.floor(diff / 2);
    cssVar("--player-bp", `-${shift}px 0`);
  }

  useEffect(() => {
    if (playerSection.current) {
      setNavStore("player", "ref", playerSection.current);
    }
    const updateStatic = () => {
      if (background !== "none" && !background.endsWith("-motion")) {
        updateStaticBackgroundPosition();
      }
    };
    updateStatic();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && playerSection.current) {
      ro = new ResizeObserver(updateStatic);
      ro.observe(playerSection.current);
    }
    return () => ro?.disconnect();
  }, [background]);

  useEffect(() => {
    if (playerStore.saveProgress && playerStore.stream.id) {
      updateParam("s", playerStore.stream.id);
    } else if (!playerStore.saveProgress && params.has("s")) {
      updateParam("s");
    }
  }, [playerStore.saveProgress, playerStore.stream.id]);

  useEffect(() => {
    if (background === "none") return;
    cssVar("--player-bg", `url(${playerStore.mediaArtwork})`);
    if (!background.endsWith("-motion")) {
      updateStaticBackgroundPosition();
    } else {
      cssVar("--player-bp", "0 0");
    }
  }, [background, playerStore.mediaArtwork]);

  function getContext() {
    const { id } = playerStore.context;
    return id;
  }

  return (
    <section
      id="playerSection"
      className={`bg-${background} relative h-full flex flex-col overflow-hidden bg-zinc-950`}
      ref={playerSection}
    >
      {showBg && (
        <>
          <div className="absolute inset-0 bg-image opacity-30 blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-pane bg-black/40 pointer-events-none" />
        </>
      )}

      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest truncate max-w-[80%]">
          {playerStore.context.src &&
            (playerStore.context.src === "queue"
              ? getContext()
              : t("player_from" as any, getContext()) || `Playing from ${getContext()}`)}
        </div>

        <i
          aria-label={t("player_more" as any) || "More"}
          className="ri-more-2-fill text-xl text-white cursor-pointer hover:text-[#48e4ff] transition-colors"
          onClick={() => setStore("actionsMenu", playerStore.stream)}
        ></i>
      </header>

      <article className="relative z-10 flex-grow flex flex-col items-center justify-center px-8 pb-12">
        {playerStore.isWatching && !playerStore.isMusic && (
          <Suspense fallback={null}>
            <Video />
          </Suspense>
        )}

        {showLyrics && (
          <Suspense fallback={<div className="text-zinc-500">Loading Lyrics...</div>}>
            <Lyrics onClose={() => setShowLyrics(false)} />
          </Suspense>
        )}

        {(!playerStore.isWatching || playerStore.isMusic) &&
          config.loadImage &&
          !showLyrics && (
            <Suspense fallback={<div className="w-full aspect-square bg-zinc-900 rounded-2xl animate-pulse" />}>
              <MediaArtwork />
            </Suspense>
          )}

        <div className="w-full max-w-[400px] mt-8 text-center">
          <MediaDetails title={playerStore.stream.title || "No Track Playing"} author={playerStore.stream.author || "Unknown Artist"} />
        </div>

        {(!playerStore.isWatching || playerStore.isMusic) && (
          <Suspense fallback={null}>
            <Controls showLyrics={showLyrics} setShowLyrics={setShowLyrics} />
          </Suspense>
        )}
      </article>
    </section>
  );
}

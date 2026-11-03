import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  Suspense,
  lazy,
} from "react";
import "./Player.css";
import { MediaDetails } from "@components/MediaPartials";
import { useConfig, usePlayerBackground, type PlayerBackground } from "@config";
import { cssVar } from "@modules/theme";
import {
  params,
  usePlayerStore,
  setNavStore,
  setStore,
  t,
  updateParam,
} from "@stores";

const MediaArtwork = lazy(
  () => import("../../components/MediaPartials/MediaArtwork"),
);
const Lyrics = lazy(() => import("./Lyrics"));
const Video = lazy(() => import("./Video"));
const Controls = lazy(() => import("./Controls"));

export default function PlayerFeature() {
  const playerSection = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
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
    return () => {
      if (!playerStore.saveProgress) {
        updateParam("s");
      }
    };
  }, []);

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
      className={`bg-${background}`}
      ref={playerSection}
    >
      {showBg && (
        <>
          <div className="bg-image" />
          <div className="bg-pane" />
        </>
      )}

      <header className="topShelf" ref={headerRef}>
        <p>
          {playerStore.context.src &&
            (playerStore.context.src === "queue"
              ? getContext()
              : t("player_from", getContext()))}
        </p>

        <i
          aria-label={t("player_more")}
          className="ri-more-2-fill"
          id="moreBtn"
          onClick={() => setStore("actionsMenu", playerStore.stream)}
        ></i>
      </header>

      <article>
        {playerStore.isWatching && !playerStore.isMusic && (
          <Suspense fallback={null}>
            <Video />
          </Suspense>
        )}

        {showLyrics && (
          <Suspense fallback={null}>
            <Lyrics onClose={() => setShowLyrics(false)} />
          </Suspense>
        )}

        {(!playerStore.isWatching || playerStore.isMusic) &&
          config.loadImage &&
          !showLyrics && (
            <Suspense fallback={null}>
              <MediaArtwork />
            </Suspense>
          )}

        <MediaDetails />

        {(!playerStore.isWatching || playerStore.isMusic) && (
          <Suspense fallback={null}>
            <Controls showLyrics={showLyrics} setShowLyrics={setShowLyrics} />
          </Suspense>
        )}
      </article>
    </section>
  );
}

import React, { useEffect, useRef } from "react";
import {
  LikeButton,
  PlayButton,
  PlayNextButton,
} from "@components/MediaPartials";
import {
  usePlayerStore,
  playPrev,
  useQueueStore,
  setPlayerStore,
  setVolume,
  updateParam,
  t,
} from "@stores";
import { convertSStoHHMMSS } from "@utils";
import { VOLUME_PRESETS } from "@config";
import { cn } from "@components/common";

export default function Controls(props: {
  showLyrics: boolean;
  setShowLyrics: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const playerStore = usePlayerStore();
  const queueStore = useQueueStore();
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    const stopProp = (e: TouchEvent) => e.stopPropagation();
    slider.addEventListener("touchstart", stopProp);
    slider.addEventListener("touchmove", stopProp);
    slider.addEventListener("touchend", stopProp);
    return () => {
      slider.removeEventListener("touchstart", stopProp);
      slider.removeEventListener("touchmove", stopProp);
      slider.removeEventListener("touchend", stopProp);
    };
  }, []);

  function updatePositionState() {
    if ("mediaSession" in navigator)
      import("@modules/mediaSession").then((m) =>
        m.updateMediaSessionPosition(),
      );
  }

  return (
    <>
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-neutral-900/80 text-neutral-300 border border-neutral-800/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {playerStore.isMusic ? "YT MUSIC · LOSSLESS OPUS" : "YT AUDIO · DUAL-SOURCE"}
        </span>
        <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
          48kHz · {playerStore.playbackRate.toFixed(2)}x
        </span>
      </div>

      <span className="slider">
        <input
          type="range"
          value={playerStore.currentTime}
          max={playerStore.fullDuration || 100}
          ref={sliderRef}
          onChange={(e) => {
            playerStore.audio.currentTime = parseInt(e.target.value);
          }}
        />
        <div>
          <p id="currentDuration">
            {convertSStoHHMMSS(playerStore.currentTime)}
          </p>
          <p id="fullDuration">
            {convertSStoHHMMSS(playerStore.fullDuration)}
          </p>
        </div>
      </span>

      <div className="mainShelf">
        {queueStore.history.length > 0 && (
          <button
            aria-label={t("player_play_previous")}
            className="ri-skip-back-fill"
            id="playPrevButton"
            onClick={playPrev}
          ></button>
        )}

        <button
          aria-label={t("player_seek_backward")}
          className="ri-replay-15-line"
          id="seekBwdButton"
          onClick={() => {
            playerStore.audio.currentTime -= 15;
          }}
        ></button>

        <PlayButton />

        <button
          aria-label={t("player_seek_forward")}
          className="ri-forward-15-line"
          id="seekFwdButton"
          onClick={() => {
            playerStore.audio.currentTime += 15;
          }}
        ></button>
        {queueStore.list.length > 0 && <PlayNextButton />}
      </div>

      <div className="bottomShelf">
        <select
          id="playSpeed"
          value={playerStore.playbackRate.toFixed(2)}
          onChange={(e) => {
            const ref = e.target;
            const speed = parseFloat(ref.value);
            playerStore.audio.playbackRate = speed;
            setPlayerStore("playbackRate", speed);
            updatePositionState();
            ref.blur();
          }}
        >
          <option value="0.25">0.25x</option>
          <option value="0.33">0.33x</option>
          <option value="0.50">0.50x</option>
          <option value="0.75">0.75x</option>
          <option value="0.87">0.87x</option>
          <option value="1.00">1.00x</option>
          <option value="1.25">1.25x</option>
          <option value="1.50">1.50x</option>
          <option value="1.75">1.75x</option>
          <option value="2.00">2.00x</option>
          <option value="2.50">2.50x</option>
          <option value="3.00">3.00x</option>
          <option value="3.50">3.50x</option>
          <option value="4.00">4.00x</option>
        </select>

        {playerStore.isMusic && (
          <i
            aria-label={t("player_lyrics")}
            className={cn("ri-music-2-line", props.showLyrics && "on")}
            onClick={() => props.setShowLyrics(!props.showLyrics)}
          ></i>
        )}

        <LikeButton />

        <i
          aria-label={t("player_loop")}
          className={cn("ri-repeat-fill", playerStore.loop && "on")}
          onClick={() => {
            const newLoopState = !playerStore.loop;
            playerStore.audio.loop = newLoopState;
            setPlayerStore("loop", newLoopState);
          }}
        ></i>
        {!playerStore.isMusic && (
          <>
            <i
              aria-label={t("actions_menu_watch_video")}
              className="ri-video-line"
              onClick={() => setPlayerStore("isWatching", true)}
            ></i>

            <i
              aria-label={t("player_save_progress")}
              className={`ri-signpost-${playerStore.saveProgress ? "fill" : "line"}`}
              onClick={() => {
                if (playerStore.saveProgress) {
                  setPlayerStore("saveProgress", false);
                  updateParam("t");
                  updateParam("s");
                } else {
                  setPlayerStore("saveProgress", true);
                  if (playerStore.stream.id)
                    updateParam("s", playerStore.stream.id);
                  updateParam("t", playerStore.currentTime.toString());
                }
              }}
            ></i>
          </>
        )}

        <select
          id="volumeChanger"
          value={playerStore.volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value));
            e.target.blur();
          }}
        >
          {VOLUME_PRESETS.map((preset) => (
            <option key={preset} value={preset / 100}>
              {preset}%
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

import React from "react";
import { usePlayerStore, t } from "@stores";

export default function PlayButton() {
  const playerStore = usePlayerStore();

  const icons: Record<string, string> = {
    playing: "ri-pause-circle-fill",
    none: "ri-stop-circle-fill",
    paused: "ri-play-circle-fill",
    loading: "ri-loader-3-line loading-spinner",
  };

  return (
    <button
      className={icons[playerStore.playbackState] || icons.paused}
      id="playButton"
      onClick={() => {
        const { stream, playbackState, audio } = playerStore;
        if (stream.id && playbackState === "playing") audio.pause();
        else audio.play();
      }}
      aria-label={t("player_play_button")}
    ></button>
  );
}

import React, { Suspense, lazy } from "react";
import { useConfig } from "@config";
import {
  LikeButton,
  MediaDetails,
  PlayButton,
  PlayNextButton,
} from "./MediaPartials";
import { usePlayerStore, setNavStore, useQueueStore } from "@stores";

const MediaArtwork = lazy(
  () => import("@components/MediaPartials/MediaArtwork"),
);

export default function MiniPlayer() {
  const config = useConfig();
  const playerStore = usePlayerStore();
  const queueStore = useQueueStore();

  const progress =
    playerStore.fullDuration > 0
      ? (playerStore.currentTime / playerStore.fullDuration).toFixed(3)
      : "0";

  return (
    <div
      className="miniplayer"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest("button")) {
          setNavStore("player", "state", true);
          requestAnimationFrame(() => {
            const leftPanel = document.querySelector(".left-panel");
            leftPanel?.scrollIntoView({ behavior: "smooth" });
          });
        }
      }}
    >
      <progress value={progress}></progress>
      {config.loadImage && (
        <Suspense fallback={null}>
          <MediaArtwork />
        </Suspense>
      )}
      <MediaDetails />
      <PlayButton />
      {queueStore.list.length > 0 ? <PlayNextButton /> : <LikeButton />}
    </div>
  );
}

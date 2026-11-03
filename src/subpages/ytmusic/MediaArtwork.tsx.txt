import React, { useRef } from "react";
import { setPlayerStore, usePlayerStore } from "@stores";
import { cn } from "@components/common";

export default function MediaArtwork() {
  const playerStore = usePlayerStore();
  const imgRef = useRef<HTMLImageElement>(null);

  function handler() {
    if (!imgRef.current) return;
    setPlayerStore(
      "mediaArtwork",
      imgRef.current.src
        .replace("maxres", "mq")
        .replace(".webp", ".jpg")
        .replace("vi_webp", "vi"),
    );
  }

  return (
    <img
      ref={imgRef}
      className={cn(Boolean(playerStore.isMusic) && "is-music")}
      src={playerStore.mediaArtwork || undefined}
      crossOrigin="anonymous"
      alt={"Media Artwork for " + playerStore.stream.title}
      onLoad={() => {
        if (imgRef.current?.naturalWidth === 120) handler();
      }}
      onError={() => {
        if (imgRef.current?.src.includes("max")) handler();
      }}
    />
  );
}

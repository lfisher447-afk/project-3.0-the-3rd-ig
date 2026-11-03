import React, { useRef } from "react";
import { setPlayerStore, usePlayerStore } from "../store";

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
    <div className="w-full max-w-[400px] aspect-square rounded-2xl shadow-2xl overflow-hidden bg-zinc-900 group relative">
        <img
          ref={imgRef}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
        {playerStore.playbackState === "loading" && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <i className="ri-loader-3-line animate-spin text-4xl text-[#48e4ff]"></i>
            </div>
        )}
    </div>
  );
}

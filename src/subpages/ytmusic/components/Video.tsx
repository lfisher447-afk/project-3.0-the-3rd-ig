import React, { useState, useEffect } from "react";
import { usePlayerStore, setPlayerStore } from "../store";
import { X, Film } from "lucide-react";

export default function Video() {
  const playerStore = usePlayerStore();
  const videoId = playerStore.stream?.id || (playerStore.stream as any)?.videoId;
  const [embedMode, setEmbedMode] = useState(true);

  if (!videoId) return null;

  const iframeSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1`;

  return (
    <div className="w-full max-w-[440px] aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group border border-zinc-800">
      <iframe
        key={videoId}
        src={iframeSrc}
        title={playerStore.stream?.title || "YouTube Music Video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full border-0"
      />

      <button 
        type="button"
        onClick={() => setPlayerStore("isWatching", false)}
        className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/80 hover:bg-black text-zinc-300 hover:text-white backdrop-blur-xs border border-zinc-700 opacity-0 group-hover:opacity-100 transition cursor-pointer"
        title="Close Video Frame"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

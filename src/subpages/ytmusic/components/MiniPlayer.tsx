import React from "react";
import { usePlayerStore, setNavStore, useQueueStore, playNext } from "../store";

export default function MiniPlayer() {
  const playerStore = usePlayerStore();
  const queueStore = useQueueStore();

  const progress =
    playerStore.fullDuration > 0
      ? (playerStore.currentTime / playerStore.fullDuration) * 100
      : 0;

  if (playerStore.playbackState === "none" && !playerStore.stream.id) return null;

  return (
    <div
      className="h-16 flex flex-col z-40 cursor-pointer hover:bg-white/5 transition-colors"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest("button") && !target.closest("i")) {
           setNavStore("player", "state", true);
        }
      }}
    >
      <div className="h-0.5 bg-zinc-800 w-full overflow-hidden">
        <div className="h-full bg-[#48e4ff]" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="flex items-center justify-between px-4 h-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
             <img src={playerStore.mediaArtwork} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{playerStore.stream.title}</h4>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest truncate">{playerStore.stream.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (playerStore.playbackState === "playing") {
                playerStore.audio.pause();
              } else {
                playerStore.audio.play();
              }
            }}
            className="w-10 h-10 flex items-center justify-center text-white hover:text-[#48e4ff] transition-colors"
          >
            <i className={`text-2xl ${playerStore.playbackState === "playing" ? "ri-pause-fill" : "ri-play-fill"}`}></i>
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            className="w-10 h-10 flex items-center justify-center text-white hover:text-[#48e4ff] transition-colors"
          >
            <i className="ri-skip-forward-fill text-2xl"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

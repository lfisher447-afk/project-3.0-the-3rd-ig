import React from "react";
import { Play, Pause, SkipForward, Music } from "lucide-react";
import { usePlayerStore, setNavStore, useQueueStore, playNext, setPlayerStore } from "../store";
import { audioEngine } from "../../../lib/audioEngine";

export default function MiniPlayer() {
  const playerStore = usePlayerStore();
  const queueStore = useQueueStore();

  const progress =
    playerStore.fullDuration > 0
      ? (playerStore.currentTime / playerStore.fullDuration) * 100
      : 0;

  if (playerStore.playbackState === "none" && !playerStore.stream?.id) return null;

  const isPlaying = playerStore.playbackState === "playing";

  return (
    <div
      className="h-16 flex flex-col z-40 cursor-pointer hover:bg-white/5 transition-colors border-t border-zinc-900/60"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest("button")) {
          setNavStore("player", "state", true);
        }
      }}
    >
      <div className="h-0.5 bg-zinc-800 w-full overflow-hidden">
        <div className="h-full bg-[#48e4ff]" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="flex items-center justify-between px-4 h-full">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-zinc-700/50">
            {playerStore.mediaArtwork ? (
              <img src={playerStore.mediaArtwork} alt="" className="w-full h-full object-cover" />
            ) : (
              <Music size={16} className="text-cyan-400" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{playerStore.stream?.title || "Unknown"}</h4>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest truncate">{playerStore.stream?.author || "YouTube Music"}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isPlaying) {
                audioEngine.pause();
                setPlayerStore("playbackState", "paused");
              } else {
                audioEngine.play().catch(() => {});
                setPlayerStore("playbackState", "playing");
              }
            }}
            className="w-9 h-9 rounded-full bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-400 flex items-center justify-center transition cursor-pointer"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playNext();
            }}
            className="w-9 h-9 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

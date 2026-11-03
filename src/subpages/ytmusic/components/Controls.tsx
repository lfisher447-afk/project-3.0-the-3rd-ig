import React, { useEffect, useRef } from "react";
import {
  usePlayerStore,
  playPrev,
  playNext,
  useQueueStore,
  setPlayerStore,
  t,
} from "../store";
import { convertSStoHHMMSS } from "../utils";

export default function Controls(props: {
  showLyrics: boolean;
  setShowLyrics: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const playerStore = usePlayerStore();
  const queueStore = useQueueStore();
  const sliderRef = useRef<HTMLInputElement>(null);

  const progress = playerStore.fullDuration > 0 ? (playerStore.currentTime / playerStore.fullDuration) * 100 : 0;

  return (
    <div className="w-full max-w-[400px] mt-8 space-y-6">
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max={playerStore.fullDuration || 100}
          value={playerStore.currentTime}
          onChange={(e) => {
            playerStore.audio.currentTime = parseInt(e.target.value);
          }}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#48e4ff]"
        />
        <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          <span>{convertSStoHHMMSS(playerStore.currentTime)}</span>
          <span>{convertSStoHHMMSS(playerStore.fullDuration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button 
          onClick={() => props.setShowLyrics(!props.showLyrics)}
          className={`text-xl transition-colors ${props.showLyrics ? "text-[#48e4ff]" : "text-zinc-500 hover:text-white"}`}
          title="Lyrics"
        >
          <i className="ri-music-2-line"></i>
        </button>

        <div className="flex items-center gap-8">
          <button 
            onClick={playPrev}
            className="text-2xl text-white hover:text-[#48e4ff] transition-colors"
          >
            <i className="ri-skip-back-fill"></i>
          </button>

          <button 
            onClick={() => {
              if (playerStore.playbackState === "playing") {
                playerStore.audio.pause();
              } else {
                playerStore.audio.play();
              }
            }}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            <i className={`text-4xl ${playerStore.playbackState === "playing" ? "ri-pause-fill" : "ri-play-fill"}`}></i>
          </button>

          <button 
            onClick={playNext}
            className="text-2xl text-white hover:text-[#48e4ff] transition-colors"
          >
            <i className="ri-skip-forward-fill"></i>
          </button>
        </div>

        <button 
          onClick={() => {
            const next = !playerStore.loop;
            playerStore.audio.loop = next;
            setPlayerStore("loop", next);
          }}
          className={`text-xl transition-colors ${playerStore.loop ? "text-[#48e4ff]" : "text-zinc-500 hover:text-white"}`}
          title="Loop"
        >
          <i className="ri-repeat-line"></i>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
        <i className="ri-volume-up-line text-zinc-500"></i>
        <input 
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={playerStore.volume}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            playerStore.audio.volume = val;
            setPlayerStore("volume", val);
          }}
          className="flex-grow h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>
    </div>
  );
}

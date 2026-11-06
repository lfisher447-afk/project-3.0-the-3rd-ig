import React, { useRef } from "react";
import {
  usePlayerStore,
  playPrev,
  playNext,
  setPlayerStore,
} from "../store";
import { convertSStoHHMMSS } from "../utils";
import { audioEngine } from "../../../lib/audioEngine";
import {
  Music2,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Volume2,
} from "lucide-react";

export default function Controls(props: {
  showLyrics: boolean;
  setShowLyrics: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const playerStore = usePlayerStore();
  const isPlaying = playerStore.playbackState === "playing";

  return (
    <div className="w-full max-w-[400px] mt-6 space-y-5">
      <div className="space-y-1.5">
        <input
          type="range"
          min="0"
          max={playerStore.fullDuration || 100}
          value={playerStore.currentTime || 0}
          onChange={(e) => {
            const time = parseInt(e.target.value);
            audioEngine.seek(time);
            setPlayerStore("currentTime", time);
          }}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#48e4ff]"
        />
        <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
          <span>{convertSStoHHMMSS(playerStore.currentTime || 0)}</span>
          <span>{convertSStoHHMMSS(playerStore.fullDuration || 0)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button 
          onClick={() => props.setShowLyrics(!props.showLyrics)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            props.showLyrics ? "text-[#48e4ff] bg-cyan-950/60" : "text-zinc-500 hover:text-white"
          }`}
          title="Toggle Lyrics"
        >
          <Music2 className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-6">
          <button 
            onClick={playPrev}
            className="p-2 text-white hover:text-[#48e4ff] transition-colors cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button 
            onClick={() => {
              if (isPlaying) {
                audioEngine.pause();
                setPlayerStore("playbackState", "paused");
              } else {
                audioEngine.play().catch(() => {});
                setPlayerStore("playbackState", "playing");
              }
            }}
            className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20 cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-0.5" />}
          </button>

          <button 
            onClick={playNext}
            className="p-2 text-white hover:text-[#48e4ff] transition-colors cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>

        <button 
          onClick={() => {
            const next = !playerStore.loop;
            audioEngine.setLooping(next);
            setPlayerStore("loop", next);
          }}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            playerStore.loop ? "text-[#48e4ff] bg-cyan-950/60" : "text-zinc-500 hover:text-white"
          }`}
          title="Loop Track"
        >
          <Repeat className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
        <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
        <input 
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={playerStore.volume !== undefined ? playerStore.volume : 1}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            audioEngine.setVolume(val);
            setPlayerStore("volume", val);
          }}
          className="flex-grow h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#48e4ff]"
        />
      </div>
    </div>
  );
}

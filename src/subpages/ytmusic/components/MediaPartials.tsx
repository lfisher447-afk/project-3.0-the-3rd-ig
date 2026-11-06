import React, { useState, useEffect } from "react";
import { Heart, Play, Pause, Video, Music } from "lucide-react";
import { getCollection, addToCollection, removeFromCollection } from "../modules/library";
import { useAppStore, usePlayerStore, setPlayerStore, t } from "../store";

export const LikeButton: React.FC = () => {
  const store = useAppStore();
  const [isLiked, setIsLiked] = useState(false);
  const track = store.actionsMenu;

  useEffect(() => {
    if (track?.id) {
      setIsLiked(getCollection("liked").includes(track.id));
    }
  }, [track?.id, store.libraryUpdated]);

  const toggleLike = () => {
    if (!track) return;
    if (isLiked) {
      removeFromCollection("liked", [track.id]);
    } else {
      addToCollection("liked", [track]);
    }
    setIsLiked(!isLiked);
  };

  return (
    <button
      onClick={toggleLike}
      className="p-2 transition-colors cursor-pointer"
      title={t("library_liked_songs" as any) || "Like Track"}
    >
      <Heart className={`w-5 h-5 ${isLiked ? "fill-[#48e4ff] text-[#48e4ff]" : "text-zinc-400 hover:text-white"}`} />
    </button>
  );
};

export const PlayButton: React.FC<{ onClick: () => void; isPlaying: boolean }> = ({ onClick, isPlaying }) => {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg cursor-pointer"
    >
      {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
    </button>
  );
};

export const MediaDetails: React.FC<{ title: string; author: string }> = ({ title, author }) => {
  const playerStore = usePlayerStore();
  const isWatching = playerStore.isWatching;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Audio / Video Switcher Pill */}
      {playerStore.stream?.id && (
        <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold mb-1">
          <button
            onClick={() => setPlayerStore("isWatching", false)}
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition cursor-pointer ${
              !isWatching ? "bg-[#48e4ff] text-black shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Audio</span>
          </button>
          <button
            onClick={() => setPlayerStore("isWatching", true)}
            className={`px-3 py-1 rounded-full flex items-center gap-1.5 transition cursor-pointer ${
              isWatching ? "bg-rose-500 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video</span>
          </button>
        </div>
      )}

      <h4 className="text-base font-bold text-white truncate max-w-full text-center">{title}</h4>
      <p className="text-xs text-zinc-400 truncate max-w-full text-center">{author}</p>
    </div>
  );
};

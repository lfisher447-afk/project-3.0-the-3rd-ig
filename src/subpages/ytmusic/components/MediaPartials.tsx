import React, { useState, useEffect } from "react";
import { getCollection, addToCollection, removeFromCollection } from "../modules/library";
import { useAppStore, t } from "../store";

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
    <i
      className={`text-2xl cursor-pointer transition-colors ${isLiked ? "ri-heart-3-fill text-[#48e4ff]" : "ri-heart-3-line text-zinc-400 hover:text-white"}`}
      onClick={toggleLike}
      title={t("library_liked_songs" as any) || "Like"}
    ></i>
  );
};

export const PlayButton: React.FC<{ onClick: () => void; isPlaying: boolean }> = ({ onClick, isPlaying }) => {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
    >
      <i className={`text-2xl ${isPlaying ? "ri-pause-fill" : "ri-play-fill"}`}></i>
    </button>
  );
};

export const MediaDetails: React.FC<{ title: string; author: string }> = ({ title, author }) => {
  return (
    <div className="flex flex-col">
      <h4 className="text-sm font-bold text-white truncate">{title}</h4>
      <p className="text-xs text-zinc-400 truncate">{author}</p>
    </div>
  );
};

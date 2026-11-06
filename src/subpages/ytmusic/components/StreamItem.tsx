import React, { useState, useEffect, useRef } from "react";
import { generateImageUrl, stripTopic } from "../utils";
import { useConfig } from "../config";
import { player } from "../modules/playback";
import {
  setStore,
  setQueueStore,
  setPlayerStore,
  playerStore,
} from "../store";

export default function StreamItem(data: any) {
  const config = useConfig();
  const [image, setImage] = useState(data.img || data.thumbnail || "");
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (config.loadImage && (data.img || data.thumbnail || data.id)) {
      const url = data.img || data.thumbnail || generateImageUrl(data.id);
      if (url) setImage(url);
    }
  }, [data.id, data.img, data.thumbnail, config.loadImage]);

  const isMarked = data.mark?.get ? data.mark.get(data.id) : false;
  const title = data.title || "Unknown Track";
  const author = data.author || data.artist || "YouTube Music";

  return (
    <a
      className={`streamItem flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer ${isMarked ? "bg-white/10" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        
        const target = e.target as HTMLElement;
        if (target.closest(".more-btn")) {
          setStore("actionsMenu", data);
          return;
        }

        if (data.mark?.mode && data.mark?.set) {
          data.mark.set(data.id);
          return;
        }

        // Play track
        setPlayerStore("stream", data);
        setPlayerStore("context", data.context || { id: "", src: "" });
        player(data.id || data.videoId);
      }}
    >
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        {image && !imgError ? (
          <img
            src={image}
            alt={title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-950 to-zinc-900 flex items-center justify-center text-cyan-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        {data.duration && (
          <div className="absolute bottom-0 right-0 px-1 bg-black/75 text-[9px] font-mono text-zinc-300 rounded-tl">
            {data.duration}
          </div>
        )}
      </div>
      
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-medium text-white truncate group-hover:text-[#48e4ff] transition-colors">
          {title}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
          <span>{stripTopic(author)}</span>
          {data.subtext && (
            <>
              <span className="text-[10px] text-zinc-600">•</span>
              <span className="text-zinc-500 truncate">{data.subtext}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity more-btn">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setStore("actionsMenu", data);
          }}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          title="Track actions"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="5" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="12" cy="19" r="2"/>
          </svg>
        </button>
      </div>
    </a>
  );
}

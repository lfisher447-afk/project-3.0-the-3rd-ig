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
  const [image, setImage] = useState("");
  const parentRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (config.loadImage) {
      const url = generateImageUrl(data.img || data.id);
      if (url) setImage(url);
    }
  }, [data.id, data.img, config.loadImage]);

  const isMarked = data.mark?.get(data.id);

  return (
    <a
      className={`streamItem flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer ${isMarked ? "bg-white/10" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        
        const target = e.target as HTMLElement;
        if (target.classList.contains("ri-more-2-fill")) {
          setStore("actionsMenu", data);
          return;
        }

        if (data.mark?.mode) {
          data.mark.set(data.id);
          return;
        }

        // Play track
        setPlayerStore("stream", data);
        setPlayerStore("context", data.context || { id: "", src: "" });
        player(data.id);
      }}
    >
      <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-zinc-800">
        {config.loadImage && image && (
          <img
            src={image}
            alt={data.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-0 right-0 px-1 bg-black/60 text-[10px] text-white rounded-tl">
          {data.duration}
        </div>
      </div>
      
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-medium text-white truncate group-hover:text-[#48e4ff] transition-colors">
          {data.title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-zinc-400 truncate">
          <span>{stripTopic(data.author)}</span>
          {data.subtext && (
            <>
              <span className="text-[10px]">•</span>
              <span>{data.subtext}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <i className="ri-more-2-fill p-2 text-zinc-400 hover:text-white"></i>
      </div>
    </a>
  );
}

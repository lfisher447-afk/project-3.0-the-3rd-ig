import React, { useState, useEffect, useRef } from "react";
import { generateImageUrl } from "../utils";
import { useConfig } from "../config";
import {
  usePlayerStore,
  setPlayerStore,
  t,
} from "../store";

export default function Video() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerStore = usePlayerStore();
  const config = useConfig();

  useEffect(() => {
    if (!playerStore.stream.id) return;
    
    // In a real app, we'd fetch the video URL from our API
    fetch(`/api/ytmusic/video-stream?id=${playerStore.stream.id}`)
      .then(res => res.json())
      .then(data => {
        if (videoRef.current && data.url) {
          videoRef.current.src = data.url;
          videoRef.current.currentTime = playerStore.audio.currentTime;
          videoRef.current.play().catch(() => {});
        }
      });

    return () => {
      if (videoRef.current) videoRef.current.pause();
    };
  }, [playerStore.stream.id]);

  function close() {
    setPlayerStore("isWatching", false);
  }

  return (
    <div className="w-full max-w-[400px] aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={generateImageUrl(playerStore.stream.id) || undefined}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setPlayerStore("currentTime", Math.floor(videoRef.current.currentTime));
          }
        }}
      />
      
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={close}
          className="bg-black/60 text-white p-2 rounded-full hover:bg-black"
        >
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>
  );
}

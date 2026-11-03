import React, { useState, useEffect, useRef } from "react";
import { playerStore, setPlayerStore, setStore, t } from "../store";

export default function Lyrics(props: { onClose: () => void }) {
  const [lrcMap, setLrcMap] = useState<{ time?: number; text: string }[]>([
    { text: t("loading") || "Loading..." },
  ]);
  const [activeLine, setActiveLine] = useState(-1);
  const lyricsSection = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { title, author, id } = playerStore.stream;
    if (!id) return;

    const controller = new AbortController();
    let active = true;

    setLrcMap([{ text: t("loading") || "Loading..." }]);
    setActiveLine(-1);

    const params = new URLSearchParams({
      track_name: title,
      artist_name: author.replace(" - Topic", ""),
      duration: (playerStore.fullDuration ?? "").toString(),
    });

    fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!active) return;
        return res.json();
      })
      .then((data: any) => {
        if (!active || !data) return;
        const lrc = data.syncedLyrics;
        
        if (lrc) {
          const parsedLines: { time: number; text: string }[] = [];
          for (const line of lrc.split("\n")) {
            const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
            if (!match) continue;
            const text = match[3].trim();
            if (!text) continue;
            const mm = parseFloat(match[1]);
            const ss = parseFloat(match[2]);
            parsedLines.push({
              time: mm * 60 + ss,
              text,
            });
          }
          setLrcMap(parsedLines);
        } else {
          setLrcMap([{ text: t("lyrics_no_found") || "No lyrics found" }]);
        }
      })
      .catch(() => {
        if (!active) return;
        setLrcMap([{ text: t("lyrics_failed") || "Failed to fetch lyrics" }]);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [playerStore.stream.id]);

  useEffect(() => {
    const time = playerStore.currentTime;
    let currentIndex = -1;
    for (let i = 0; i < lrcMap.length; i++) {
      if (lrcMap[i].time !== undefined && lrcMap[i].time! <= time) {
        currentIndex = i;
      } else {
        break;
      }
    }
    if (currentIndex !== activeLine) {
      setActiveLine(currentIndex);
      if (currentIndex >= 0 && lyricsSection.current?.children[currentIndex]) {
        lyricsSection.current.children[currentIndex].scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    }
  }, [playerStore.currentTime, lrcMap]);

  return (
    <div 
      ref={lyricsSection} 
      className="absolute inset-0 bg-black/80 backdrop-blur-xl z-20 overflow-y-auto p-12 flex flex-col items-center text-center space-y-4"
    >
      <button 
        onClick={props.onClose}
        className="fixed top-6 right-6 text-2xl text-zinc-400 hover:text-white"
      >
        <i className="ri-close-line"></i>
      </button>

      {lrcMap.map((item, i) => (
        <p 
          key={i} 
          className={`text-xl md:text-2xl font-bold transition-all duration-500 max-w-2xl ${activeLine === i ? "text-white scale-110" : "text-zinc-600 scale-90"}`}
        >
          {item.text}
        </p>
      ))}
    </div>
  );
}

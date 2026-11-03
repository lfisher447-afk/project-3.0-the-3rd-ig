import React, { useState, useEffect, useRef } from "react";
import { generateImageUrl } from "@utils";
import { useConfig, setConfig } from "@config";
import { proxyHandler } from "@modules/playback";
import {
  usePlayerStore,
  playNext,
  setPlayerStore,
  t,
  useQueueStore,
} from "@stores";

export default function Video() {
  const [data, setData] = useState<{
    video: string[][];
    captions: Invidious["captions"];
  }>({
    video: [],
    captions: [],
  });

  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [isPiPActive, setIsPiPActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const config = useConfig();
  const playerStore = usePlayerStore();
  const queueStore = useQueueStore();

  const savedQ =
    config.watchMode ||
    ({ worst: "144p", low: "240p", medium: "360p", high: "720p" } as any)[
      config.quality
    ] || "360p";

  useEffect(() => {
    let active = true;
    if (!playerStore.stream.id) return;
    playerStore.audio.pause();

    (async () => {
      const d = playerStore.data as any;
      if (!d) return;

      const formatStreams = (d.formatStreams || []).map((f: any) => [
        (f.resolution || f.quality || "Auto") + " (HD)",
        f.url,
      ]);

      const adaptiveVideos = (d.adaptiveFormats || [])
        .filter((f: any) => f.type && f.type.startsWith("video"))
        .map((f: any) => [
          f.resolution || f.quality || "Video",
          f.url,
        ]);

      // Deduplicate formats
      const combinedVideoList: string[][] = [];
      const seenLabels = new Set<string>();
      for (const item of [...formatStreams, ...adaptiveVideos]) {
        if (!seenLabels.has(item[0]) && item[1]) {
          seenLabels.add(item[0]);
          combinedVideoList.push(item);
        }
      }

      if (!active) return;

      setData({
        video: combinedVideoList,
        captions: (d.captions || []).map((c: any) => ({
          ...c,
          url: (playerStore.proxy || "") + c.url,
        })),
      });

      if (videoRef.current && combinedVideoList.length > 0) {
        if (videoRef.current.src) {
          videoRef.current.removeAttribute("src");
          videoRef.current.pause();
        }
        delete videoRef.current.dataset.retried;

        const matching =
          combinedVideoList.find((v) => v[0].toLowerCase().includes(savedQ.toLowerCase())) ||
          combinedVideoList[0];

        if (matching && matching[1]) {
          const proxiedUrl = proxyHandler(matching[1], true);
          videoRef.current.src = proxiedUrl;
          setSelectedQuality(matching[1]);
          videoRef.current.currentTime = playerStore.audio.currentTime;
          videoRef.current.play().catch(() => {});
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [playerStore.stream.id]);

  function close() {
    if (videoRef.current) videoRef.current.pause();
    setPlayerStore("status", "");
    setPlayerStore("isWatching", false);
    playerStore.audio.play().catch(() => {});
  }

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (videoRef.current && document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch {
      // PiP catch
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="watcher p-2 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-xl overflow-hidden flex flex-col gap-2">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          controls
          crossOrigin="anonymous"
          poster={generateImageUrl(playerStore.stream.id, "mq")}
          className="w-full h-full object-contain"
          onPlay={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = playerStore.audio.currentTime;
            }
            playerStore.audio.play().catch(() => {});
          }}
          onPause={() => {
            if (playerStore.isWatching) playerStore.audio.pause();
            if (videoRef.current) {
              playerStore.audio.currentTime = videoRef.current.currentTime;
            }
          }}
          onEnded={() => {
            if (!queueStore.list.length) {
              close();
              playNext();
            }
          }}
          onTimeUpdate={() => {
            if (!videoRef.current) return;
            const diff = playerStore.audio.currentTime - videoRef.current.currentTime;
            if (Math.abs(diff) > 1.5) {
              videoRef.current.currentTime = playerStore.audio.currentTime;
            }
          }}
          onError={async () => {
            if (!videoRef.current) return;
            const oldOrigin = new URL(videoRef.current.src).origin;
            const { default: audioErrorHandler } = await import(
              "@modules/audioErrorHandler"
            );
            audioErrorHandler(videoRef.current as any);
            if (videoRef.current.dataset.retried) {
              const { proxy, audio } = playerStore;
              audio.src = audio.src.replace(oldOrigin, proxy);
            }
          }}
        >
          {data.captions.map((v) => (
            <track
              key={v.language_code + v.label}
              kind="subtitles"
              src={v.url || undefined}
              srcLang={v.language_code}
              label={v.label}
            />
          ))}
        </video>
      </div>

      {/* Video Controls Bar */}
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex items-center gap-2">
          <select
            value={selectedQuality}
            onChange={(e) => {
              const url = e.target.value;
              setSelectedQuality(url);
              if (videoRef.current && url) {
                videoRef.current.src = proxyHandler(url, true);
                videoRef.current.currentTime = playerStore.audio.currentTime;
                videoRef.current.play().catch(() => {});
              }
              const selectedOption = e.target.selectedOptions[0]?.textContent;
              if (selectedOption && config.watchMode) {
                setConfig("watchMode", selectedOption.replace(/\s*\(.*\)/, ""));
              }
            }}
            className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer outline-none font-medium"
          >
            <option value="">{t("player_video_resolution")}</option>
            {data.video.map((f) => (
              <option key={f[0]} value={f[1]}>
                {f[0]}
              </option>
            ))}
          </select>

          {document.pictureInPictureEnabled && (
            <button
              type="button"
              onClick={togglePiP}
              title="Picture-in-Picture"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <i className="ri-picture-in-picture-2-line text-sm"></i>
              <span className="hidden sm:inline">PiP</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Fullscreen"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
          >
            <i className="ri-fullscreen-line text-sm"></i>
          </button>
        </div>

        <button
          type="button"
          onClick={close}
          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors cursor-pointer text-xs font-medium flex items-center gap-1.5"
        >
          <i className="ri-close-line text-sm"></i>
          <span>Audio Only</span>
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import "./StreamItem.css";
import {
  hostResolver,
  generateImageUrl,
  isTopicAuthor,
  stripTopic,
} from "@utils";
import { useConfig } from "@config";
import { removeFromCollection, getCollectionItems } from "@modules/library";
import { player } from "@modules/playback";
import {
  setStore,
  store,
  queueStore,
  setQueueStore,
  listStore,
  navStore,
  setNavStore,
  playerStore,
  setPlayerStore,
} from "@stores";
import { getCachedThumbnailUrl } from "@modules/audioCache";
import { cn } from "@components/common";

export default function StreamItem(
  data: YTItem & {
    draggable?: boolean;
    inQueue?: boolean;
    context?: {
      src: Context;
      id: string;
    };
    mark?: {
      mode: (() => boolean) | boolean;
      set: (id: string) => void;
      get: (id: string) => boolean;
    };
    removeMode?: boolean;
  },
) {
  const config = useConfig();
  const [image, setImage] = useState("");
  const parentRef = useRef<HTMLAnchorElement>(null);

  const isAlbum =
    data.context?.id?.startsWith("MPREb") || listStore.type === "album";
  const isFromArtist = data.context?.id?.startsWith("Artist - ");
  const isMusic = isTopicAuthor(data.author);
  const music =
    data.type === "song" ||
    data.context?.id === "favorites" ||
    isFromArtist ||
    (data.context?.src === "queue" && isMusic);

  useEffect(() => {
    let active = true;
    if (config.loadImage && !isAlbum) {
      const initialUrl = generateImageUrl(data.img || data.id, "mq", music);
      setImage(initialUrl);
      getCachedThumbnailUrl(data.id, music).then((cached) => {
        if (active && cached) setImage(cached);
      });
    }
    return () => {
      active = false;
    };
  }, [data.id, data.img, config.loadImage, isAlbum, music]);

  function handleThumbnailLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const src = image;
    if (src.startsWith("blob:") || src.includes("/logo192.png")) {
      parentRef.current?.classList.remove("ravel");
      return;
    }

    const img = e.currentTarget;

    if (
      src.includes("i.ytimg.com") &&
      img.naturalWidth === 120 &&
      img.naturalHeight === 90
    ) {
      if (src.includes("vi_webp")) {
        setImage(src.replace(".webp", ".jpg").replace("vi_webp", "vi"));
        return;
      }
      if (data.context?.src) {
        removeFromCollection(data.context?.id, [data.id]);
      }
      return;
    }

    parentRef.current?.classList.remove("ravel");
  }

  function handleThumbnailError() {
    getCachedThumbnailUrl(data.id, music).then((cached) => {
      if (cached) {
        setImage(cached);
        parentRef.current?.classList.remove("ravel");
        return;
      }
      const src = image;
      if (data.img && src.includes(data.img) && data.id) {
        setImage(generateImageUrl(data.id, "mq", music));
        return;
      }
      if (src.includes("vi_webp")) {
        setImage(src.replace(".webp", ".jpg").replace("vi_webp", "vi"));
        return;
      }
      if (src.includes("wsrv.nl") && data.id) {
        setImage(`https://i.ytimg.com/vi/${data.id}/mqdefault.jpg`);
        return;
      }
      setImage("/logo192.png");
      parentRef.current?.classList.remove("ravel");
    });
  }

  const isMarkMode =
    typeof data.mark?.mode === "function"
      ? data.mark.mode()
      : Boolean(data.mark?.mode);
  const isMarked = Boolean(data.mark?.get(data.id));

  return (
    <a
      className={cn(
        "streamItem card card--interactive",
        config.loadImage && !isAlbum && "ravel",
        isMarked && "marked",
        data.removeMode && "delete",
      )}
      href={hostResolver("/watch?v=" + data.id)}
      ref={parentRef}
      onClick={(e) => {
        e.preventDefault();

        if (data.removeMode) {
          setQueueStore("list", (list: TrackItem[]) => {
            const index = list.findIndex(
              (item) =>
                item.id === data.id &&
                item.context?.id === data.context?.id &&
                item.context?.src === data.context?.src,
            );
            if (index !== -1) {
              const newList = [...list];
              newList.splice(index, 1);
              return newList;
            }
            return list;
          });
          return;
        }

        if (isMarkMode && data.mark) {
          data.mark.set(data.id);
          return;
        }

        const target = e.target as HTMLElement;
        if (!target.classList.contains("ri-more-2-fill")) {
          if (playerStore.stream.id) {
            setQueueStore("history", (h: TrackItem[]) => [
              { ...playerStore.stream },
              ...h,
            ]);
          }

          setPlayerStore("stream", {
            id: data.id,
            title: data.title,
            author: data.author || "",
            duration: data.duration,
            authorId: data.authorId || "",
          });

          if (data.albumId) setPlayerStore("stream", "albumId", data.albumId);
          else if (playerStore.stream.albumId)
            setPlayerStore("stream", "albumId", undefined);

          setPlayerStore("context", {
            id: data.context?.id || "",
            src: data.context?.src || "",
          });

          const isPortrait = matchMedia("(orientation:portrait)").matches;

          if (isPortrait) {
            setNavStore("player", "state", Boolean(config.watchMode));

            if (config.watchMode) navStore.player.ref?.scrollIntoView();
          }

          if (
            config.contextualFill &&
            (data.context?.src === "collection" ||
              data.context?.src === "playlists") &&
            data.context?.id !== "history"
          ) {
            const collectionItems =
              data.context.src === "collection"
                ? getCollectionItems(data.context.id)
                : listStore.list;
            const currentIndex = collectionItems.findIndex(
              (item) => item.id === data.id,
            );
            if (currentIndex !== -1) {
              const zigzagQueue: TrackItem[] = [];
              let left = currentIndex - 1;
              let right = currentIndex + 1;
              const len = collectionItems.length;

              const historyIds = new Set(queueStore.history.map((i) => i.id));

              while (left >= 0 || right < len) {
                if (right < len) {
                  const item = collectionItems[right++];
                  if (!historyIds.has(item.id)) zigzagQueue.push(item);
                }
                if (left >= 0) {
                  const item = collectionItems[left--];
                  if (!historyIds.has(item.id)) zigzagQueue.push(item);
                }
              }
              setQueueStore("list", zigzagQueue);
            }
          }

          player(data.id);

          setQueueStore("list", (list: TrackItem[]) => {
            const index = list.findIndex(
              (item) =>
                item.id === data.id &&
                item.context?.id === data.context?.id &&
                item.context?.src === data.context?.src,
            );
            if (index !== -1) {
              const newList = [...list];
              newList.splice(index, 1);
              return newList;
            }
            return list;
          });
        } else {
          setStore("actionsMenu", {
            id: data.id,
            title: data.title,
            author: data.author,
            duration: data.duration,
            authorId: data.authorId,
            context: data.context,
          });

          const { albumId } = data;
          if (store.actionsMenu?.albumId)
            setStore("actionsMenu", "albumId", undefined);
          if (albumId) setStore("actionsMenu", "albumId", albumId);
        }
      }}
    >
      <span>
        {!isAlbum && config.loadImage ? (
          <>
            <img
              crossOrigin="anonymous"
              onError={handleThumbnailError}
              onLoad={handleThumbnailLoad}
              src={image || undefined}
              alt={data.title}
            />
            <p className="duration">{data.duration}</p>
          </>
        ) : (
          data.duration
        )}
      </span>
      <div className="metadata">
        <p className="title">{data.title}</p>
        <div className="avu">
          <p className="author truncate">{stripTopic(data.author)}</p>
          {!isAlbum && (
            <p className="viewsXuploaded truncate">{data.subtext}</p>
          )}
        </div>
      </div>
      {data.draggable && <i aria-label="Drag" className="ri-draggable"></i>}
      {!data.draggable && !data.inQueue && (
        <i aria-label="More" className="ri-more-2-fill"></i>
      )}
    </a>
  );
}

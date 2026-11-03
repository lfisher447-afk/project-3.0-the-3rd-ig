import React, { useState, useRef } from "react";
import { hostResolver, generateImageUrl } from "@utils";
import { useConfig } from "@config";
import "./ListItem.css";
import { getList, setListStore } from "@stores";
import { cn } from "@components/common";

export default function ListItem(data: YTListItem) {
  const config = useConfig();
  const [thumbnail, setThumbnail] = useState(() =>
    generateImageUrl(data.img, "", data.type === "album"),
  );
  const imgRef = useRef<HTMLImageElement>(null);

  function unravel() {
    imgRef.current?.parentElement?.classList.remove("ravel");
  }
  function handleError() {
    unravel();
    setThumbnail("/logo192.png");
  }

  const url = `/${data.type}/${data.id}`;
  const uploaderData = (data as YTPlaylistItem | YTAlbumItem).author || "";
  const stats =
    (data as YTChannelItem | YTArtistItem).subscribers ||
    (data as YTChannelItem | YTPlaylistItem).videoCount ||
    (data as YTAlbumItem).year ||
    "";

  return (
    <a
      className={cn(
        "listItem card card--interactive",
        data.class,
        config.loadImage && "ravel",
      )}
      href={hostResolver(url)}
      onClick={(e) => {
        e.preventDefault();
        setListStore("img", data.img);
        getList(data.id, data.type);
      }}
    >
      {config.loadImage && (
        <img
          ref={imgRef}
          src={thumbnail || undefined}
          onError={handleError}
          onLoad={unravel}
          alt={data.name}
        />
      )}
      <div>
        <p className="title truncate">{data.name}</p>
        <p className="uData truncate">{uploaderData}</p>
        <p className="stats truncate">{stats}</p>
      </div>
    </a>
  );
}

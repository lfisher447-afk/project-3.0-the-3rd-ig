import React, { useState, useEffect } from "react";
import { usePlayerStore, useAppStore } from "@stores";
import {
  addToCollection,
  getCollection,
  removeFromCollection,
} from "@modules/library";
import { isTopicAuthor } from "@utils";

export default function LikeButton() {
  const store = useAppStore();
  const playerStore = usePlayerStore();

  const item = store.actionsMenu || playerStore.stream;
  const isMusic = isTopicAuthor(item.author);
  const collection = isMusic ? "favorites" : "liked";
  const icon = isMusic ? "ri-heart" : "ri-thumb-up";

  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (item.id) {
      setIsLiked(getCollection(collection).includes(item.id));
    }
  }, [item.id, collection, store.libraryUpdated]);

  return (
    <i
      aria-label={`${collection}`}
      className={`${icon}-${isLiked ? "fill" : "line"}`}
      onClick={async (e) => {
        e.stopPropagation();
        if (isLiked) removeFromCollection(collection, [item.id]);
        else addToCollection(collection, [item]);

        setIsLiked(!isLiked);
      }}
    ></i>
  );
}

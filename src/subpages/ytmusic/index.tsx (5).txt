import React, { useState, useEffect, useRef } from "react";
import {
  addToCollection,
  getCollection,
  removeFromCollection,
} from "@modules/library";
import "./ActionsMenu.css";
import { LikeButton } from "@components/MediaPartials";
import CollectionSelector from "./CollectionSelector";
import StreamItem from "@components/StreamItem";
import { isTopicAuthor, stripTopic } from "@utils";
import {
  setStore,
  useAppStore,
  t,
  playerStore,
  getList,
  setListStore,
  addToQueue,
  useQueueStore,
  setQueueStore,
  openSubView,
} from "@stores";
import { cn } from "@components/common";

export default function ActionsMenu() {
  const store = useAppStore();
  const queueStore = useQueueStore();
  const isMusic = isTopicAuthor(store.actionsMenu?.author);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [isListenLater, setIsListenLater] = useState(false);
  const [isViewingAuthor, setIsViewingAuthor] = useState(false);
  const [isViewingAlbum, setIsViewingAlbum] = useState(false);
  const [debugOutput, setDebugOutput] = useState<any>(null);

  function closeDialog() {
    dialogRef.current?.close();
    setStore("actionsMenu", undefined);
  }

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  useEffect(() => {
    const id = store.actionsMenu?.id;
    if (id) {
      setIsListenLater(getCollection("listenLater").includes(id));
    }
  }, [store.actionsMenu?.id, store.libraryUpdated]);

  return (
    <>
      <dialog
        id="actionsMenu"
        ref={dialogRef}
        className={cn(Boolean(isMusic) && "is-music")}
        onClick={() => !isViewingAuthor && !isViewingAlbum && closeDialog()}
      >
        <StreamItem
          id={store.actionsMenu?.id || ""}
          title={store.actionsMenu?.title || ""}
          authorId={store.actionsMenu?.authorId || ""}
          author={store.actionsMenu?.author || ""}
          duration={store.actionsMenu?.duration || ""}
          type={isMusic ? "song" : "video"}
          context={store.actionsMenu?.context}
        />

        <ul onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <li className="clxnShelf" tabIndex={-1}>
            <LikeButton />
            <i
              aria-label={t("library_listen_later")}
              className={`ri-calendar-schedule-${isListenLater ? "fill" : "line"}`}
              onClick={() => {
                const { actionsMenu } = store;
                if (actionsMenu) {
                  if (isListenLater)
                    removeFromCollection("listenLater", [actionsMenu.id]);
                  else addToCollection("listenLater", [actionsMenu]);

                  setIsListenLater(!isListenLater);
                }
              }}
            ></i>
            <i aria-label={t("collection_selector_add_to")}>
              <CollectionSelector
                close={closeDialog}
                data={store.actionsMenu ? [store.actionsMenu as TrackItem] : []}
              />
            </i>
          </li>

          <li
            tabIndex={0}
            onClick={() => {
              const { actionsMenu } = store;
              if (actionsMenu)
                addToQueue(
                  [
                    {
                      ...actionsMenu,
                      context: { src: "", id: Date.now().toString() },
                    },
                  ],
                  { prepend: true },
                );

              closeDialog();
            }}
          >
            <i className="ri-skip-forward-fill"></i>
            {t("player_play_next")}
          </li>

          <li
            tabIndex={1}
            onClick={() => {
              const { actionsMenu } = store;
              if (actionsMenu)
                addToQueue([
                  {
                    ...actionsMenu,
                    context: { src: "", id: Date.now().toString() },
                  },
                ]);
              closeDialog();
            }}
          >
            <i className="ri-list-check-2"></i>
            {t("actions_menu_enqueue")}
          </li>

          <li
            tabIndex={3}
            onClick={async () => {
              const id = store.actionsMenu?.id;
              const currentTitle = store.actionsMenu?.title;
              if (!id) return;

              setQueueStore("isLoading", true);
              import("@modules/getRadio")
                .then((mod) => mod.default(id))
                .then((data) => {
                  setQueueStore("list", []);
                  addToQueue(
                    data.map((item) => ({
                      ...item,
                      context: { src: "queue", id: `Radio: ${currentTitle}` },
                    })),
                  );
                  openSubView("queue");
                })
                .catch((e) => {
                  setStore(
                    "snackbar",
                    e instanceof Error ? e.message : "Unknown error",
                  );
                })
                .finally(() => {
                  setQueueStore("isLoading", false);
                  closeDialog();
                });
            }}
          >
            <i
              className={
                queueStore.isLoading
                  ? "ri-loader-3-line loading-spinner"
                  : "ri-radio-line"
              }
            ></i>
            {t("actions_menu_start_radio")}
          </li>

          <li
            tabIndex={5}
            onClick={async () => {
              if (isViewingAuthor) return;
              const actionsMenu = store.actionsMenu as TrackItem;
              if (!actionsMenu) return;
              const { author, authorId } = actionsMenu;

              if (author)
                setListStore(
                  "name",
                  isTopicAuthor(author) ? "Artist - " + stripTopic(author) : "",
                );

              if (authorId) {
                setIsViewingAuthor(true);
                try {
                  await getList(authorId, isMusic ? "artist" : "channel");
                } finally {
                  setIsViewingAuthor(false);
                  closeDialog();
                }
              }
            }}
          >
            <i
              className={
                isViewingAuthor
                  ? "ri-loader-3-line loading-spinner"
                  : "ri-user-3-line"
              }
            ></i>
            {t(
              isMusic ? "actions_menu_view_artist" : "actions_menu_view_channel",
            )}
          </li>

          {Boolean(store.actionsMenu?.albumId) && (
            <li
              tabIndex={6}
              onClick={async () => {
                if (isViewingAlbum) return;
                const albumId = store.actionsMenu?.albumId;
                if (albumId) {
                  setIsViewingAlbum(true);
                  try {
                    await getList(albumId, "album");
                  } finally {
                    setIsViewingAlbum(false);
                    closeDialog();
                  }
                }
              }}
            >
              <i
                className={
                  isViewingAlbum
                    ? "ri-loader-3-line loading-spinner"
                    : "ri-album-fill"
                }
              ></i>
              {t("actions_menu_view_album")}
            </li>
          )}

          <li
            tabIndex={7}
            onClick={() => {
              const output = store.actionsMenu || playerStore.data;
              setDebugOutput(output);
            }}
          >
            <i className="ri-braces-line"></i>
            {t("actions_menu_debug_info")}
          </li>

          <li
            tabIndex={8}
            onClick={() => {
              const id = store.actionsMenu?.id;
              if (id) {
                const shareUrl = location.origin + "/s/" + id;
                if (navigator.share) {
                  navigator
                    .share({
                      title: store.actionsMenu?.title || "Shared Link",
                      url: shareUrl,
                    })
                    .catch(console.error);
                } else {
                  navigator.clipboard.writeText(shareUrl);
                  setStore("snackbar", "Link copied to clipboard");
                }
              }
              closeDialog();
            }}
          >
            <i className="ri-share-forward-line"></i>
            {t("actions_menu_share")}
          </li>

          <li
            tabIndex={9}
            onClick={() => {
              window.open(
                "https://www.youtube.com/watch?v=" + store.actionsMenu?.id,
              );
            }}
          >
            <i className="ri-youtube-fill"></i>
            {t("actions_menu_yt_link")}
          </li>
        </ul>
      </dialog>

      {debugOutput && (
        <dialog
          open
          onClick={() => setDebugOutput(null)}
          className="displayer"
        >
          <p>{JSON.stringify(debugOutput, null, 4)}</p>
        </dialog>
      )}
    </>
  );
}

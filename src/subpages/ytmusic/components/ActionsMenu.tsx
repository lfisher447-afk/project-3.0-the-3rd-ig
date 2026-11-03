import React, { useState, useEffect, useRef } from "react";
import {
  addToCollection,
  getCollection,
  removeFromCollection,
} from "../modules/library";
import { LikeButton } from "./MediaPartials";
import CollectionSelector from "./CollectionSelector";
import StreamItem from "./StreamItem";
import { isTopicAuthor, stripTopic } from "../utils";
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
} from "../store";
import { cn } from "./common";

export default function ActionsMenu() {
  const store = useAppStore();
  const queueStore = useQueueStore();
  const isMusic = isTopicAuthor(store.actionsMenu?.author);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [isListenLater, setIsListenLater] = useState(false);
  const [isViewingAuthor, setIsViewingAuthor] = useState(false);
  const [isViewingAlbum, setIsViewingAlbum] = useState(false);

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

  if (!store.actionsMenu) return null;

  return (
    <dialog
      id="actionsMenu"
      ref={dialogRef}
      className={cn(
        "bg-zinc-900 border border-zinc-800 rounded-3xl p-0 overflow-hidden shadow-2xl backdrop:bg-black/80 w-full max-w-sm",
        Boolean(isMusic) && "is-music"
      )}
      onClick={(e) => {
        if (e.target === dialogRef.current && !isViewingAuthor && !isViewingAlbum) {
          closeDialog();
        }
      }}
    >
      <div className="p-4 bg-zinc-800/30">
        <StreamItem {...store.actionsMenu} />
      </div>

      <ul className="py-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <li className="px-6 py-4 flex items-center justify-between border-b border-zinc-800/50 mb-2">
          <LikeButton />
          <i
            aria-label={t("library_listen_later" as any) || "Listen Later"}
            className={`text-2xl cursor-pointer transition-colors ri-calendar-schedule-${isListenLater ? "fill text-[#48e4ff]" : "line text-zinc-400 hover:text-white"}`}
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
          <CollectionSelector
            close={closeDialog}
            data={store.actionsMenu ? [store.actionsMenu] : []}
          />
        </li>

        <li
          className="px-6 py-3 flex items-center gap-4 hover:bg-white/5 cursor-pointer text-zinc-200 transition-colors"
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
          <i className="ri-skip-forward-fill text-xl text-zinc-400"></i>
          <span>{t("player_play_next" as any) || "Play Next"}</span>
        </li>

        <li
          className="px-6 py-3 flex items-center gap-4 hover:bg-white/5 cursor-pointer text-zinc-200 transition-colors"
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
          <i className="ri-list-check-2 text-xl text-zinc-400"></i>
          <span>{t("actions_menu_enqueue" as any) || "Add to Queue"}</span>
        </li>

        <li
          className="px-6 py-3 flex items-center gap-4 hover:bg-white/5 cursor-pointer text-zinc-200 transition-colors"
          onClick={async () => {
            const id = store.actionsMenu?.id;
            const currentTitle = store.actionsMenu?.title;
            if (!id) return;

            setQueueStore("isLoading", true);
            // In a real app, this would call a radio module
            setStore("snackbar", "Starting Radio...");
            setTimeout(() => {
                setQueueStore("isLoading", false);
                closeDialog();
            }, 1000);
          }}
        >
          <i
            className={cn(
              "text-xl text-zinc-400",
              queueStore.isLoading
                ? "ri-loader-3-line animate-spin"
                : "ri-radio-line"
            )}
          ></i>
          <span>{t("actions_menu_start_radio" as any) || "Start Radio"}</span>
        </li>

        <li
          className="px-6 py-3 flex items-center gap-4 hover:bg-white/5 cursor-pointer text-zinc-200 transition-colors"
          onClick={async () => {
            if (isViewingAuthor) return;
            const actionsMenu = store.actionsMenu;
            if (!actionsMenu) return;
            const { author, authorId } = actionsMenu;

            if (author)
              setListStore(
                "name",
                isTopicAuthor(author) ? "Artist - " + stripTopic(author) : author,
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
            className={cn(
              "text-xl text-zinc-400",
              isViewingAuthor
                ? "ri-loader-3-line animate-spin"
                : "ri-user-3-line"
            )}
          ></i>
          <span>
            {t(
              (isMusic ? "actions_menu_view_artist" : "actions_menu_view_channel") as any,
            ) || (isMusic ? "View Artist" : "View Channel")}
          </span>
        </li>

        {Boolean(store.actionsMenu?.albumId) && (
          <li
            className="px-6 py-3 flex items-center gap-4 hover:bg-white/5 cursor-pointer text-zinc-200 transition-colors"
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
              className={cn(
                "text-xl text-zinc-400",
                isViewingAlbum
                  ? "ri-loader-3-line animate-spin"
                  : "ri-album-fill"
              )}
            ></i>
            <span>{t("actions_menu_view_album" as any) || "View Album"}</span>
          </li>
        )}

        <li
          className="px-6 py-3 flex items-center gap-4 hover:bg-white/5 cursor-pointer text-zinc-200 transition-colors"
          onClick={() => {
            const id = store.actionsMenu?.id;
            if (id) {
              const shareUrl = location.origin + "/s/" + id;
              navigator.clipboard.writeText(shareUrl);
              setStore("snackbar", "Link copied to clipboard");
            }
            closeDialog();
          }}
        >
          <i className="ri-share-forward-line text-xl text-zinc-400"></i>
          <span>{t("actions_menu_share" as any) || "Share"}</span>
        </li>

        <li
          className="px-6 py-3 flex items-center gap-4 hover:bg-white/5 cursor-pointer text-zinc-200 transition-colors"
          onClick={() => {
            window.open(
              "https://www.youtube.com/watch?v=" + store.actionsMenu?.id,
            );
            closeDialog();
          }}
        >
          <i className="ri-youtube-fill text-xl text-zinc-400"></i>
          <span>{t("actions_menu_yt_link" as any) || "YouTube Link"}</span>
        </li>
      </ul>
      
      <button 
        onClick={closeDialog}
        className="w-full py-4 bg-zinc-800 text-zinc-400 font-bold hover:text-white transition-colors border-t border-zinc-700/50"
      >
        {t("close" as any) || "Close"}
      </button>
    </dialog>
  );
}

import React, { useState, useEffect } from "react";
import {
  deleteCollection,
  getLists,
  saveLists,
  getCollectionItems,
  renameCollection,
  getLibraryAlbums,
  saveAlbumToLibrary,
  removeAlbumFromLibrary,
} from "@modules/library";
import { player } from "@modules/playback";
import {
  useListStore,
  resetList,
  setListStore,
  setStore,
  t,
  addToQueue,
  setQueueStore,
  openSubView,
  setPlayerStore,
} from "@stores";

export default function Dropdown() {
  const listStore = useListStore();
  const [isSubscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const isAlbum =
      listStore.id.startsWith("MPREb") || listStore.type === "album";

    if (isAlbum) {
      const albums = getLibraryAlbums();
      setSubscribed(albums.some((a) => a.id === listStore.id));
    } else {
      setSubscribed(
        getLists(listStore.type as "channels" | "playlists").some(
          (item) => item.id === listStore.id,
        ),
      );
    }
  }, [listStore.id, listStore.type]);

  function subscriptionHandler() {
    const isAlbum =
      listStore.id.startsWith("MPREb") || listStore.type === "album";

    if (isAlbum) {
      if (isSubscribed) {
        removeAlbumFromLibrary(listStore.id);
      } else {
        const albumData: Album = {
          name: listStore.name,
          author: listStore.author,
          img: listStore.img,
          id: listStore.id,
        };
        saveAlbumToLibrary(listStore.id, albumData);
      }
      setSubscribed(!isSubscribed);
      return;
    }

    const { name, type, id, author, img } = listStore;
    if (type === "collection") return;

    let data = getLists(type as "channels" | "playlists");

    if (isSubscribed) {
      data = data.filter((item) => item.id !== id);
    } else {
      const dataset = {
        id,
        name,
        img: img || listStore.list?.[0]?.id || "",
      } as Playlist;

      if (type === "playlists") dataset.author = author;

      data.push(dataset);
    }

    saveLists(type as "channels" | "playlists", data);
    setSubscribed(!isSubscribed);
  }

  return (
    <details>
      <summary>
        <i
          aria-label={t("settings_more_options")}
          className="ri-more-2-fill"
        ></i>
      </summary>
      <ul id="listTools">
        <li
          id="playAllBtn"
          onClick={() => {
            const fullList =
              listStore.type === "collection"
                ? getCollectionItems(listStore.id)
                : listStore.list;
            if (!fullList.length) return;

            setQueueStore("history", []);
            setQueueStore("list", []);
            setPlayerStore("stream", fullList[0]);
            addToQueue(fullList.slice(1));
            player(fullList[0].id);

            openSubView("queue");
          }}
        >
          <i className="ri-play-large-line"></i>
          {t("list_play")}
        </li>

        <li
          onClick={() => {
            const fullList =
              listStore.type === "collection"
                ? getCollectionItems(listStore.id)
                : listStore.list;
            setQueueStore("history", []);
            addToQueue(fullList);
            openSubView("queue");
          }}
        >
          <i className="ri-list-check-2"></i>
          {t("list_enqueue")}
        </li>

        {(listStore.type !== "collection" || listStore.isShared) && (
          <li
            onClick={() =>
              import("@modules/listUtils").then((mod) => mod.importList())
            }
          >
            <i className="ri-import-line"></i>
            {t("list_import")}
          </li>
        )}

        {((listStore.type === "channels" &&
          !listStore.name.startsWith("Artist")) ||
          listStore.type === "playlists" ||
          listStore.type === "album") && (
          <>
            <li onClick={subscriptionHandler}>
              <i className={"ri-star-" + (isSubscribed ? "fill" : "line")}></i>
              {isSubscribed
                ? t("list_saved_to_library")
                : t("list_save_to_library")}
            </li>

            <li
              onClick={() => {
                const { type, id } = listStore;
                let url = "";

                if (id.startsWith("MPREb")) {
                  url = "https://music.youtube.com/browse/" + id;
                } else if (
                  type === "playlists" ||
                  type === "album" ||
                  id.startsWith("OLAK5uy")
                ) {
                  url = "https://www.youtube.com/playlist?list=" + id;
                } else if (type === "channels") {
                  url = "https://www.youtube.com/channel/" + id;
                }

                if (url) window.open(url);
              }}
            >
              <i className="ri-youtube-fill"></i>
              {t("actions_menu_yt_link")}
            </li>

            <li
              onClick={() => {
                const { type, id, name, author } = listStore;
                let path = "";
                let displayName = name;

                if (id.startsWith("MPREb") && type === "channels") {
                  path = "artist/" + id;
                  displayName = name.replace("Artist - ", "");
                } else if (type === "channels") {
                  path = "channel/" + id;
                } else if (type === "album" || id.startsWith("MPREb")) {
                  path = "album/" + id;
                } else if (type === "playlists") {
                  path = "playlist/" + id;
                }

                if (path) {
                  const shareUrl = location.origin + "/" + path;
                  if (navigator.share) {
                    navigator
                      .share({
                        title: displayName + (author ? " by " + author : ""),
                        url: shareUrl,
                      })
                      .catch(console.error);
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    setStore("snackbar", "Link copied to clipboard");
                  }
                }
              }}
            >
              <i className="ri-share-forward-line"></i>
              {t("list_share_link")}
            </li>
          </>
        )}

        {listStore.type === "collection" && listStore.isReversed && (
          <li id="clearListBtn">
            <i className="ri-close-large-line"></i>
            {t("list_clear_all")}
          </li>
        )}

        {listStore.type === "collection" &&
          !listStore.isReversed &&
          !listStore.isShared && (
            <>
              <li
                id="deleteCollectionBtn"
                onClick={() => {
                  const { id } = listStore;
                  if (confirm(t("list_prompt_delete", id))) {
                    deleteCollection(id);
                    resetList();
                  }
                }}
              >
                <i className="ri-delete-bin-2-line"></i>
                {t("list_delete")}
              </li>

              <li
                id="renameCollectionBtn"
                onClick={() => {
                  const oldName = listStore.name;
                  const newName = prompt(t("list_rename_prompt"), oldName);
                  if (newName && newName !== oldName) {
                    renameCollection(oldName, newName);
                    setListStore("name", newName);
                    setListStore("id", newName);
                    setStore("snackbar", t("list_rename_success"));
                  }
                }}
              >
                <i className="ri-edit-line"></i>
                {t("list_rename")}
              </li>

              <li
                id="shareCollectionBtn"
                onClick={() =>
                  import("@modules/listUtils").then((mod) =>
                    mod.shareCollection(getCollectionItems(listStore.id)),
                  )
                }
              >
                <i className="ri-link"></i>
                {t("list_share")}
              </li>

              <li
                id="exportCollectionBtn"
                onClick={() => {
                  const collectionData: TrackItem[] = getCollectionItems(
                    listStore.id,
                  );
                  const jsonString = JSON.stringify(collectionData, null, 2);
                  navigator.clipboard
                    .writeText(jsonString)
                    .then(() => {
                      setStore("snackbar", t("list_export_success"));
                    })
                    .catch((err) => {
                      setStore("snackbar", t("list_export_error") + err);
                    });
                }}
              >
                <i className="ri-export-line"></i>
                {t("list_export")}
              </li>
            </>
          )}
      </ul>
    </details>
  );
}

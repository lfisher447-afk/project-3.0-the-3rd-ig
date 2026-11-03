import React, { useState, useEffect, useRef } from "react";
import "../List.css";
import {
  addToQueue,
  useListStore,
  setListStore,
  resetList,
  setNavStore,
  t,
  setQueueStore,
  openSubView,
  getList,
} from "../store";
import {
  generateImageUrl,
  sortCollection,
  normalizeText,
  stripTopic,
} from "../utils";
import {
  useConfig,
} from "../config";
import {
  DISCOVERY_COLLECTION,
  fetchCollection,
  removeFromCollection,
  getCollectionItems,
} from "../modules/library";
import Dropdown from "../components/Dropdown";
import Results from "../components/Results";
import CollectionSelector from "../components/CollectionSelector";
import ListItem from "../components/ListItem";
import HeaderNav from "../components/HeaderNav";
import { cn } from "../components/common";

function AlbumRow(props: { albums: any[] }) {
  if (props.albums.length === 0) return null;
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
      {props.albums.map((album) => (
        <ListItem
          key={album.id}
          name={album.name}
          year={album.year}
          img={album.img}
          author={album.author}
          id={album.id}
          type="album"
        />
      ))}
    </div>
  );
}

export default function ListFeature() {
  const listSection = useRef<HTMLElement>(null);
  const listStore = useListStore();
  const config = useConfig();

  const [markMode, setMarkMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [markList, setMarkList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const getSourceItems = () => {
    let source =
      listStore.type === "collection" && !listStore.isShared
        ? getCollectionItems(listStore.id)
        : (listStore.list as any[]);

    if (
      listStore.type === "collection" &&
      !listStore.reservedCollections.includes(listStore.id)
    ) {
      source = sortCollection(source, config.sortBy, config.sortOrder);
    }

    return source || [];
  };

  const filteredItems = () => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return getSourceItems();

    const source = getSourceItems();
    const query = normalizeText(rawQuery);

    return source.filter((item) => {
      if (!item) return false;
      return (
        normalizeText(item.title).includes(query) ||
        normalizeText(item.author).includes(query)
      );
    });
  };

  useEffect(() => {
    if (listSection.current) {
      setNavStore("list", "ref", listSection.current);
      listSection.current.scrollIntoView();
    }
  }, []);

  useEffect(() => {
    return () => {
      resetList();
    };
  }, []);

  const MarkBar = () => {
    const canRemoveFrom =
      listStore.type === "collection" &&
      !listStore.isShared &&
      listStore.id !== DISCOVERY_COLLECTION;

    return (
      <div className="flex items-center gap-4 py-2 px-4 bg-zinc-900 rounded-full border border-zinc-800">
        <i
          aria-label={t("close" as any) || "Close"}
          className="ri-close-large-line cursor-pointer hover:text-white transition-colors"
          onClick={() => setMarkMode(false)}
        ></i>
        
        <div className="h-4 w-[1px] bg-zinc-800" />
        
        <i
          aria-label={t("list_mark_all" as any) || "Mark All"}
          className="ri-checkbox-multiple-fill cursor-pointer hover:text-white transition-colors"
          onClick={() => {
            const items = filteredItems();
            if (markList.length === items.length && items.length > 0)
              setMarkList([]);
            else setMarkList(items.map((v) => v.id));
          }}
        ></i>

        {canRemoveFrom && markList.length > 0 && (
          <i
            aria-label={t("list_remove_marked" as any) || "Remove Marked"}
            className="ri-indeterminate-circle-line cursor-pointer text-red-500 hover:text-red-400"
            onClick={() => {
              removeFromCollection(listStore.id, markList);
              setMarkList([]);
            }}
          ></i>
        )}

        {markList.length > 0 && (
          <>
            <span className="text-xs font-bold text-[#48e4ff]">{markList.length}</span>
            <i
              aria-label={t("list_enqueue_marked" as any) || "Enqueue Marked"}
              className="ri-list-check-2 cursor-pointer hover:text-white transition-colors"
              onClick={() => {
                const allSource = getSourceItems();
                const listToEnqueue = markList
                  .map((id) => allSource.find((v) => v.id === id))
                  .filter(Boolean);

                if (listToEnqueue.length) {
                  addToQueue(listToEnqueue);
                  openSubView("queue");
                }
              }}
            ></i>

            <CollectionSelector
              data={
                markList
                  .map((id) => getSourceItems().find((v) => v.id === id))
                  .filter(Boolean)
              }
            />
          </>
        )}
      </div>
    );
  };

  return (
    <section ref={listSection as any} className="flex flex-col h-full bg-zinc-950">
      <header className="sticky-bar flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <HeaderNav
          title={
            !markMode ? (
              !isSearching ? (
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-white truncate max-w-[200px]">{listStore.name}</h2>
                    {listStore.author && <p className="text-xs text-zinc-500">{listStore.author}</p>}
                </div>
              ) : (
                <input
                  autoFocus
                  type="text"
                  className="bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-3 text-sm text-white focus:outline-none focus:border-[#48e4ff]"
                  placeholder="Search in list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              )
            ) : (
              <MarkBar />
            )
          }
        />

        {!markMode && (
            <div className="flex items-center gap-4">
              <i
                aria-label={t("list_mark_mode" as any)}
                className={`text-xl cursor-pointer transition-colors ${markMode ? "text-[#48e4ff] ri-checkbox-fill" : "text-zinc-400 hover:text-white ri-checkbox-line"}`}
                onClick={() => {
                  const next = !markMode;
                  setMarkMode(next);
                  if (!next) setMarkList([]);
                }}
              ></i>
              <i
                aria-label={t("nav_search" as any)}
                className={`text-xl cursor-pointer transition-colors ${isSearching ? "text-[#48e4ff] ri-close-line" : "text-zinc-400 hover:text-white ri-search-2-line"}`}
                onClick={() => {
                  const next = !isSearching;
                  setIsSearching(next);
                  if (!next) setSearchQuery("");
                }}
              ></i>
              <Dropdown />
            </div>
        )}
      </header>

      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {(listStore.artistAlbums.length > 0 || listStore.artistEps.length > 0) && (
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Discography</h3>
                <AlbumRow albums={[...listStore.artistAlbums, ...listStore.artistEps]} />
            </div>
        )}

        <Results
          items={filteredItems()}
          mark={{
            mode: markMode,
            set: (id: string) => {
              setMarkList((prev) =>
                prev.includes(id)
                  ? prev.filter((item) => item !== id)
                  : [...prev, id],
              );
            },
            get: (id: string) => markList.includes(id),
          }}
        />
      </div>
    </section>
  );
}

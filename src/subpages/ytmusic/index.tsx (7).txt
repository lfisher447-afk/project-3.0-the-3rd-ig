import React, { useState, useEffect, useRef } from "react";
import "./List.css";
import {
  addToQueue,
  useListStore,
  setListStore,
  resetList,
  setNavStore,
  t,
  setQueueStore,
  openSubView,
  store,
} from "@stores";
import {
  generateImageUrl,
  sortCollection,
  normalizeText,
  stripTopic,
  type SortBy,
} from "@utils";
import {
  useLibrarySections,
  setConfig,
  useConfig,
  setDrawer,
} from "@config";
import {
  DISCOVERY_COLLECTION,
  fetchCollection,
  removeFromCollection,
  getCollectionItems,
} from "@modules/library";
import Dropdown from "./Dropdown";
import Results from "./Results";
import CollectionSelector from "@components/ActionsMenu/CollectionSelector";
import ListItem from "@components/ListItem";
import HeaderNav from "@components/HeaderNav";
import { cn } from "@components/common";

function ArtistRow(props: { artists: Channel[] }) {
  return (
    <div className="list-carousel">
      {props.artists.map((artist) => (
        <ListItem
          key={artist.id}
          name={artist.name}
          img={artist.img}
          id={artist.id}
          type="artist"
        />
      ))}
    </div>
  );
}

function AlbumRow(props: { albums: YTAlbumItem[] }) {
  return (
    <div className="list-carousel">
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
  const sections = useLibrarySections();

  const [markMode, setMarkMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [markList, setMarkList] = useState<string[]>([]);
  const [localSortBy, setLocalSortBy] = useState<SortBy>(config.sortBy);
  const [localSortOrder, setLocalSortOrder] = useState<"asc" | "desc">(
    config.sortOrder,
  );
  const [showSortable, setShowSortable] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteArtists, setFavoriteArtists] = useState<Channel[]>([]);
  const hasAttemptedArtistsFetch = useRef(false);

  const getSourceItems = () => {
    let source =
      listStore.type === "collection" && !listStore.isShared
        ? getCollectionItems(listStore.id)
        : (listStore.list as TrackItem[]);

    if (
      listStore.type === "collection" &&
      !listStore.reservedCollections.includes(listStore.id) &&
      (config.sortBy !== "modified" || config.sortOrder === "asc")
    ) {
      source = sortCollection(source, config.sortBy, config.sortOrder);
    }

    return source || [];
  };

  useEffect(() => {
    if (listStore.id === "favorites" && listStore.type === "collection") {
      if (!sections.featured) {
        setFavoriteArtists([]);
        return;
      }

      const source = getSourceItems();
      const artistCounts: Record<
        string,
        { count: number; name: string; img?: string }
      > = {};
      source.forEach((track) => {
        if (track && track.authorId) {
          const prev = artistCounts[track.authorId];
          artistCounts[track.authorId] = {
            count: (prev?.count || 0) + 1,
            name: stripTopic(track.author) || prev?.name || "",
            img: (track as any).img || prev?.img || "",
          };
        }
      });
      const sorted = Object.entries(artistCounts).sort(
        ([, a], [, b]) => b.count - a.count,
      );
      const artistIds = sorted.map(([id]) => id);

      if (artistIds.length === 0) {
        setFavoriteArtists([]);
        return;
      }

      let cachedArtists: Channel[] = [];
      try {
        const stored = sessionStorage.getItem("featured_artists");
        if (stored) cachedArtists = JSON.parse(stored);
      } catch {}

      if (cachedArtists.length > 0) {
        setFavoriteArtists(cachedArtists);
      } else {
        setFavoriteArtists(
          sorted.slice(0, 15).map(([id, info]) => ({
            id,
            name: info.name,
            img: info.img || "",
            type: "artist",
          })),
        );

        if (hasAttemptedArtistsFetch.current) return;
        hasAttemptedArtistsFetch.current = true;
        fetch(
          `${store.api}/featured?artistIds=${encodeURIComponent(artistIds.slice(0, 5).join(","))}`,
        )
          .then((res) => res.json())
          .then((data: any) => {
            if (Array.isArray(data?.artists) && data.artists.length > 0) {
              setFavoriteArtists(data.artists);
              try {
                sessionStorage.setItem(
                  "featured_artists",
                  JSON.stringify(data.artists),
                );
              } catch {}
            }
          })
          .catch(() => {});
      }
    } else {
      setFavoriteArtists([]);
    }
  }, [listStore.id, listStore.type, sections.featured]);

  const filteredItems = () => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return listStore.list as TrackItem[];

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
      if (listStore.id) {
        setDrawer("lastList", {
          id: listStore.id,
          type:
            listStore.type === "playlists"
              ? "playlist"
              : listStore.type === "channels"
                ? "channel"
                : listStore.type,
          shared: listStore.isShared,
        });
      }
      resetList();
    };
  }, []);

  const MarkBar = () => {
    const currentList = searchQuery.trim() ? filteredItems() : getSourceItems();

    const canRemoveFrom =
      listStore.type === "collection" &&
      !listStore.isShared &&
      listStore.id !== DISCOVERY_COLLECTION;

    return (
      <div className="markBar">
        <i
          aria-label={t("close")}
          className="ri-close-large-line"
          onClick={() => setMarkMode(false)}
        ></i>
        <i
          aria-label={t("list_mark_all")}
          className="ri-checkbox-multiple-fill"
          onClick={() => {
            const items = currentList;
            if (markList.length === items.length && items.length > 0)
              setMarkList([]);
            else setMarkList(items.map((v) => v.id));
          }}
        ></i>

        {canRemoveFrom && (
          <i
            aria-label={t("list_remove_marked")}
            className="ri-indeterminate-circle-line"
            onClick={() => {
              removeFromCollection(listStore.id, markList);
              setMarkList([]);
            }}
          ></i>
        )}

        {markList.length > 0 && (
          <>
            <span>{markList.length}</span>
            <i
              aria-label={t("list_enqueue_marked")}
              className="ri-list-check-2"
              onClick={() => {
                const allSource = getSourceItems();
                const listToEnqueue = markList
                  .map((id) => allSource.find((v) => v.id === id))
                  .filter(Boolean) as TrackItem[];

                if (listToEnqueue.length) {
                  setQueueStore("history", []);
                  addToQueue(listToEnqueue);
                  openSubView("queue");
                }
              }}
            ></i>

            <i aria-label={t("collection_selector_add_to")}>
              <CollectionSelector
                data={
                  markList
                    .map((id) => getSourceItems().find((v) => v.id === id))
                    .filter(Boolean) as TrackItem[]
                }
              />
            </i>
          </>
        )}
      </div>
    );
  };

  const SearchInput = () => (
    <input
      autoFocus
      type="text"
      className="listSearchInput"
      placeholder="Search within List"
      value={searchQuery}
      onChange={(e) => {
        setSearchQuery(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setIsSearching(false);
          setSearchQuery("");
        }
      }}
    />
  );

  return (
    <section ref={listSection} id="listSection">
      <header className="sticky-bar">
        <HeaderNav
          title={
            !markMode ? (
              !isSearching ? (
                <p
                  onClick={() =>
                    setListStore("showStreamsNumber", (prev: boolean) => !prev)
                  }
                  id="listTitle"
                >
                  {listStore.showStreamsNumber
                    ? t(
                        "list_streams_count",
                        (
                          listStore.length ||
                          listStore.list?.length ||
                          0
                        ).toString(),
                      )
                    : listStore.name}
                </p>
              ) : (
                <SearchInput />
              )
            ) : (
              <MarkBar />
            )
          }
          extra={
            !markMode ? (
              isSearching ? (
                <SearchInput />
              ) : null
            ) : (
              <MarkBar />
            )
          }
        />

        <div className="right-group">
          <i
            aria-label={t("list_mark_mode")}
            aria-checked={markMode}
            className={markMode ? "ri-checkbox-fill" : "ri-checkbox-line"}
            onClick={() => {
              const next = !markMode;
              setMarkMode(next);
              if (!next) setMarkList([]);
            }}
          ></i>
          <i
            aria-label={t("nav_search")}
            className={isSearching ? "ri-close-line" : "ri-search-2-line"}
            onClick={() => {
              const next = !isSearching;
              setIsSearching(next);
              if (!next) setSearchQuery("");
            }}
          ></i>
        </div>
        <Dropdown />
      </header>

      {listStore.type === "collection" &&
        listStore.id &&
        !listStore.reservedCollections.includes(listStore.id) && (
          <span className="sortBar">
            <label htmlFor="sortMenu">{t("list_sort_order")} :</label>
            <select
              id="sortMenu"
              onChange={(e) => {
                const newSortBy = e.target.value as SortBy;
                setLocalSortBy(newSortBy);
                setConfig("sortBy", newSortBy);
                fetchCollection(listStore.id);
              }}
              value={localSortBy}
            >
              <option value="modified">{t("list_sort_modified")}</option>
              <option value="name">{t("list_sort_name")}</option>
              <option value="artist">{t("list_sort_artist")}</option>
              <option value="duration">{t("list_sort_duration")}</option>
            </select>
            {localSortBy === "modified" &&
              !listStore.reservedCollections.includes(listStore.id) && (
                <i
                  className={cn("ri-draggable", showSortable && "active")}
                  onClick={() => setShowSortable(!showSortable)}
                ></i>
              )}
            <i
              className={
                localSortOrder === "asc" ? "ri-sort-asc" : "ri-sort-desc"
              }
              onClick={() => {
                const newOrder = config.sortOrder === "asc" ? "desc" : "asc";
                setConfig("sortOrder", newOrder);
                setLocalSortOrder(newOrder);
                fetchCollection(listStore.id);
              }}
            ></i>
          </span>
        )}

      {(listStore.artistAlbums.length > 0 ||
        listStore.artistEps.length > 3) && (
        <div className="list-carousels">
          {listStore.artistAlbums.length > 0 && (
            <AlbumRow albums={listStore.artistAlbums} />
          )}

          {listStore.artistEps.length > 3 && (
            <AlbumRow albums={listStore.artistEps} />
          )}
        </div>
      )}

      {sections.featured &&
        listStore.id === "favorites" &&
        listStore.type === "collection" &&
        favoriteArtists.length > 0 && (
          <div className="list-carousels">
            <ArtistRow artists={favoriteArtists} />
          </div>
        )}

      {config.loadImage && listStore.id.startsWith("MPREb") && (
        <img
          src={generateImageUrl(listStore.img, "720") || undefined}
          alt={listStore.name}
          className="list-thumbnail"
        />
      )}

      <Results
        items={filteredItems()}
        draggable={
          showSortable &&
          localSortBy === "modified" &&
          !listStore.reservedCollections.includes(listStore.id) &&
          !isSearching
        }
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
    </section>
  );
}

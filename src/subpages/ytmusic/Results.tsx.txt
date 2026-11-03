import React, { Suspense, lazy } from "react";
import { useListStore, loadAll, setListStore, t } from "@stores";
import StreamItem from "@components/StreamItem";
import { getCollection, metaUpdater, saveCollection } from "@modules/library";

const SortableList = lazy(
  () => import("@modules/sortable"),
) as React.ComponentType<any>;

export default function Results(props: {
  draggable: boolean;
  items?: TrackItem[];
  mark?: {
    mode: (() => boolean) | boolean;
    set: (id: string) => void;
    get: (id: string) => boolean;
  };
}) {
  const listStore = useListStore();
  const items =
    props.items !== undefined ? props.items : (listStore.list as TrackItem[]);

  const handleReorder = (newList: TrackItem[]) => {
    setListStore("list", newList as YTItem[]);

    if (listStore.type === "collection") {
      const collectionId = listStore.id;
      const fullCollection = getCollection(collectionId);

      const newIds = newList.map((i) => i.id);
      const remainingIds = fullCollection.slice(newList.length);

      saveCollection(collectionId, [...newIds, ...remainingIds]);
      metaUpdater(collectionId);
    }
  };

  if (listStore.isLoading) {
    return <i className="ri-loader-3-line loading-spinner"></i>;
  }

  return (
    <div className="listContainer">
      {props.draggable ? (
        <Suspense fallback={null}>
          <SortableList
            items={items}
            setItems={handleReorder}
            idField="id"
            animation={150}
            handle=".ri-draggable"
          >
            {(item: TrackItem) => (
              <StreamItem
                key={item.id}
                {...{
                  ...item,
                  type: "video",
                  context: {
                    id: listStore.name || listStore.id,
                    src: listStore.type as Context,
                  },
                }}
                draggable={true}
                mark={props.mark}
              />
            )}
          </SortableList>
        </Suspense>
      ) : (
        items.map((item) => (
          <StreamItem
            key={item.id}
            {...{
              ...item,
              type: "video",
              context: {
                id: listStore.name || listStore.id,
                src: listStore.type as Context,
              },
            }}
            draggable={false}
            mark={props.mark}
          />
        ))
      )}
      {listStore.type === "playlists" && listStore.hasContinuation && (
        <button className="loadAllBtn" onClick={loadAll}>
          {t("list_load_all")}
        </button>
      )}
    </div>
  );
}

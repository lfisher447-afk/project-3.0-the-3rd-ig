import React, { Suspense, lazy } from "react";
import { useQueueStore, setQueueStore, groupQueueByAuthor } from "@stores";
import { useConfig } from "@config";
import StreamItem from "@components/StreamItem";

const SortableList = lazy(
  () => import("@modules/sortable"),
) as React.ComponentType<any>;

export default function QueueList() {
  const queueStore = useQueueStore();
  const config = useConfig();

  return (
    <div id="queuelist">
      <Suspense fallback={null}>
        <SortableList
          items={queueStore.list}
          setItems={(items: TrackItem[]) => {
            let newList = items;
            if (config.authorGrouping) newList = groupQueueByAuthor(newList);
            setQueueStore("list", newList);
          }}
          idField="id"
          animation={150}
          handle=".ri-draggable"
        >
          {(item: TrackItem) => (
            <StreamItem
              key={item.id}
              id={item.id}
              title={item.title}
              author={item.author}
              duration={item.duration}
              authorId={item.authorId}
              type="video"
              draggable={true}
              removeMode={queueStore.removeMode}
              context={item.context}
              inQueue={true}
            />
          )}
        </SortableList>
      </Suspense>
    </div>
  );
}

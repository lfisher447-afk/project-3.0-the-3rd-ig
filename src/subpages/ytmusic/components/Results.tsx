import React from "react";
import { useListStore, loadAll, t } from "../store";
import StreamItem from "./StreamItem";

export default function Results(props: {
  draggable?: boolean;
  items?: any[];
  mark?: {
    mode: boolean;
    set: (id: string) => void;
    get: (id: string) => boolean;
  };
}) {
  const listStore = useListStore();
  const items = props.items !== undefined ? props.items : listStore.list;

  if (listStore.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <i className="ri-loader-3-line animate-spin text-2xl text-[#48e4ff]"></i>
      </div>
    );
  }

  return (
    <div className="listContainer space-y-1">
      {items.map((item) => (
        <StreamItem
          key={item.id}
          {...item}
          context={{
            id: listStore.name || listStore.id,
            src: listStore.type,
          }}
          mark={props.mark}
        />
      ))}
      {listStore.type === "playlists" && listStore.hasContinuation && (
        <button 
          className="w-full py-3 text-sm font-bold text-zinc-400 hover:text-white transition-colors" 
          onClick={loadAll}
        >
          {t("list_load_all")}
        </button>
      )}
    </div>
  );
}

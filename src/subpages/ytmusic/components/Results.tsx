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
  const rawItems = props.items !== undefined ? props.items : listStore.list;
  const items = Array.isArray(rawItems) ? rawItems : [];

  if (listStore.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-zinc-400">Retrieving music streams...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">No tracks found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try another search term or click one of these curated topics:</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto pt-2">
          {["Top Hits 2026", "Synthwave", "Chill Lo-Fi", "Hip-Hop", "Rock Anthems", "Anime OST", "Gaming Beats", "EDM Festival"].map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                const input = document.querySelector('input[type="search"]') as HTMLInputElement;
                if (input) {
                  input.value = topic;
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  const form = input.closest('form');
                  if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="listContainer space-y-1 p-2">
      {items.map((item, idx) => (
        <StreamItem
          key={item.id || item.videoId || `track-${idx}`}
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

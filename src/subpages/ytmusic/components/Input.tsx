import React, { useEffect, useRef } from "react";
import {
  clearSuggestions,
  getSearchResults,
  getSearchSuggestions,
  useSearchStore,
  setSearchStore,
  t,
} from "../store";
import { useConfig, drawer } from "../config";

export default function Input() {
  const searchStore = useSearchStore();
  const config = useConfig();
  const superInput = useRef<HTMLInputElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    getSearchResults();
  }, []);

  function textToSearch(text: string) {
    superInput.current?.blur();
    clearSuggestions();
    setSearchStore("page", 1);
    setSearchStore("results", []);
    setSearchStore("query", text);
    getSearchResults(true);
  }

  return (
    <div className="relative w-full">
      <input
        value={searchStore.query}
        placeholder={t("search_placeholder") || "Search for songs, artists..."}
        type="search"
        ref={superInput}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 px-6 text-sm text-white focus:outline-none focus:border-[#48e4ff] transition-colors"
        autoComplete="off"
        onBlur={() => {
          clearTimeout(blurTimeout.current);
          blurTimeout.current = setTimeout(clearSuggestions, 150);
        }}
        onFocus={() => {
          clearTimeout(blurTimeout.current);
          if (searchStore.query) return;
          setSearchStore("suggestions", "data", [...drawer.recentSearches].reverse());
        }}
        onChange={(e) => {
          const { value } = e.target;
          setSearchStore("query", value);

          if (!value) {
            clearSuggestions();
            setSearchStore("suggestions", "data", [...drawer.recentSearches].reverse());
            return;
          }

          getSearchSuggestions(value);
        }}
        onKeyDown={(e) => {
          const { data, index } = searchStore.suggestions;

          if (e.key === "Enter") {
            e.preventDefault();
            textToSearch(data[index] || superInput.current?.value || "");
            return;
          }

          if (e.key === "ArrowUp") {
            setSearchStore("suggestions", "index", index === -1 ? data.length - 1 : index - 1);
          }

          if (e.key === "ArrowDown") {
            setSearchStore("suggestions", "index", index === data.length ? -1 : index + 1);
          }
        }}
      />
      {config.searchSuggestions && searchStore.suggestions.data.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1">
          {searchStore.suggestions.data.map((item, index) => (
            <li
              key={index}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-white/5 ${index === searchStore.suggestions.index ? "bg-white/10 text-[#48e4ff]" : "text-zinc-300"}`}
              onMouseDown={(e) => {
                e.preventDefault();
                textToSearch(item);
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import React, { useEffect, useRef } from "react";
import {
  clearSuggestions,
  getSearchResults,
  getSearchSuggestions,
  playerStore,
  useSearchStore,
  setSearchStore,
  t,
} from "@stores";
import { idFromURL } from "@utils";
import { useConfig, drawer } from "@config";
import { player } from "@modules/playback";
import { cn } from "@components/common";

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
    <>
      <input
        value={searchStore.query}
        placeholder={t("search_placeholder")}
        type="search"
        ref={superInput}
        className="superInput"
        autoComplete="off"
        onPaste={async (e) => {
          const pastedText = e.clipboardData?.getData("text");
          const id = idFromURL(pastedText || "");
          const separators = ["\n", " ", ","];
          const isBulk = separators.find((separator) =>
            pastedText?.includes(separator),
          );

          if (!config.searchBarLinkCapture) return;

          if (!id && isBulk) {
            const array = pastedText
              ?.split(isBulk)
              .map(idFromURL)
              .filter((s) => s?.length === 11);
            if (superInput.current) superInput.current.value = "";
            if (array?.length)
              await import("@modules/bulkCapture").then((mod) =>
                mod.default(array as string[]),
              );
            return;
          }

          if (id && id !== playerStore.stream.id) {
            player(id);
            return;
          }
        }}
        onBlur={() => {
          clearTimeout(blurTimeout.current);
          blurTimeout.current = setTimeout(clearSuggestions, 150);
        }}
        onFocus={() => {
          clearTimeout(blurTimeout.current);
          if (searchStore.query) return;
          setSearchStore(
            "suggestions",
            "data",
            [...drawer.recentSearches].reverse(),
          );
        }}
        onChange={(e) => {
          const { value } = e.target;
          setSearchStore("query", value);

          if (!value) {
            clearSuggestions();
            setSearchStore(
              "suggestions",
              "data",
              [...drawer.recentSearches].reverse(),
            );
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
            setSearchStore(
              "suggestions",
              "index",
              index === -1 ? data.length - 1 : index - 1,
            );
          }

          if (e.key === "ArrowDown") {
            setSearchStore(
              "suggestions",
              "index",
              index === data.length ? -1 : index + 1,
            );
          }

          document
            .querySelectorAll("li.hover")[0]
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />
      {config.searchSuggestions && searchStore.suggestions.data.length > 0 && (
        <ul className="suggestions">
          {searchStore.suggestions.data.map((item, index) => (
            <li
              key={index}
              className={cn(index === searchStore.suggestions.index && "hover")}
              onMouseDown={(e) => {
                e.preventDefault();
                textToSearch(item);
              }}
              onClick={() => {
                textToSearch(item);
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

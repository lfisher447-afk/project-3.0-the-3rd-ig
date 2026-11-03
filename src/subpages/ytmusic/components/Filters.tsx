import React from "react";
import {
  getSearchResults,
  setSearchStore,
  updateParam,
  t,
} from "../store";
import { useConfig, setConfig } from "../config";

export default function Filters() {
  const config = useConfig();

  return (
    <select
      className="bg-zinc-800 border-none rounded-full py-1 px-4 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#48e4ff] cursor-pointer"
      onChange={(e) => {
        const { value } = e.target;
        setSearchStore({
          page: 1,
          results: [],
        });
        setConfig("searchFilter", value);
        updateParam("f", value);

        getSearchResults();
      }}
      value={config.searchFilter}
    >
      <option value="all">{t("search_filter_all") || "All"}</option>
      <option value="song">{t("search_filter_music_songs") || "Songs"}</option>
      <option value="album">{t("search_filter_music_albums") || "Albums"}</option>
      <option value="relevance">{t("search_filter_videos") || "Videos"}</option>
      <option value="playlist">{t("search_filter_playlists") || "Playlists"}</option>
      <option value="channel">{t("search_filter_channels") || "Channels"}</option>
      <option value="artist">{t("search_filter_music_artists") || "Artists"}</option>
    </select>
  );
}

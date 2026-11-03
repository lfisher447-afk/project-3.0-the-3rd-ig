import React from "react";
import {
  setStore,
  t,
  queueStore,
  setQueueStore,
} from "../store";
import { useConfig, setConfig } from "../config";

export default function Dropdown() {
  const config = useConfig();

  return (
    <div className="relative group">
      <i className="ri-more-2-fill text-xl text-zinc-400 hover:text-white cursor-pointer transition-colors p-2"></i>
      
      <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1 z-50 hidden group-hover:block">
        <button
          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${config.persistentShuffle ? "text-[#48e4ff]" : "text-zinc-300"}`}
          onClick={() => setConfig("persistentShuffle", !config.persistentShuffle)}
        >
          <span>{t("queue_persistent_shuffle") || "Persistent Shuffle"}</span>
          {config.persistentShuffle && <i className="ri-check-line"></i>}
        </button>

        <button
          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${config.similarContent ? "text-[#48e4ff]" : "text-zinc-300"}`}
          onClick={() => setConfig("similarContent", !config.similarContent)}
        >
          <span>{t("queue_similar_content") || "Similar Content"}</span>
          {config.similarContent && <i className="ri-check-line"></i>}
        </button>

        <button
          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-white/5 transition-colors ${config.authorGrouping ? "text-[#48e4ff]" : "text-zinc-300"}`}
          onClick={() => setConfig("authorGrouping", !config.authorGrouping)}
        >
          <span>{t("queue_author_grouping") || "Group by Author"}</span>
          {config.authorGrouping && <i className="ri-check-line"></i>}
        </button>

        <div className="h-[1px] bg-zinc-800 mx-2 my-1"></div>

        <button
          className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          onClick={() => {
            setQueueStore("list", []);
            setQueueStore("history", []);
          }}
        >
          {t("queue_clear") || "Clear Queue"}
        </button>
      </div>
    </div>
  );
}

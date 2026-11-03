import React, { useEffect, useRef } from "react";
import "../Queue.css";
import {
  useQueueStore,
  setNavStore,
  t,
  setQueueStore,
  totalQueueDuration,
} from "../store";
import Results from "../components/Results";
import Dropdown from "../components/Dropdown";
import HeaderNav from "../components/HeaderNav";
import { cn } from "../components/common";

export default function QueueFeature() {
  const queueSection = useRef<HTMLDivElement>(null);
  const queueStore = useQueueStore();

  useEffect(() => {
    if (queueSection.current) {
      setNavStore("queue", "ref", queueSection.current);
      queueSection.current.scrollIntoView();
    }
  }, []);

  const scrollToTop = () => {
    queueSection.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const durationStr = totalQueueDuration(queueStore.list);

  return (
    <section className="queueSection h-full bg-zinc-950 flex flex-col" ref={queueSection}>
      <header className="sticky-bar flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <HeaderNav
          title={
            <div className="flex items-center gap-3 cursor-pointer" onClick={scrollToTop}>
               <h2 className="text-xl font-bold text-white">
                 {queueStore.list.length === 0 ? (t("nav_queue" as any) || "Queue") : durationStr}
               </h2>
               {queueStore.list.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {queueStore.list.length} tracks
                  </span>
               )}
            </div>
          }
        />

        <div className="flex items-center gap-4">
          <i
            className="ri-shuffle-line text-xl text-zinc-400 hover:text-white cursor-pointer transition-colors"
            title={t("queue_shuffle" as any) || "Shuffle Queue"}
            onClick={() => {
              setQueueStore("list", (list: any[]) => {
                const shuffled = [...list];
                for (let i = shuffled.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                return shuffled;
              });
            }}
          ></i>

          <i
            className={cn(
              "text-xl cursor-pointer transition-colors ri-indeterminate-circle-line",
              queueStore.removeMode ? "text-red-500" : "text-zinc-400 hover:text-white"
            )}
            title={t("queue_remove_mode" as any) || "Remove Mode"}
            onClick={() => {
              setQueueStore("removeMode", !queueStore.removeMode);
            }}
          ></i>
          
          <Dropdown />
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-4">
        {!queueStore.isLoading ? (
          <Results items={queueStore.list} />
        ) : (
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <i className="ri-loader-3-line animate-spin text-3xl text-[#48e4ff]"></i>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Optimizing Queue...</p>
          </div>
        )}
      </div>
    </section>
  );
}

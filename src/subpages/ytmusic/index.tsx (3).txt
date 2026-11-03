import React, { useEffect, useRef } from "react";
import "./Queue.css";
import {
  useQueueStore,
  setNavStore,
  t,
  setQueueStore,
  totalQueueDuration,
} from "@stores";
import List from "./List";
import Dropdown from "./Dropdown";
import HeaderNav from "@components/HeaderNav";
import { cn } from "@components/common";

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
    <section className="queueSection" ref={queueSection}>
      <header className="sticky-bar">
        <HeaderNav
          title={
            <p onClick={scrollToTop} style={{ cursor: "pointer" }}>
              {queueStore.list.length === 0 ? t("nav_queue") : durationStr}
            </p>
          }
          extra={
            queueStore.list.length > 0 && (
              <span
                className="header-nav-badge queue-duration-badge"
                onClick={scrollToTop}
                style={{ cursor: "pointer" }}
              >
                {durationStr}
              </span>
            )
          }
        />
        <div className="right-group">
          <i
            className="ri-shuffle-line"
            aria-label={t("queue_shuffle")}
            onClick={() => {
              setQueueStore("list", (list: TrackItem[]) => {
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
              "ri-indeterminate-circle-line",
              queueStore.removeMode && "on",
            )}
            aria-label={t("queue_remove_mode")}
            onClick={() => {
              setQueueStore("removeMode", !queueStore.removeMode);
            }}
          ></i>
        </div>

        <Dropdown />
      </header>

      {!queueStore.isLoading ? (
        <List />
      ) : (
        <i className="ri-loader-3-line loading-spinner"></i>
      )}
    </section>
  );
}

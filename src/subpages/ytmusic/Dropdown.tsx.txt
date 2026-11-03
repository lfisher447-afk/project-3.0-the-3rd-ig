import React from "react";
import "./Queue.css";
import {
  setStore,
  t,
  addToQueue,
  queueStore,
  setQueueStore,
  groupQueueByAuthor,
} from "@stores";
import { useConfig, setConfig } from "@config";
import { cn } from "@components/common";

export default function Dropdown() {
  const config = useConfig();

  return (
    <details>
      <summary>
        <i aria-label="More Options" className="ri-more-2-fill"></i>
      </summary>
      <ul className="queuetools" onClick={(e) => e.stopPropagation()}>
        <li
          className={cn(config.persistentShuffle && "on")}
          onClick={(e) => {
            const val = !config.persistentShuffle;
            setConfig("persistentShuffle", val);
            (e.currentTarget as HTMLElement).classList.toggle("on");
          }}
        >
          {t("queue_persistent_shuffle")}
        </li>

        <li
          className={cn(Boolean(config.durationFilter) && "on")}
          onClick={(e) => {
            const val = config.durationFilter
              ? ""
              : prompt("Enter duration limit (e.g. 10:00)", "10:00");
            if (val !== null) {
              setConfig("durationFilter", val);
              addToQueue(queueStore.list, { replace: true });
              (e.currentTarget as HTMLElement).classList.toggle(
                "on",
                Boolean(val),
              );
            }
          }}
        >
          {t("queue_duration_filter")}
        </li>

        <li
          className={cn(config.similarContent && "on")}
          onClick={(e) => {
            setConfig("similarContent", !config.similarContent);
            setStore("snackbar", t("queue_change_notification"));
            (e.currentTarget as HTMLElement).classList.toggle("on");
          }}
        >
          {t("queue_similar_content")}
        </li>

        <li
          className={cn(config.contextualFill && "on")}
          onClick={(e) => {
            setConfig("contextualFill", !config.contextualFill);
            (e.currentTarget as HTMLElement).classList.toggle("on");
          }}
        >
          {t("queue_contextual_fill")}
        </li>

        <li
          className={cn(config.authorGrouping && "on")}
          onClick={(e) => {
            const authorGrouping = !config.authorGrouping;
            setConfig("authorGrouping", authorGrouping);
            (e.currentTarget as HTMLElement).classList.toggle("on");
            if (authorGrouping) {
              setQueueStore("list", (list: TrackItem[]) => groupQueueByAuthor(list));
            }
          }}
        >
          {t("queue_author_grouping")}
        </li>

        <li
          onClick={() => {
            setQueueStore("list", []);
            setQueueStore("history", []);
          }}
        >
          {t("queue_clear")}
        </li>
      </ul>
    </details>
  );
}

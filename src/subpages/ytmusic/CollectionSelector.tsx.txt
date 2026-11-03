import React from "react";
import { useConfig } from "@config";
import {
  addToCollection,
  CACHED_COLLECTION,
  createCollection,
  getCollection,
  getCollectionsKeys,
  removeFromCollection,
} from "@modules/library";
import { t } from "@stores";

export default function CollectionSelector(_: {
  close?: () => void;
  data: TrackItem[];
}) {
  const config = useConfig();

  const handleCollectionChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { value } = e.target;
    const isNew = value === "+cl";
    let title: string | null | undefined;

    if (!value) return;

    if (isNew) {
      title = prompt("Collection Title ?")?.trim();

      if (title) {
        createCollection(title);
      }
    } else title = value;

    if (title && _.data) {
      if (title.startsWith("-cl"))
        removeFromCollection(
          value.slice(3),
          _.data.map((item) => item.id),
        );
      else addToCollection(title, _.data);
    }

    if (_.close) _.close();
    e.target.selectedIndex = 0;
  };

  const getKeys = (add: boolean) => {
    if (!_.data || _.data.length === 0) {
      return [];
    }

    const keys =
      config.cachingMode === "off"
        ? getCollectionsKeys()
        : [...getCollectionsKeys(), CACHED_COLLECTION];

    return keys.filter((k) => {
      const itemIsIncluded = getCollection(k).includes(_.data[0].id);
      return add ? !itemIsIncluded : itemIsIncluded;
    });
  };

  const label = (key: string) =>
    key === CACHED_COLLECTION ? t("hub_cached") : key;

  const addKeys = getKeys(true);
  const removeKeys = getKeys(false);

  return (
    <select
      className="ri-play-list-add-fill"
      id="collectionSelector"
      onChange={handleCollectionChange}
      defaultValue=""
      aria-label={t("collection_selector_add_to")}
    >
      <option value="" disabled>
        &#xf00e;
      </option>
      <option value="+cl">{t("collection_selector_create_new")}</option>
      {addKeys.length > 0 && (
        <optgroup label="Add to Collection">
          {addKeys.map((v) => (
            <option key={v} value={v}>
              {label(v)}
            </option>
          ))}
        </optgroup>
      )}
      {removeKeys.length > 0 && (
        <optgroup label="Remove from Collection">
          {removeKeys.map((v) => (
            <option key={v} value={"-cl" + v}>
              {label(v)}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

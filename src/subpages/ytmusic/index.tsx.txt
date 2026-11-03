import React, { useEffect, useRef, Suspense, lazy } from "react";
import "./Search.css";
import Results from "./Results";
import Input from "./Input";
import { useSearchStore, t, setNavStore } from "@stores";
import Filters from "./Filters";
import HeaderNav from "@components/HeaderNav";
import HeaderActions from "@components/HeaderActions";

const DiscoveryHub = lazy(() => import("./DiscoveryHub"));

export default function SearchFeature() {
  const searchStore = useSearchStore();
  const searchRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (searchRef.current) {
      setNavStore("search", "ref", searchRef.current);
      searchRef.current.scrollIntoView();
    }
  }, []);

  return (
    <section className="search" ref={searchRef}>
      <header className="sticky-bar">
        <HeaderNav title={<p>{t("nav_search")}</p>} />
        <HeaderActions />
      </header>

      <form className="superInputContainer" onSubmit={(e) => e.preventDefault()}>
        <Input />
        <Filters />
      </form>

      {searchStore.query || searchStore.results.length > 0 ? (
        <Results />
      ) : (
        <Suspense fallback={null}>
          <DiscoveryHub />
        </Suspense>
      )}
    </section>
  );
}

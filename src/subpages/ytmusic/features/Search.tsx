import React, { useEffect, useRef, Suspense, lazy } from "react";
import "../Search.css";
import Results from "../components/Results";
import Input from "../components/Input";
import { useSearchStore, t, setNavStore } from "../store";
import Filters from "../components/Filters";
import HeaderNav from "../components/HeaderNav";
import HeaderActions from "../components/HeaderActions";

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
      <header className="sticky-bar flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <HeaderNav title={<p>{t("nav_search") || "Search"}</p>} />
        <HeaderActions />
      </header>

      <div className="flex-grow overflow-y-auto">
        <form className="superInputContainer sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md pb-4 border-b border-zinc-900/50" onSubmit={(e) => e.preventDefault()}>
          <Input />
          <Filters />
        </form>

        {searchStore.query || searchStore.results.length > 0 ? (
          <Results items={searchStore.results} />
        ) : (
          <Suspense fallback={<div className="p-10 text-zinc-500 text-center">Loading Discovery Hub...</div>}>
            <DiscoveryHub />
          </Suspense>
        )}
      </div>
    </section>
  );
}

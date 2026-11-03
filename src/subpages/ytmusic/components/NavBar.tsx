import React from "react";
import { useNavStore, setNavStore, type MainFeature } from "../store";

export default function NavBar() {
  const navStore = useNavStore();

  const NavItem = ({ feature, icon, label }: { feature: MainFeature; icon: string; label: string }) => {
    const active = navStore.active === feature;
    return (
      <button
        onClick={() => setNavStore("active", feature)}
        className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors py-2 ${active ? "text-[#48e4ff]" : "text-zinc-500 hover:text-zinc-300"}`}
      >
        <i className={`${icon}${active ? "-fill" : "-line"} text-xl`}></i>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </button>
    );
  };

  return (
    <nav className="h-16 flex items-center justify-around px-2 w-full">
      <NavItem feature="search" icon="ri-search-2" label="Search" />
      <NavItem feature="library" icon="ri-library" label="Library" />
      <NavItem feature="queue" icon="ri-list-ordered" label="Queue" />
      <NavItem feature="settings" icon="ri-settings-4" label="Settings" />
    </nav>
  );
}

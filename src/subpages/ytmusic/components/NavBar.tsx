import React from "react";
import { Search, Library, ListMusic, Settings, Flame } from "lucide-react";
import { useNavStore, setNavStore, type MainFeature } from "../store";

export default function NavBar() {
  const navStore = useNavStore();

  const navItems: { feature: MainFeature; label: string; icon: React.ReactNode }[] = [
    { feature: "search", label: "Search", icon: <Search size={18} /> },
    { feature: "library", label: "Library", icon: <Library size={18} /> },
    { feature: "queue", label: "Queue", icon: <ListMusic size={18} /> },
    { feature: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <nav className="h-14 flex items-center justify-around px-4 w-full border-t border-zinc-900 bg-zinc-950/90 backdrop-blur-md">
      {navItems.map((item) => {
        const active = navStore.active === item.feature;
        return (
          <button
            key={item.feature}
            onClick={() => setNavStore("active", item.feature)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors cursor-pointer ${
              active ? "text-[#48e4ff]" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

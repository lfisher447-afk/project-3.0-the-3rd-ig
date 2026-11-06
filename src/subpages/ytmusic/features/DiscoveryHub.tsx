import React from "react";
import { t, openSubView, setNavStore } from "../store";

export default function DiscoveryHub() {
  const sections = [
    { title: "Trending", icon: "ri-fire-line", color: "text-orange-500" },
    { title: "New Releases", icon: "ri-disc-line", color: "text-blue-500" },
    { title: "Moods & Genres", icon: "ri-empathize-line", color: "text-purple-500" },
    { title: "Charts", icon: "ri-bar-chart-line", color: "text-green-500" },
  ];

  const handleSectionClick = (searchTerm: string) => {
    const input = document.querySelector('input[type="search"]') as HTMLInputElement;
    if (input) {
      input.value = searchTerm;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const form = input.closest('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  };

  return (
    <div className="discovery-hub py-4 px-2 space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sections.map((section) => (
          <div 
            key={section.title}
            onClick={() => handleSectionClick(section.title === 'Trending' ? 'Trending Music 2026' : section.title === 'New Releases' ? 'New Music 2026' : section.title === 'Moods & Genres' ? 'Chill Lo-Fi Hip Hop' : 'Billboard Top 50')}
            className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-cyan-500/40 hover:bg-zinc-800/60 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <i className={`${section.icon} ${section.color} text-2xl mb-2 block group-hover:scale-110 transition-transform`}></i>
            <h3 className="text-xs font-bold text-white tracking-wide">{section.title}</h3>
            <span className="text-[10px] text-zinc-500 mt-0.5 group-hover:text-cyan-400">Explore mix</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white px-1">Your Library</h2>
        <div 
          className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          onClick={() => setNavStore("active", "library")}
        >
          <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-xl text-zinc-500">
            <i className="ri-heart-fill text-[#48e4ff]"></i>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">Liked Songs</h4>
            <p className="text-xs text-zinc-500">Auto-generated playlist</p>
          </div>
        </div>
      </div>
    </div>
  );
}

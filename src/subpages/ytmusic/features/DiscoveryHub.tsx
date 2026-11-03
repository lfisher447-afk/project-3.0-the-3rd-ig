import React from "react";
import { t, openSubView, setNavStore } from "../store";

export default function DiscoveryHub() {
  const sections = [
    { title: "Trending", icon: "ri-fire-line", color: "text-orange-500" },
    { title: "New Releases", icon: "ri-disc-line", color: "text-blue-500" },
    { title: "Moods & Genres", icon: "ri-empathize-line", color: "text-purple-500" },
    { title: "Charts", icon: "ri-bar-chart-line", color: "text-green-500" },
  ];

  return (
    <div className="discovery-hub py-6 space-y-8">
      <div className="grid grid-cols-2 gap-4">
        {sections.map((section) => (
          <div 
            key={section.title}
            className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
          >
            <i className={`${section.icon} ${section.color} text-3xl mb-3 block group-hover:scale-110 transition-transform`}></i>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{section.title}</h3>
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

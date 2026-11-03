import React, { useEffect, useRef } from "react";
import "../Settings.css";
import { setNavStore, t, setStore, updateLang, closeSubView } from "../store";
import { Selector } from "../components/Selector";
import {
  useCachingMode,
  useConfig,
  setConfig,
  setPlayerBackground,
  usePlayerBackground,
  type CachingMode,
  type PlayerBackground,
} from "../config";
import {
  setCachingMode,
} from "../modules/library";
import { quickSwitch } from "../modules/playback";
import { themer } from "../modules/theme";
import Dropdown from "../components/Dropdown";
import { cn } from "../components/common";

export default function SettingsFeature() {
  const settingsSection = useRef<HTMLDivElement>(null);
  const config = useConfig();
  const caching = useCachingMode();
  const playerBg = usePlayerBackground();

  useEffect(() => {
    if (settingsSection.current) {
      setNavStore("settings", "ref", settingsSection.current);
      settingsSection.current.scrollIntoView();
    }
  }, []);

  useEffect(() => {
    updateLang();
  }, [config.language]);

  const Toggle = (props: {
    name: string;
    checked: boolean;
    onClick: (e: React.MouseEvent) => void;
  }) => {
    return (
      <div 
        className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer rounded-xl"
        onClick={props.onClick}
      >
        <label className="text-sm font-medium text-zinc-300 cursor-pointer">{t(props.name as any) || props.name}</label>
        <i className={`text-2xl transition-colors ${props.checked ? "ri-toggle-fill text-[#48e4ff]" : "ri-toggle-line text-zinc-600"}`}></i>
      </div>
    );
  };

  return (
    <section ref={settingsSection} className="settingsSection h-full bg-zinc-950 flex flex-col">
      <header className="flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <h2 className="text-xl font-bold text-white">{t("nav_settings" as any) || "Settings"}</h2>
        <div className="flex items-center gap-4">
          <i
            aria-label={t("close" as any)}
            className="ri-close-large-line text-xl text-zinc-400 hover:text-white cursor-pointer transition-colors"
            onClick={closeSubView}
          ></i>
          <Dropdown />
        </div>
      </header>
      
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Playback</h3>
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-2">
              <Toggle
                name="settings_stable_volume"
                checked={Boolean(config.stableVolume)}
                onClick={() => {
                  setConfig("stableVolume", !config.stableVolume);
                  quickSwitch();
                }}
              />

              <Toggle
                name="settings_watchmode"
                checked={Boolean(config.watchMode)}
                onClick={() => {
                  setConfig("watchMode", config.watchMode ? "" : "144p");
                }}
              />

              <Toggle
                name="settings_sponsorblock"
                checked={Boolean(config.sponsorblock)}
                onClick={() => {
                  setConfig("sponsorblock", !config.sponsorblock);
                }}
              />
            </div>
        </div>

        <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Performance & Style</h3>
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-2 space-y-1">
              <Selector
                label="settings_audio_quality"
                id="qualityPreference"
                onchange={(e) => {
                    setConfig("quality", e.target.value as any);
                    quickSwitch();
                }}
                value={config.quality}
              >
                <option value="worst">Worst</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Selector>

              <Selector
                label="settings_player_background"
                id="playerBackgroundSelector"
                onchange={(e) => setPlayerBackground(e.target.value as any)}
                value={playerBg}
              >
                <option value="none">None</option>
                <option value="frost">Frost</option>
                <option value="frost-motion">Frost Motion</option>
                <option value="blur">Blur</option>
                <option value="blur-motion">Blur Motion</option>
              </Selector>
              
              <Selector
                label="settings_caching_mode"
                id="cachingModeSelector"
                onchange={(e) => setCachingMode(e.target.value as any)}
                value={caching}
              >
                <option value="auto">Auto</option>
                <option value="on-demand">On Demand</option>
                <option value="off">Off</option>
              </Selector>
            </div>
        </div>

        <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Library</h3>
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-2">
                <Toggle
                    name="settings_store_history"
                    checked={config.history}
                    onClick={() => {
                        setConfig("history", !config.history);
                    }}
                />
            </div>
        </div>

        <div className="pt-8 text-center space-y-4">
           <button 
             onClick={() => {
                 setConfig("hasCompletedBoot", false);
                 window.location.reload();
             }}
             className="px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400 hover:text-white transition-colors"
           >
             Re-run System Boot
           </button>
           <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.2em]">YTify Core Engine • v2.4.0</p>
        </div>
      </div>
    </section>
  );
}

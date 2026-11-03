import React, { useEffect, useState } from "react";
import { setConfig } from "../config";

export default function BootOS({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);
  const stages = [
    "Initializing YTify Engine...",
    "Connecting to InnerTube Edge...",
    "Securing sabr-stream tunnel...",
    "Loading user profile...",
    "Ready."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((s) => {
        if (s >= stages.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            setConfig("hasCompletedBoot", true);
            setConfig("hasCompletedSetup", true);
            onComplete();
          }, 500);
          return s;
        }
        return s + 1;
      });
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[1000] flex flex-col items-center justify-center text-[#48e4ff] font-mono">
      <div className="text-4xl mb-8 animate-pulse">
        <i className="ri-music-2-fill"></i>
      </div>
      <div className="text-xs uppercase tracking-[0.3em] mb-4">YTify System Boot</div>
      <div className="text-[10px] opacity-60 h-4">{stages[stage]}</div>
      <div className="mt-8 w-48 h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#48e4ff] transition-all duration-300"
          style={{ width: `${(stage / (stages.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

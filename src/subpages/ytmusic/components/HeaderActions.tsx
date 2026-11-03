import React from "react";
import { setNavStore } from "../store";

export default function HeaderActions() {
  return (
    <div className="flex items-center gap-3">
      <i 
        className="ri-settings-4-line text-xl text-zinc-400 hover:text-white cursor-pointer transition-colors"
        onClick={() => setNavStore("active", "settings")}
      ></i>
    </div>
  );
}

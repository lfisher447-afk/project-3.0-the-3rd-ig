import React from "react";
import { setNavStore, setStore } from "../store";

export const handleNavClick = (view: string) => {
  setNavStore("active", view as any);
  setNavStore("player", "state", false);
};

export default function HeaderNav({ title }: { title: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-xl font-bold text-white">
        {title}
      </div>
    </div>
  );
}

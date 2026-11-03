import React from "react";
import { t } from "../store";

export const Selector: React.FC<{
  label: string;
  id: string;
  value: string;
  onchange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}> = ({ label, id, value, onchange, children }) => {
  return (
    <div className="flex flex-col gap-1 p-4 hover:bg-white/5 transition-colors rounded-xl">
      <label htmlFor={id} className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
        {t(label as any) || label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onchange}
        className="w-full bg-zinc-800 border-none rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-[#48e4ff] appearance-none"
      >
        {children}
      </select>
    </div>
  );
};

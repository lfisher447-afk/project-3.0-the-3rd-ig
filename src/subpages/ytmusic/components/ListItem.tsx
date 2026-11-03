import React from "react";
import { getList } from "../store";

export interface ListItemProps {
  id: string;
  name: string;
  img?: string;
  type: "artist" | "album" | "playlist" | "channel";
  author?: string;
  year?: string;
}

export default function ListItem(props: ListItemProps) {
  return (
    <div 
      className="flex flex-col gap-2 min-w-[140px] max-w-[140px] cursor-pointer group"
      onClick={() => getList(props.id, props.type)}
    >
      <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 shadow-lg group-hover:scale-105 transition-transform duration-500">
        <img 
          src={props.img || `https://i.ytimg.com/vi/${props.id}/mqdefault.jpg`} 
          alt={props.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="px-1">
        <h4 className="text-sm font-bold text-white truncate group-hover:text-[#48e4ff] transition-colors">{props.name}</h4>
        <p className="text-xs text-zinc-500 truncate">
          {props.type === "artist" ? "Artist" : props.author || (props.year ? `Album • ${props.year}` : "Collection")}
        </p>
      </div>
    </div>
  );
}

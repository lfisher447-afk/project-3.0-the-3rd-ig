import React, { useEffect } from "react";
import { useAppStore, setStore } from "../store";

export default function SnackBar() {
  const store = useAppStore();

  useEffect(() => {
    if (store.snackbar) {
      const timer = setTimeout(() => {
        setStore("snackbar", "");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [store.snackbar]);

  if (!store.snackbar) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#48e4ff] text-black rounded-full font-bold text-sm shadow-2xl z-[100] animate-bounce whitespace-nowrap">
      {store.snackbar}
    </div>
  );
}

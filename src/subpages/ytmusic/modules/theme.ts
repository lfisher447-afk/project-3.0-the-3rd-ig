import { config } from "../config";

export function themer() {
  const theme = config.theme === "auto" 
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : config.theme;
    
  document.documentElement.setAttribute("data-theme", theme);
  
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function cssVar(name: string, value?: string) {
  if (value !== undefined) {
    document.documentElement.style.setProperty(name, value);
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

export function applyPanelRatio(ratio: string) {
  const [left, right] = ratio.split(":").map(Number);
  const total = left + right;
  const leftPercent = (left / total) * 100;
  cssVar("--left-panel-width", `${leftPercent}%`);
}

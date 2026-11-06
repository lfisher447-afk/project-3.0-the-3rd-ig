import { Innertube, YTNodes, Parser, type Helpers } from "youtubei.js";

// Handle/suppress unrecognized YT renderer warnings safely
// Handle/suppress unrecognized YT renderer warnings safely without crashing
Parser.setParserErrorHandler((error: any) => {
  // Silently ignore newly introduced YouTube view nodes (e.g. OfficialCardView, HorizontalShelfView, CtaCarouselItemView)
  return;
});

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function convertSStoHHMMSS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseDuration(duration?: string): number {
  if (!duration) return 0;
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

export function isTopicAuthor(author?: string): boolean {
  return author?.endsWith(" - Topic") || false;
}

export function normalizeAuthorKey(author?: string): string {
  if (!author) return "";
  return author.replace(" - Topic", "").toLowerCase().trim();
}

export function pickImage(newImg?: string, oldImg?: string, fallbackId?: string): string {
  if (newImg && !newImg.includes("maxresdefault")) return newImg;
  if (oldImg && !oldImg.includes("maxresdefault")) return oldImg;
  if (fallbackId) return `https://i.ytimg.com/vi/${fallbackId}/mqdefault.jpg`;
  return "";
}

export function withTopicSuffix(author?: string): string {
  if (!author) return "";
  if (isTopicAuthor(author)) return author;
  return `${author} - Topic`;
}

export function stripTopic(author?: string): string {
  if (!author) return "";
  return author.replace(" - Topic", "");
}

export function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function generateImageUrl(id?: string, size: "120" | "544" | "720" = "544"): string | null {
  if (!id) return null;
  if (id.startsWith("/")) {
    return `https://yt3.ggpht.com${id}=s${size}-c-k-c0x00ffffff-no-rj`;
  }
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

export function sortCollection(items: TrackItem[], sortBy: string, sortOrder: "asc" | "desc"): TrackItem[] {
  const sorted = [...items].sort((a, b) => {
    let valA: any = "";
    let valB: any = "";
    switch (sortBy) {
      case "name":
        valA = a.title;
        valB = b.title;
        break;
      case "artist":
        valA = a.author;
        valB = b.author;
        break;
      case "duration":
        valA = parseDuration(a.duration);
        valB = parseDuration(b.duration);
        break;
      case "modified":
      default:
        valA = a.modified || 0;
        valB = b.modified || 0;
        break;
    }
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function lsGetJSON<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function lsSetJSON<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function formatDuration(durationText?: string): string {
  if (durationText?.length === 4) durationText = "0" + durationText;
  return durationText || "00:00";
}

export function formatThumbnailId(rawUrl?: string): string {
  if (!rawUrl) return "";
  if (rawUrl.includes("vi/")) {
    return rawUrl.split("/vi/")[1]?.split("/")[0] || "";
  }
  try {
    const urlObj = new URL(rawUrl);
    const segments = urlObj.pathname.split("/").filter(Boolean);
    const id = segments.pop()?.split("=")[0] || "";
    return segments.length ? "/" + [...segments, id].join("/") : id;
  } catch {
    return rawUrl.split("/").pop()?.split("=")[0] || "";
  }
}

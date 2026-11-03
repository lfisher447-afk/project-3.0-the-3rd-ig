import { audioEngine } from "../../../lib/audioEngine";
import { playerStore, setPlayerStore } from "../store";

export async function player(id: string) {
  if (!id) return;
  
  setPlayerStore("status", "Loading...");
  setPlayerStore("playbackState", "loading");

  try {
    const response = await fetch(`/api/ytmusic/video-stream?id=${id}`);
    if (!response.ok) throw new Error("Failed to fetch stream");
    
    const data = await response.json();
    const streamUrl = data.adaptiveFormats?.find((f: any) => f.type.includes("audio"))?.url || data.url;

    if (streamUrl) {
      const track = {
        id: playerStore.stream.id,
        title: playerStore.stream.title,
        artist: playerStore.stream.author,
        album: playerStore.stream.albumTitle || "YouTube Music",
        duration: 0,
        source: "youtube" as const,
        addedAt: Date.now(),
        streamUrl: streamUrl,
        artwork: playerStore.mediaArtwork
      };
      
      await audioEngine.playTrack(track);
      setPlayerStore("playbackState", "playing");
      setPlayerStore("status", "");
    }
  } catch (error) {
    console.error("Playback error:", error);
    setPlayerStore("status", "Error loading stream");
    setPlayerStore("playbackState", "none");
  }
}

export function quickSwitch() {
  const { stream } = playerStore;
  if (stream.id) {
    player(stream.id);
  }
}

export const playback = {
  player,
  quickSwitch
};

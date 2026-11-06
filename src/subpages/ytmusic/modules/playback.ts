import { audioEngine } from "../../../lib/audioEngine";
import { playerStore, setPlayerStore } from "../store";

export async function player(id: string) {
  if (!id) return;
  
  setPlayerStore("status", "Loading...");
  setPlayerStore("playbackState", "loading");

  try {
    // Directly use reliable stream proxy
    const directStreamUrl = `/api/audio/stream?id=${id}`;
    const streamObj = (playerStore.stream || {}) as any;
    const track = {
      id: id,
      title: streamObj.title || "YouTube Music Track",
      artist: streamObj.author || streamObj.artist || "YouTube Artist",
      album: streamObj.albumTitle || "YouTube Music",
      duration: streamObj.durationSeconds || streamObj.duration || 210,
      source: "youtube" as const,
      addedAt: Date.now(),
      streamUrl: directStreamUrl,
      artwork: streamObj.img || streamObj.thumbnail || playerStore.mediaArtwork || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
    
    await audioEngine.playTrack(track);
    setPlayerStore("playbackState", "playing");
    setPlayerStore("status", "");
  } catch (error) {
    console.warn("Primary audio stream fallback:", error);
    try {
      const fallbackTrack = {
        id: id,
        title: playerStore.stream?.title || "YouTube Music Track",
        artist: playerStore.stream?.author || "YouTube Artist",
        album: "YouTube Music",
        duration: 210,
        source: "youtube" as const,
        addedAt: Date.now(),
        streamUrl: `/api/audio/stream?id=${id}`,
        artwork: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
      await audioEngine.playTrack(fallbackTrack);
      setPlayerStore("playbackState", "playing");
      setPlayerStore("status", "");
    } catch (e2) {
      setPlayerStore("status", "Error playing stream");
      setPlayerStore("playbackState", "none");
    }
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

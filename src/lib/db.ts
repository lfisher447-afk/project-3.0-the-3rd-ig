import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Track, Playlist, AppSettings } from '../types';
import { EQPresetDef } from './eqConfig';

export interface CachedAudioRecord {
  id: string; // trackId
  blob: Blob;
  mimeType: string;
  size: number;
  cachedAt: number;
  lastAccessed: number;
  duration?: number;
}

export interface PlayHistoryRecord {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  artwork?: string;
  playedAt: number;
  completedRatio: number;
  duration: number;
}

export interface SyncQueueItem {
  id: string;
  action: 'UPSERT_TRACK' | 'DELETE_TRACK' | 'UPSERT_PLAYLIST' | 'DELETE_PLAYLIST' | 'SAVE_SETTINGS' | 'SAVE_EQ_PRESET';
  payload: any;
  queuedAt: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface DetailedStorageMetrics {
  totalUsageMB: string;
  quotaMB: string;
  percent: string;
  audioCacheMB: string;
  audioCacheCount: number;
  tracksCount: number;
  playlistsCount: number;
  presetsCount: number;
  historyCount: number;
}

interface SpotuiDB extends DBSchema {
  tracks: {
    key: string;
    value: Track;
    indexes: {
      'by-source': string;
      'by-added': number;
      'by-liked': string; // 'true' | 'false'
      'by-title': string;
    };
  };
  audio_blobs: {
    key: string;
    value: CachedAudioRecord;
    indexes: {
      'by-cached-at': number;
      'by-last-accessed': number;
      'by-size': number;
    };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: {
      'by-created': number;
      'by-source': string;
    };
  };
  eq_presets: {
    key: string;
    value: EQPresetDef;
    indexes: {
      'by-band-count': number;
      'by-created': number;
    };
  };
  play_history: {
    key: string;
    value: PlayHistoryRecord;
    indexes: {
      'by-played-at': number;
      'by-track-id': string;
    };
  };
  cloud_sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: {
      'by-queued-at': number;
      'by-status': string;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'spotui-signal-room-v3';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<SpotuiDB>> | null = null;

// Reactive DB Event Emitter for instant UI re-renders
type DBEvent = 'tracks-changed' | 'playlists-changed' | 'audio-cached' | 'presets-changed' | 'history-changed' | 'sync-queue-changed';
type DBEventListener = (event: DBEvent, payload?: any) => void;
const listeners: Set<DBEventListener> = new Set();

export function onDBChange(listener: DBEventListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitDBChange(event: DBEvent, payload?: any) {
  listeners.forEach((fn) => {
    try {
      fn(event, payload);
    } catch (e) {
      console.warn('[DB Event Dispatch Error]:', e);
    }
  });
}

export function getDB(): Promise<IDBPDatabase<SpotuiDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SpotuiDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, tx) {
        // 1. Tracks Store
        if (!db.objectStoreNames.contains('tracks')) {
          const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
          trackStore.createIndex('by-source', 'source');
          trackStore.createIndex('by-added', 'addedAt');
          trackStore.createIndex('by-liked', 'liked');
          trackStore.createIndex('by-title', 'title');
        } else if (oldVersion < 2) {
          const trackStore = tx.objectStore('tracks');
          if (!trackStore.indexNames.contains('by-liked')) {
            trackStore.createIndex('by-liked', 'liked');
          }
          if (!trackStore.indexNames.contains('by-title')) {
            trackStore.createIndex('by-title', 'title');
          }
        }

        // 2. Audio Blobs (Dedicated Offline Binary Cache)
        if (!db.objectStoreNames.contains('audio_blobs')) {
          const audioStore = db.createObjectStore('audio_blobs', { keyPath: 'id' });
          audioStore.createIndex('by-cached-at', 'cachedAt');
          audioStore.createIndex('by-last-accessed', 'lastAccessed');
          audioStore.createIndex('by-size', 'size');
        }

        // 3. Playlists Store
        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistStore.createIndex('by-created', 'createdAt');
          playlistStore.createIndex('by-source', 'source');
        }

        // 4. Dedicated EQ Presets Store
        if (!db.objectStoreNames.contains('eq_presets')) {
          const eqStore = db.createObjectStore('eq_presets', { keyPath: 'id' });
          eqStore.createIndex('by-band-count', 'bandCount');
          eqStore.createIndex('by-created', 'createdAt');
        }

        // 5. Play History Store
        if (!db.objectStoreNames.contains('play_history')) {
          const historyStore = db.createObjectStore('play_history', { keyPath: 'id' });
          historyStore.createIndex('by-played-at', 'playedAt');
          historyStore.createIndex('by-track-id', 'trackId');
        }

        // 6. Cloud Sync Queue Store (Offline Outbox)
        if (!db.objectStoreNames.contains('cloud_sync_queue')) {
          const syncStore = db.createObjectStore('cloud_sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by-queued-at', 'queuedAt');
          syncStore.createIndex('by-status', 'status');
        }

        // 7. Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// ============================================================================
// TRACKS REPOSITORY (Ultra-Fast CRUD & Filtering)
// ============================================================================

export async function saveTrack(track: Track): Promise<void> {
  const db = await getDB();
  await db.put('tracks', track);
  emitDBChange('tracks-changed', { trackId: track.id, action: 'save' });
}

export async function saveTracksBatch(tracks: Track[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('tracks', 'readwrite');
  for (const track of tracks) {
    await tx.store.put(track);
  }
  await tx.done;
  emitDBChange('tracks-changed', { count: tracks.length, action: 'batch-save' });
}

export async function getTrack(id: string): Promise<Track | undefined> {
  const db = await getDB();
  return db.get('tracks', id);
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB();
  return db.getAllFromIndex('tracks', 'by-added');
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tracks', id);
  // Also clean up any cached audio blob for this track
  await removeCachedAudioBlob(id).catch(() => {});
  emitDBChange('tracks-changed', { trackId: id, action: 'delete' });
}

export async function toggleLikeTrack(id: string): Promise<boolean> {
  const db = await getDB();
  const track = await db.get('tracks', id);
  if (!track) return false;
  track.liked = !track.liked;
  await db.put('tracks', track);
  emitDBChange('tracks-changed', { trackId: id, liked: track.liked });
  return track.liked;
}

// ============================================================================
// DEDICATED AUDIO BINARY CACHE (Offline Playback System)
// ============================================================================

export async function cacheAudioBlob(trackId: string, blob: Blob, mimeType = 'audio/mpeg', duration = 0): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  const record: CachedAudioRecord = {
    id: trackId,
    blob,
    mimeType: blob.type || mimeType,
    size: blob.size,
    cachedAt: now,
    lastAccessed: now,
    duration,
  };
  await db.put('audio_blobs', record);
  emitDBChange('audio-cached', { trackId, size: blob.size });
}

export async function getCachedAudioBlob(trackId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    const record = await db.get('audio_blobs', trackId);
    if (!record || !record.blob) return null;

    // Update last accessed in background for LRU management
    record.lastAccessed = Date.now();
    db.put('audio_blobs', record).catch(() => {});

    return record.blob;
  } catch (e) {
    console.warn('[IndexedDB getCachedAudioBlob error]:', e);
    return null;
  }
}

export async function hasCachedAudio(trackId: string): Promise<boolean> {
  const db = await getDB();
  const key = await db.getKey('audio_blobs', trackId);
  return key !== undefined;
}

export async function removeCachedAudioBlob(trackId: string): Promise<void> {
  const db = await getDB();
  await db.delete('audio_blobs', trackId);
  emitDBChange('audio-cached', { trackId, action: 'removed' });
}

export async function getAllCachedAudioIds(): Promise<string[]> {
  const db = await getDB();
  const keys = await db.getAllKeys('audio_blobs');
  return keys as string[];
}

export async function clearAllCachedAudio(): Promise<number> {
  const db = await getDB();
  const count = await db.count('audio_blobs');
  await db.clear('audio_blobs');
  emitDBChange('audio-cached', { action: 'cleared', count });
  return count;
}

// Evict least-recently-used audio blobs if total cache exceeds byte quota
export async function evictLruAudioCache(maxBytes = 250 * 1024 * 1024): Promise<number> {
  const db = await getDB();
  const allRecords = await db.getAllFromIndex('audio_blobs', 'by-last-accessed');
  let totalBytes = allRecords.reduce((acc, r) => acc + (r.size || 0), 0);

  let evictedCount = 0;
  if (totalBytes > maxBytes) {
    const tx = db.transaction('audio_blobs', 'readwrite');
    for (const record of allRecords) {
      if (totalBytes <= maxBytes) break;
      await tx.store.delete(record.id);
      totalBytes -= (record.size || 0);
      evictedCount++;
    }
    await tx.done;
  }
  return evictedCount;
}

// ============================================================================
// PLAYLISTS REPOSITORY
// ============================================================================

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put('playlists', playlist);
  emitDBChange('playlists-changed', { playlistId: playlist.id, action: 'save' });
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll('playlists');
}

export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const db = await getDB();
  return db.get('playlists', id);
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', id);
  emitDBChange('playlists-changed', { playlistId: id, action: 'delete' });
}

// ============================================================================
// DEDICATED EQ PRESETS REPOSITORY (Custom Curves & Hardware Profiles)
// ============================================================================

export async function saveEqPreset(preset: EQPresetDef): Promise<void> {
  const db = await getDB();
  const now = Date.now();
  const record: EQPresetDef = {
    ...preset,
    id: preset.id || `eq_custom_${now}`,
    isCustom: true,
    createdAt: preset.createdAt || now,
  };
  await db.put('eq_presets', record);
  emitDBChange('presets-changed', { presetId: record.id });
}

export async function getAllEqPresets(): Promise<EQPresetDef[]> {
  const db = await getDB();
  return db.getAll('eq_presets');
}

export async function deleteEqPreset(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('eq_presets', id);
  emitDBChange('presets-changed', { presetId: id, action: 'delete' });
}

// ============================================================================
// PLAY HISTORY REPOSITORY
// ============================================================================

export async function recordPlayHistory(track: Track, completedRatio = 1.0): Promise<void> {
  try {
    const db = await getDB();
    const now = Date.now();
    const id = `hist_${now}_${track.id}`;
    const record: PlayHistoryRecord = {
      id,
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      artwork: track.artwork,
      playedAt: now,
      completedRatio: Math.max(0, Math.min(1, completedRatio)),
      duration: track.duration,
    };
    await db.put('play_history', record);
    emitDBChange('history-changed', { id });
  } catch (err) {
    console.warn('[recordPlayHistory error]:', err);
  }
}

export async function getPlayHistory(limit = 100): Promise<PlayHistoryRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('play_history', 'by-played-at');
  return all.reverse().slice(0, limit);
}

export async function clearPlayHistory(): Promise<void> {
  const db = await getDB();
  await db.clear('play_history');
  emitDBChange('history-changed', { action: 'cleared' });
}

// ============================================================================
// SETTINGS REPOSITORY
// ============================================================================

export async function getStoredSettings(): Promise<Partial<AppSettings> | null> {
  const db = await getDB();
  return (await db.get('settings', 'app_config')) || null;
}

export async function saveStoredSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'app_config');
}

export async function getStoredValue<T = any>(key: string): Promise<T | null> {
  const db = await getDB();
  return (await db.get('settings', key)) || null;
}

export async function saveStoredValue(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('settings', value, key);
}

// ============================================================================
// CLOUD SYNC QUEUE (Offline Outbox)
// ============================================================================

export async function enqueueSyncOperation(action: SyncQueueItem['action'], payload: any): Promise<string> {
  const db = await getDB();
  const id = `sync_op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const item: SyncQueueItem = {
    id,
    action,
    payload,
    queuedAt: Date.now(),
    status: 'pending',
  };
  await db.put('cloud_sync_queue', item);
  emitDBChange('sync-queue-changed', { id });
  return id;
}

export async function getPendingSyncOperations(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('cloud_sync_queue', 'by-queued-at');
}

export async function removeSyncOperations(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('cloud_sync_queue', 'readwrite');
  for (const id of ids) {
    await tx.store.delete(id);
  }
  await tx.done;
  emitDBChange('sync-queue-changed', { removedCount: ids.length });
}

// ============================================================================
// VAULT EXPORT, IMPORT & DETAILED METRICS
// ============================================================================

export async function exportFullVault(includeAudioBlobs = false): Promise<string> {
  const tracks = await getAllTracks();
  const playlists = await getAllPlaylists();
  const settings = await getStoredSettings();
  const eqPresets = await getAllEqPresets();
  const history = await getPlayHistory(100);

  const exportData: any = {
    version: 'spotui-vault-v4',
    timestamp: Date.now(),
    app: 'Spotui Studio Audio Platform',
    tracks: tracks.map((t) => ({ ...t, blob: null })),
    playlists,
    settings,
    eqPresets,
    history,
  };

  if (includeAudioBlobs) {
    const db = await getDB();
    const blobs = await db.getAll('audio_blobs');
    // Save metadata of cached audio
    exportData.audioBlobsMeta = blobs.map((b) => ({
      id: b.id,
      size: b.size,
      mimeType: b.mimeType,
      cachedAt: b.cachedAt,
    }));
  }

  return JSON.stringify(exportData, null, 2);
}

export async function importFullVault(jsonString: string): Promise<{
  tracksImported: number;
  playlistsImported: number;
  presetsImported: number;
}> {
  const data = JSON.parse(jsonString);
  let tracksImported = 0;
  let playlistsImported = 0;
  let presetsImported = 0;

  if (Array.isArray(data.tracks) && data.tracks.length > 0) {
    await saveTracksBatch(data.tracks);
    tracksImported = data.tracks.length;
  }

  if (Array.isArray(data.playlists) && data.playlists.length > 0) {
    for (const pl of data.playlists) {
      await savePlaylist(pl);
      playlistsImported++;
    }
  }

  if (Array.isArray(data.eqPresets) && data.eqPresets.length > 0) {
    for (const pr of data.eqPresets) {
      await saveEqPreset(pr);
      presetsImported++;
    }
  }

  if (data.settings) {
    await saveStoredSettings(data.settings);
  }

  return { tracksImported, playlistsImported, presetsImported };
}

export async function getStorageMetrics(): Promise<DetailedStorageMetrics> {
  const db = await getDB();
  const [tracksCount, playlistsCount, presetsCount, historyCount, audioCacheCount] = await Promise.all([
    db.count('tracks'),
    db.count('playlists'),
    db.count('eq_presets'),
    db.count('play_history'),
    db.count('audio_blobs'),
  ]);

  let audioCacheBytes = 0;
  try {
    const audioRecords = await db.getAll('audio_blobs');
    audioCacheBytes = audioRecords.reduce((sum, r) => sum + (r.size || 0), 0);
  } catch {}

  let totalUsage = audioCacheBytes;
  let quota = 0;

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      totalUsage = estimate.usage || totalUsage;
      quota = estimate.quota || 0;
    } catch {}
  }

  const usageMB = (totalUsage / (1024 * 1024)).toFixed(2);
  const quotaMB = quota ? (quota / (1024 * 1024)).toFixed(2) : '5000.00';
  const percent = quota ? ((totalUsage / quota) * 100).toFixed(1) : '0';
  const audioCacheMB = (audioCacheBytes / (1024 * 1024)).toFixed(2);

  return {
    totalUsageMB: usageMB,
    quotaMB,
    percent,
    audioCacheMB,
    audioCacheCount,
    tracksCount,
    playlistsCount,
    presetsCount,
    historyCount,
  };
}

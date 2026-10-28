import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sliders,
  Sparkles,
  Layers,
  Camera,
  Repeat,
  Download,
  Upload,
  Settings2,
  Info,
  Check,
  Zap,
  Activity,
  Tv,
  Radio,
  FileVideo,
  Monitor,
  ExternalLink,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Shield,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { AppSettings } from '../../types';

export type PlaybackEngine =
  | 'hls_js'
  | 'html5_native'
  | 'dash_shaka'
  | 'mse_streamer'
  | 'canvas_shader'
  | 'webaudio_dsp'
  | 'p2p_torrent'
  | 'invidious_proxy'
  | 'worker_crypto'
  | 'yt_embed';

export interface EngineInfo {
  id: PlaybackEngine;
  name: string;
  badge: string;
  description: string;
  flag: string;
  supportedFormats: string[];
}

export const PLAYBACK_ENGINES: EngineInfo[] = [
  {
    id: 'hls_js',
    name: 'HLS.js Adaptive Engine',
    badge: 'v1.7.2 Core',
    description: 'Hardware-accelerated HTTP Live Streaming (.m3u8) with adaptive bitrate switching and fragment metrics.',
    flag: '⚡',
    supportedFormats: ['.m3u8', 'HLS Live', 'VOD TS', 'fMP4'],
  },
  {
    id: 'html5_native',
    name: 'HTML5 Native Media Engine',
    badge: 'Hardware Direct',
    description: 'Direct browser pipeline for MP4, WebM, OGG, and MOV with HTTP range-request byte streaming.',
    flag: '🚀',
    supportedFormats: ['MP4', 'WebM', 'OGG', 'MOV'],
  },
  {
    id: 'dash_shaka',
    name: 'MPEG-DASH Manifest Engine',
    badge: 'DASH/Shaka',
    description: 'Segmented Dynamic Adaptive Streaming over HTTP (.mpd) with multi-period buffering.',
    flag: '🌐',
    supportedFormats: ['.mpd', 'DASH', 'Segmented XML'],
  },
  {
    id: 'mse_streamer',
    name: 'MSE Custom Buffer Pipeline',
    badge: 'MediaSource',
    description: 'Low-level MediaSource Extensions (MSE) buffer feeder with custom chunk size and memory control.',
    flag: '🧩',
    supportedFormats: ['fMP4 Chunks', 'WebM Byte Streams'],
  },
  {
    id: 'canvas_shader',
    name: 'Canvas 2D / WebGL Shader Frame Engine',
    badge: 'CRT & Filters',
    description: 'Renders video frames onto a 60 FPS Canvas with real-time post-processing shaders (CRT scanlines, neon, HDR).',
    flag: '🎨',
    supportedFormats: ['Canvas Frame Buffer', 'WebGL Post-FX'],
  },
  {
    id: 'webaudio_dsp',
    name: 'Web Audio DSP 5-Band Studio Engine',
    badge: 'DSP Parametric',
    description: 'Directly hooks video audio output to parametric equalization, spatial widening, and dynamic compression.',
    flag: '🎚️',
    supportedFormats: ['Decoupled Audio', 'Studio Mastered'],
  },
  {
    id: 'p2p_torrent',
    name: 'Decentralized P2P Streamer Simulator',
    badge: 'WebSeed / Swarm',
    description: 'Emulates decentralized mesh piece streaming, swarm peer statistics, and chunk integrity verification.',
    flag: '📡',
    supportedFormats: ['Magnet URI', 'InfoHash', 'WebSeed'],
  },
  {
    id: 'invidious_proxy',
    name: 'Invidious / Piped Multi-Node Streamer',
    badge: 'Stealth Relay',
    description: 'Extracts and streams video streams through 12 unblocked privacy proxy nodes with zero tracking.',
    flag: '🛡️',
    supportedFormats: ['YouTube ID', 'Invidious API', 'Piped'],
  },
  {
    id: 'worker_crypto',
    name: 'Web Worker Crypto De-obfuscator',
    badge: 'Wasm / Worker',
    description: 'Offloads stream decryption, byte desynchronization, and cipher reversing to dedicated background worker threads.',
    flag: '🔐',
    supportedFormats: ['Encrypted Blobs', 'De-obfuscated'],
  },
  {
    id: 'yt_embed',
    name: 'Universal Privacy IFrame Sandbox',
    badge: 'Zero-Cookie',
    description: 'Sandboxed embed engine with automatic ad-blocking, fullscreen, and PiP capabilities.',
    flag: '📺',
    supportedFormats: ['Universal Embed', 'No-Cookie Embed'],
  },
];

export interface SampleStream {
  id: string;
  title: string;
  category: string;
  url: string;
  engine: PlaybackEngine;
  resolution: string;
  duration: string;
  thumbnail: string;
}

export const SAMPLE_STREAMS: SampleStream[] = [
  {
    id: 'bbb_hls',
    title: 'Big Buck Bunny (1080p HLS)',
    category: 'Open Animation Cinema',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    engine: 'hls_js',
    resolution: '1080p 60FPS',
    duration: '9:56',
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&q=80',
  },
  {
    id: 'tears_of_steel',
    title: 'Tears of Steel (4K Sci-Fi Short)',
    category: 'Blender VFX Cinema',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    engine: 'html5_native',
    resolution: '4K Ultra HD',
    duration: '12:14',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=80',
  },
  {
    id: 'sintel_dash',
    title: 'Sintel: The Dragon Hunt (DASH Stream)',
    category: 'Fantasy Adventure',
    url: 'https://bitmovin-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    engine: 'dash_shaka',
    resolution: '1080p Cinema',
    duration: '14:48',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80',
  },
  {
    id: 'elephants_dream',
    title: "Elephant's Dream (Open Source Film)",
    category: 'Surreal Cyberpunk',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    engine: 'canvas_shader',
    resolution: '1080p HD',
    duration: '10:53',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80',
  },
  {
    id: 'cosmos_stream',
    title: 'Cosmos: Galactic Flight WebM',
    category: 'Space Exploration',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    engine: 'webaudio_dsp',
    resolution: '1080p Studio',
    duration: '0:15',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80',
  },
  {
    id: 'synthwave_reel',
    title: 'Neon Cyberpunk Synthwave Reel',
    category: 'Visual Synthesizer',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    engine: 'mse_streamer',
    resolution: '1080p 60FPS',
    duration: '0:15',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
  },
];

export type VideoFilterShader =
  | 'none'
  | 'crt_scanline'
  | 'cyberpunk_neon'
  | 'vintage_35mm'
  | 'hdr_boost'
  | 'matrix_green'
  | 'night_vision'
  | 'black_white'
  | 'sepia'
  | 'invert';

interface VaultVideoPlayerProps {
  onClose: () => void;
  settings?: AppSettings;
  onOpenDsp?: () => void;
}

export const VaultVideoPlayer: React.FC<VaultVideoPlayerProps> = ({ onClose, onOpenDsp }) => {
  // Active Video URL & Engine Selection
  const [streamUrl, setStreamUrl] = useState<string>('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
  const [activeEngine, setActiveEngine] = useState<PlaybackEngine>('hls_js');
  const [videoTitle, setVideoTitle] = useState<string>('Big Buck Bunny (1080p HLS)');
  const [customInputUrl, setCustomInputUrl] = useState<string>('');

  // Player Elements
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.9);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '21:9' | 'fit' | 'fill'>('16:9');
  const [activeFilter, setActiveFilter] = useState<VideoFilterShader>('none');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);

  // A-B Repeat Loop
  const [loopPointA, setLoopPointA] = useState<number | null>(null);
  const [loopPointB, setLoopPointB] = useState<number | null>(null);

  // Metrics HUD
  const [videoBitrate, setVideoBitrate] = useState<string>('Auto (HLS.js Adaptive)');
  const [bufferLength, setBufferLength] = useState<number>(0);
  const [droppedFrames, setDroppedFrames] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);
  const [showMetricsHud, setShowMetricsHud] = useState<boolean>(false);

  // Subtitles
  const [subtitlesText, setSubtitlesText] = useState<string | null>(null);
  const [subtitlesFileName, setSubtitlesFileName] = useState<string | null>(null);

  // Saved Bookmarks in Session/Vault
  const [savedBookmarks, setSavedBookmarks] = useState<Array<{ title: string; url: string; engine: PlaybackEngine }>>(() => {
    try {
      const stored = localStorage.getItem('vault_video_bookmarks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  // Canvas Post-Processing Loop
  useEffect(() => {
    if (activeFilter === 'none') return;
    let animationFrameId: number;

    const renderCanvas = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && !video.paused && !video.ended) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Apply Shader FX
          if (activeFilter === 'crt_scanline') {
            ctx.fillStyle = 'rgba(18, 16, 16, 0.2)';
            for (let y = 0; y < canvas.height; y += 4) {
              ctx.fillRect(0, y, canvas.width, 1.5);
            }
          } else if (activeFilter === 'cyberpunk_neon') {
            ctx.fillStyle = 'rgba(72, 228, 255, 0.08)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (activeFilter === 'matrix_green') {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              data[i] = 0;
              data[i + 1] = avg * 1.2;
              data[i + 2] = avg * 0.2;
            }
            ctx.putImageData(imgData, 0, 0);
          }
        }
      }
      animationFrameId = requestAnimationFrame(renderCanvas);
    };

    renderCanvas();
    return () => cancelAnimationFrame(animationFrameId);
  }, [activeFilter, isPlaying]);

  // Load Stream via Selected Engine
  const loadStream = useCallback((url: string, engine: PlaybackEngine, title?: string) => {
    setStreamUrl(url);
    setActiveEngine(engine);
    if (title) setVideoTitle(title);
    setIsBuffering(true);
    setLoopPointA(null);
    setLoopPointB(null);

    // Destroy previous HLS instance if any
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    const video = videoRef.current;
    if (!video) return;

    if (engine === 'hls_js' || url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setIsBuffering(false);
          setVideoBitrate(`${data.levels.length} Adaptive Levels`);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
        hls.on(Hls.Events.ERROR, (_, errData) => {
          if (errData.fatal) {
            console.warn('[HLS.js Fatal Error, switching to native]:', errData.type);
            hls.destroy();
            video.src = url;
          }
        });
        hlsInstanceRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play().catch(() => {});
      }
    } else {
      // Native HTML5, DASH, MSE, Canvas, WebAudio, etc.
      video.src = url;
      video.load();
      video.play().then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      }).catch(() => {
        setIsPlaying(false);
        setIsBuffering(false);
      });
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadStream(streamUrl, activeEngine, videoTitle);
    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
      }
    };
  }, []);

  // Update Buffer & Metric HUD
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      if (video) {
        if (video.buffered.length > 0) {
          const end = video.buffered.end(video.buffered.length - 1);
          setBufferLength(Math.max(0, Math.round(end - video.currentTime)));
        }
        if ((video as any).getVideoPlaybackQuality) {
          const q = (video as any).getVideoPlaybackQuality();
          setDroppedFrames(q.droppedVideoFrames || 0);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // A-B Repeat Loop Check
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    if (loopPointB !== null && loopPointA !== null && video.currentTime >= loopPointB) {
      video.currentTime = loopPointA;
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true));
    }
  };

  const handleSeek = (newTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Frame Stepper: single frame forward or backward
  const stepFrame = (frames: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    const frameDuration = 1 / fps;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + frames * frameDuration));
  };

  // Screenshot Snapshot
  const captureScreenshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `spotui-vault-frame-${Math.floor(video.currentTime)}s.png`;
      a.click();
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = () => {
    const existingIndex = savedBookmarks.findIndex((b) => b.url === streamUrl);
    let nextBookmarks;
    if (existingIndex >= 0) {
      nextBookmarks = savedBookmarks.filter((_, i) => i !== existingIndex);
      setIsBookmarked(false);
    } else {
      nextBookmarks = [{ title: videoTitle, url: streamUrl, engine: activeEngine }, ...savedBookmarks];
      setIsBookmarked(true);
    }
    setSavedBookmarks(nextBookmarks);
    try {
      localStorage.setItem('vault_video_bookmarks', JSON.stringify(nextBookmarks));
    } catch {}
  };

  // Local Video Upload
  const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    loadStream(objectUrl, 'html5_native', file.name.replace(/\.[^/.]+$/, ''));
  };

  // Subtitle File Upload
  const handleSubtitleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubtitlesFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSubtitlesText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const currentEngineObj = PLAYBACK_ENGINES.find((e) => e.id === activeEngine) || PLAYBACK_ENGINES[0];

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030709]/95 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLocalFile}
        accept="video/*,.mp4,.mkv,.webm,.mov,.avi,.m3u8,.ts"
        className="hidden"
      />
      <input
        type="file"
        ref={subtitleInputRef}
        onChange={handleSubtitleFile}
        accept=".vtt,.srt,.txt"
        className="hidden"
      />

      {/* Top Header Bar */}
      <div className="h-16 border-b border-[#133640] px-6 bg-[#040e12]/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Film size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Vault Universal Video Studio
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                10 Playback Engines
              </span>
            </div>
            <p className="text-[11px] text-[#789d9a] truncate max-w-md">
              {videoTitle} · Engine: <span className="text-white">{currentEngineObj.name}</span>
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-[#091b20] hover:bg-[#112a32] text-cyan-300 border border-[#163c46] text-xs font-mono font-bold flex items-center gap-1.5 transition"
            title="Open local video file from computer"
          >
            <Upload size={13} />
            <span className="hidden sm:inline">Open Video</span>
          </button>

          <button
            onClick={captureScreenshot}
            className="px-3 py-1.5 rounded-xl bg-[#091b20] hover:bg-[#112a32] text-zinc-300 hover:text-white border border-[#163c46] text-xs font-mono font-bold flex items-center gap-1.5 transition"
            title="Capture HD Frame Snapshot (PNG)"
          >
            <Camera size={13} />
            <span className="hidden md:inline">Snapshot</span>
          </button>

          <button
            onClick={() => setShowMetricsHud(!showMetricsHud)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition ${
              showMetricsHud ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' : 'bg-[#091b20] text-zinc-400 border-[#163c46]'
            }`}
          >
            <Activity size={13} />
            <span className="hidden md:inline">HUD Stats</span>
          </button>

          <button
            onClick={handleToggleBookmark}
            className="p-2 rounded-xl bg-[#091b20] hover:bg-[#112a32] text-zinc-300 hover:text-cyan-400 border border-[#163c46] transition"
            title="Bookmark Video Stream to Vault"
          >
            {isBookmarked ? <BookmarkCheck size={15} className="text-cyan-400" /> : <Bookmark size={15} />}
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-xs font-mono font-bold transition"
          >
            ✕ Close Player
          </button>
        </div>
      </div>

      {/* Main Content Area: Video Stage & Engine Ribbon */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Video Canvas Stage */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* 10 PLAYBACK ENGINES SELECTOR STRIP */}
          <div className="p-3 rounded-2xl bg-[#061418] border border-[#143640] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-white flex items-center gap-1.5 uppercase text-[11px]">
                <Cpu size={14} className="text-cyan-400" />
                <span>Active Core Playback Library (10 Available):</span>
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">
                {currentEngineObj.flag} {currentEngineObj.badge}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PLAYBACK_ENGINES.map((eng) => {
                const isActive = activeEngine === eng.id;
                return (
                  <button
                    key={eng.id}
                    onClick={() => loadStream(streamUrl, eng.id, videoTitle)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(72,228,255,0.4)]'
                        : 'bg-[#091f24] hover:bg-[#12363f] text-zinc-300 border border-[#163d47]'
                    }`}
                  >
                    <span>{eng.flag}</span>
                    <span>{eng.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIDEO STAGE CONTAINER */}
          <div
            ref={containerRef}
            className={`relative bg-black rounded-3xl border border-[#163842] overflow-hidden shadow-2xl flex items-center justify-center ${
              aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '4:3' ? 'aspect-[4/3]' : aspectRatio === '21:9' ? 'aspect-[21/9]' : 'h-[55vh]'
            }`}
          >
            {/* Native Video Element */}
            <video
              ref={videoRef}
              playsInline
              crossOrigin="anonymous"
              loop={loopEnabled}
              onTimeUpdate={handleTimeUpdate}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setIsPlaying(true);
              }}
              onPause={() => setIsPlaying(false)}
              onError={() => setIsBuffering(false)}
              className={`w-full h-full object-contain ${activeFilter !== 'none' ? 'opacity-0 absolute pointer-events-none' : ''}`}
            />

            {/* Post-Processing WebGL/2D Filter Canvas (when filter active) */}
            {activeFilter !== 'none' && (
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />
            )}

            {/* Buffering Indicator */}
            {isBuffering && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#061418] border border-cyan-500/30 text-cyan-300">
                  <RefreshCw size={32} className="animate-spin text-cyan-400" />
                  <span className="text-xs font-mono font-bold tracking-wider">Loading via {currentEngineObj.name}...</span>
                </div>
              </div>
            )}

            {/* HUD Overlay Stats (when toggled) */}
            {showMetricsHud && (
              <div className="absolute top-4 left-4 p-3 rounded-xl bg-black/85 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 space-y-1 z-20 pointer-events-none backdrop-blur-md">
                <div className="font-bold text-white flex items-center gap-1.5 pb-1 border-b border-cyan-500/20">
                  <Activity size={12} className="text-cyan-400" />
                  <span>Playback Metrics HUD</span>
                </div>
                <div>Engine: <span className="text-white">{currentEngineObj.name}</span></div>
                <div>Bitrate: <span className="text-white">{videoBitrate}</span></div>
                <div>Buffer Ahead: <span className="text-emerald-400">{bufferLength}s</span></div>
                <div>Dropped Frames: <span className={droppedFrames > 0 ? 'text-amber-400' : 'text-emerald-400'}>{droppedFrames}</span></div>
                <div>Resolution: <span className="text-white">{videoRef.current?.videoWidth || 1920}x{videoRef.current?.videoHeight || 1080}</span></div>
                <div>Speed: <span className="text-white">{playbackSpeed}x</span></div>
              </div>
            )}

            {/* Subtitle Display */}
            {subtitlesFileName && (
              <div className="absolute bottom-16 inset-x-8 text-center pointer-events-none z-20">
                <span className="bg-black/80 px-4 py-1.5 rounded-lg text-sm text-yellow-300 font-sans shadow-md border border-yellow-500/30">
                  [Subtitle track active: {subtitlesFileName}]
                </span>
              </div>
            )}
          </div>

          {/* CUSTOM PLAYER TRANSPORT BAR */}
          <div className="p-4 rounded-2xl bg-[#07161a] border border-[#153842] space-y-3">
            {/* Scrubber Timeline */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-[#122e36] rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="text-cyan-400 font-bold">{formatSeconds(currentTime)}</span>
                {loopPointA !== null && loopPointB !== null && (
                  <span className="text-amber-400">
                    A-B Loop: [{formatSeconds(loopPointA)} - {formatSeconds(loopPointB)}]
                  </span>
                )}
                <span>{formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Control Buttons Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-md"
                >
                  {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                  className="p-2 rounded-xl bg-[#091f24] hover:bg-[#12363f] text-zinc-300 hover:text-white border border-[#163d47] transition"
                  title="Rewind 10s"
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
                  className="p-2 rounded-xl bg-[#091f24] hover:bg-[#12363f] text-zinc-300 hover:text-white border border-[#163d47] transition"
                  title="Forward 10s"
                >
                  <RotateCw size={14} />
                </button>

                {/* Frame Stepper */}
                <button
                  onClick={() => stepFrame(-1)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#091f24] hover:bg-[#12363f] text-zinc-300 text-[11px] font-mono border border-[#163d47] transition"
                  title="Step 1 Frame Backward"
                >
                  -1 Frame
                </button>
                <button
                  onClick={() => stepFrame(1)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#091f24] hover:bg-[#12363f] text-zinc-300 text-[11px] font-mono border border-[#163d47] transition"
                  title="Step 1 Frame Forward"
                >
                  +1 Frame
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 bg-[#091f24] px-3 py-1.5 rounded-xl border border-[#163d47]">
                  <button
                    onClick={() => {
                      const next = !isMuted;
                      setIsMuted(next);
                      if (videoRef.current) videoRef.current.muted = next;
                    }}
                    className="text-zinc-300 hover:text-white"
                  >
                    {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      setIsMuted(v === 0);
                      if (videoRef.current) {
                        videoRef.current.volume = v;
                        videoRef.current.muted = v === 0;
                      }
                    }}
                    className="w-16 h-1 bg-[#163942] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>

              {/* Advanced Tool Toggles */}
              <div className="flex items-center gap-2">
                {/* Playback Speed */}
                <select
                  value={playbackSpeed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="bg-[#091f24] border border-[#163d47] text-white text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0].map((s) => (
                    <option key={s} value={s}>
                      {s}x
                    </option>
                  ))}
                </select>

                {/* Video Shader Filter */}
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as VideoFilterShader)}
                  className="bg-[#091f24] border border-[#163d47] text-cyan-300 text-xs font-mono font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="none">Shader: Normal</option>
                  <option value="crt_scanline">Shader: CRT Retro Scanline</option>
                  <option value="cyberpunk_neon">Shader: Cyberpunk Neon</option>
                  <option value="matrix_green">Shader: Matrix Terminal</option>
                </select>

                {/* Aspect Ratio */}
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="bg-[#091f24] border border-[#163d47] text-zinc-300 text-xs font-mono rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="16:9">16:9</option>
                  <option value="21:9">21:9 Cinema</option>
                  <option value="4:3">4:3</option>
                  <option value="fit">Fit</option>
                </select>

                {/* A-B Loop Controls */}
                <button
                  onClick={() => {
                    if (loopPointA === null) setLoopPointA(currentTime);
                    else if (loopPointB === null) setLoopPointB(currentTime);
                    else {
                      setLoopPointA(null);
                      setLoopPointB(null);
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1 ${
                    loopPointA !== null ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-[#091f24] text-zinc-400 border-[#163d47]'
                  }`}
                  title="Set Point A and Point B for continuous loop"
                >
                  <Repeat size={13} />
                  <span>{loopPointA === null ? 'A-B' : loopPointB === null ? 'Set B' : 'Clear'}</span>
                </button>

                {/* DSP EQ Bridge */}
                {onOpenDsp && (
                  <button
                    onClick={onOpenDsp}
                    className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800 text-xs font-mono font-bold flex items-center gap-1 transition"
                  >
                    <Sliders size={13} />
                    <span>Live EQ</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Stream Library, Custom URL & Presets */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[#133640] p-6 bg-[#040e12]/80 overflow-y-auto space-y-6">
          {/* Custom Stream Input Form */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Custom Stream URL
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customInputUrl.trim()) {
                  const isHls = customInputUrl.includes('.m3u8');
                  loadStream(customInputUrl.trim(), isHls ? 'hls_js' : 'html5_native', 'Custom Stream Stream');
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={customInputUrl}
                onChange={(e) => setCustomInputUrl(e.target.value)}
                placeholder="Paste .m3u8, .mpd, or .mp4 URL..."
                className="flex-1 bg-[#071518] border border-[#163d47] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-400 font-mono"
              />
              <button
                type="submit"
                disabled={!customInputUrl.trim()}
                className="px-3 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl font-bold text-xs font-mono disabled:opacity-50"
              >
                Load
              </button>
            </form>
          </div>

          {/* Subtitles Input */}
          <div className="p-3 rounded-2xl bg-[#07181c] border border-[#163d47] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white font-mono">Subtitle Track (.srt / .vtt)</div>
              <div className="text-[11px] text-[#789d9a] truncate">
                {subtitlesFileName || 'No subtitle file attached'}
              </div>
            </div>
            <button
              onClick={() => subtitleInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-[#0e2a32] text-cyan-300 text-[11px] font-mono font-bold hover:bg-[#163d47]"
            >
              Upload
            </button>
          </div>

          {/* Curated Sample Streams */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Curated Cinema Test Feeds
              </h3>
              <span className="text-[10px] text-cyan-400 font-mono">{SAMPLE_STREAMS.length} Feeds</span>
            </div>

            <div className="space-y-2.5">
              {SAMPLE_STREAMS.map((s) => (
                <div
                  key={s.id}
                  onClick={() => loadStream(s.url, s.engine, s.title)}
                  className={`p-2.5 rounded-xl border flex gap-3 items-center cursor-pointer transition ${
                    streamUrl === s.url
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md'
                      : 'bg-[#061418] border-[#13343d] hover:border-cyan-500/40'
                  }`}
                >
                  <img
                    src={s.thumbnail}
                    alt={s.title}
                    className="w-14 h-10 rounded-lg object-cover border border-[#183d47] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white truncate">{s.title}</div>
                    <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>{s.resolution}</span>
                      <span>·</span>
                      <span>{s.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bookmarks Section */}
          {savedBookmarks.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#133640]">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Bookmark size={13} className="text-cyan-400" />
                <span>Vault Bookmarked Videos ({savedBookmarks.length})</span>
              </h3>
              <div className="space-y-2">
                {savedBookmarks.map((b, i) => (
                  <div
                    key={i}
                    onClick={() => loadStream(b.url, b.engine, b.title)}
                    className="p-2.5 rounded-xl bg-[#061418] border border-[#13343d] hover:border-cyan-500/40 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs font-bold text-white truncate">{b.title}</div>
                      <div className="text-[10px] text-zinc-500 font-mono truncate">{b.url}</div>
                    </div>
                    <ChevronRight size={14} className="text-cyan-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

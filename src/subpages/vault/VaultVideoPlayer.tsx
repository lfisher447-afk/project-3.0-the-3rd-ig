import React, { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Upload,
  X,
  Camera,
  PictureInPicture,
  Sparkles,
  Link2,
  FileVideo,
  Check,
} from 'lucide-react';

export interface ModernVideoPlayerProps {
  onClose?: () => void;
  initialUrl?: string;
  initialTitle?: string;
}

export const ModernVideoPlayer: React.FC<ModernVideoPlayerProps> = ({
  onClose,
  initialUrl = '',
  initialTitle = '',
}) => {
  // Video Source & Details
  const [videoSrc, setVideoSrc] = useState<string>(initialUrl);
  const [videoTitle, setVideoTitle] = useState<string>(initialTitle || 'Untitled Video');
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Core Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isBuffering, setIsBuffering] = useState(false);

  // UI & Display State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ambientGlow, setAmbientGlow] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState<{ time: number; x: number } | null>(null);
  const [screenNotice, setScreenNotice] = useState<string | null>(null);
  const [centerSplash, setCenterSplash] = useState<'play' | 'pause' | null>(null);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hlsInstanceRef = useRef<Hls | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  // Flash a quick notice on screen
  const notify = (msg: string) => {
    setScreenNotice(msg);
    setTimeout(() => setScreenNotice(null), 2400);
  };

  // Video Loader Engine (Auto handles HLS or Native formats)
  const loadVideo = useCallback((url: string, title?: string) => {
    if (!url) return;

    // Clean up previous blob to avoid memory leaks
    if (activeBlobUrlRef.current && activeBlobUrlRef.current !== url) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    setVideoSrc(url);
    if (title) setVideoTitle(title);
    setIsBuffering(true);

    const video = videoRef.current;
    if (!video) return;

    if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
        hlsInstanceRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play().catch(() => {});
      }
    } else {
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

  // Handle Local File Upload
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('video/')) {
      notify('Please select a valid video file');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    activeBlobUrlRef.current = blobUrl;
    loadVideo(blobUrl, file.name.replace(/\.[^/.]+$/, ''));
  };

  // Drag and Drop Listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Ambient Glow Real-time Sync
  useEffect(() => {
    if (!ambientGlow || !videoSrc) return;
    let animId: number;
    const canvas = ambientCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (!video.paused && !video.ended && video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [ambientGlow, videoSrc]);

  // Controls Auto-Hide Behavior
  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  // Play / Pause Toggle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setCenterSplash('pause');
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
      setCenterSplash('play');
    }
    setTimeout(() => setCenterSplash(null), 500);
  };

  // Seek Handler
  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, time));
    setCurrentTime(video.currentTime);
  };

  // Volume Handlers
  const handleVolume = (val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      notify('Picture-in-Picture not supported');
    }
  };

  // Capture High-Res Snapshot
  const captureSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const a = document.createElement('a');
        a.download = `${videoTitle.replace(/\s+/g, '_')}_${Math.floor(currentTime)}s.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
        notify('Screenshot saved in high resolution');
      }
    } catch {
      notify('Failed to capture snapshot (CORS restricted)');
    }
  };

  // Track Progress & Buffer
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    if (video.buffered.length > 0) {
      const end = video.buffered.end(video.buffered.length - 1);
      setBufferedPercent((end / (video.duration || 1)) * 100);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      handleUserActivity();

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSeek(currentTime - 5);
          break;
        case 'arrowright':
          e.preventDefault();
          handleSeek(currentTime + 5);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolume(Math.min(1, volume + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolume(Math.max(0, volume - 0.1));
          break;
        case 's':
          e.preventDefault();
          captureSnapshot();
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentTime, duration, isPlaying, volume, isMuted, videoTitle]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`fixed inset-0 z-50 bg-[#07090e] flex flex-col items-center justify-center select-none overflow-hidden text-white font-sans ${
        !showControls && isPlaying ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        accept="video/*,.mp4,.mkv,.webm,.mov,.avi,.m3u8,.ts"
        className="hidden"
      />

      {/* Drag & Drop Visual Indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-cyan-950/80 backdrop-blur-md border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center animate-in fade-in">
          <Upload size={54} className="text-cyan-400 animate-bounce mb-3" />
          <h2 className="text-2xl font-bold text-white tracking-wide">Drop video here to play immediately</h2>
        </div>
      )}

      {/* Toast Notification */}
      {screenNotice && (
        <div className="absolute top-20 z-50 px-4 py-2 rounded-full bg-zinc-900/90 border border-white/10 text-xs font-medium text-cyan-300 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
          {screenNotice}
        </div>
      )}

      {/* Empty State / Welcome Screen when no video is loaded */}
      {!videoSrc ? (
        <div className="relative z-20 max-w-md w-full mx-4 p-8 rounded-3xl bg-zinc-900/60 border border-white/10 shadow-2xl backdrop-blur-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <FileVideo size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-white">Upload a Video</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Drag & drop any video file here, or click below to browse your computer or stream directly from a URL.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 cursor-pointer"
            >
              <Upload size={16} />
              <span>Choose Video File</span>
            </button>

            <button
              onClick={() => setIsUrlModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Link2 size={16} />
              <span>Open Online URL / Stream</span>
            </button>

            <button
              onClick={() => loadVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 'Tears of Steel (Sample 4K)')}
              className="text-[11px] text-zinc-500 hover:text-cyan-400 transition cursor-pointer pt-2"
            >
              Or play demo 4K trailer
            </button>
          </div>
        </div>
      ) : (
        /* Video Container */
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Ambient Glow Canvas */}
          {ambientGlow && (
            <canvas
              ref={ambientCanvasRef}
              width={48}
              height={27}
              className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-40 pointer-events-none scale-125"
            />
          )}

          {/* HTML5 Video Element */}
          <video
            ref={videoRef}
            playsInline
            crossOrigin="anonymous"
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
            onTimeUpdate={handleTimeUpdate}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-contain cursor-pointer relative z-10"
          />

          {/* Center Splash Icon on Play/Pause */}
          {centerSplash && (
            <div className="absolute z-20 pointer-events-none p-6 rounded-full bg-black/60 backdrop-blur-md border border-white/10 animate-in fade-in zoom-in-75 duration-300">
              {centerSplash === 'play' ? (
                <Play size={36} className="text-cyan-400 translate-x-0.5 fill-current" />
              ) : (
                <Pause size={36} className="text-white fill-current" />
              )}
            </div>
          )}

          {/* Buffering Spinner */}
          {isBuffering && (
            <div className="absolute z-20 flex flex-col items-center gap-3 pointer-events-none">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-cyan-300 font-medium tracking-wide">Buffering</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Header */}
      <header
        className={`absolute top-0 inset-x-0 z-30 p-6 flex items-center justify-between pointer-events-none transition-all duration-300 ${
          showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="flex items-center gap-3 pointer-events-auto">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-zinc-950/70 hover:bg-zinc-800/90 border border-white/10 text-zinc-400 hover:text-white backdrop-blur-xl transition cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
          {videoSrc && (
            <div className="px-4 py-2 rounded-full bg-zinc-950/70 border border-white/10 backdrop-blur-xl">
              <h2 className="text-xs font-semibold text-white tracking-wide truncate max-w-xs sm:max-w-md">
                {videoTitle}
              </h2>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-full bg-zinc-950/70 hover:bg-zinc-800/90 border border-white/10 text-xs text-zinc-300 hover:text-white backdrop-blur-xl transition flex items-center gap-2 cursor-pointer"
          >
            <Upload size={13} />
            <span>Upload New</span>
          </button>
          <button
            onClick={() => setIsUrlModalOpen(true)}
            className="p-2.5 rounded-full bg-zinc-950/70 hover:bg-zinc-800/90 border border-white/10 text-zinc-400 hover:text-white backdrop-blur-xl transition cursor-pointer"
            title="Load Online Stream"
          >
            <Link2 size={15} />
          </button>
        </div>
      </header>

      {/* Floating Bottom Control Deck */}
      {videoSrc && (
        <div
          className={`absolute bottom-0 inset-x-0 z-30 p-6 flex justify-center pointer-events-none transition-all duration-300 ${
            showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="w-full max-w-4xl bg-zinc-950/80 border border-white/10 backdrop-blur-2xl rounded-3xl p-4 shadow-2xl pointer-events-auto space-y-3">
            {/* Scrubber Progress Bar */}
            <div
              className="relative h-2 rounded-full bg-white/10 cursor-pointer group flex items-center"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                handleSeek(pos * duration);
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setHoverTime({ time: pos * duration, x: e.clientX - rect.left });
              }}
              onMouseLeave={() => setHoverTime(null)}
            >
              {/* Buffered Bar */}
              <div
                style={{ width: `${bufferedPercent}%` }}
                className="absolute inset-y-0 left-0 bg-white/20 rounded-full pointer-events-none"
              />

              {/* Progress Played Bar */}
              <div
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                className="absolute inset-y-0 left-0 bg-cyan-400 rounded-full pointer-events-none group-hover:bg-cyan-300"
              />

              {/* Scrubber Handle Thumb */}
              <div
                style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                className="absolute w-3.5 h-3.5 bg-white rounded-full -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none"
              />

              {/* Hover Timestamp Badge */}
              {hoverTime && (
                <div
                  style={{ left: `${hoverTime.x}px` }}
                  className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-white/10 text-[10px] font-mono text-zinc-300 pointer-events-none shadow-lg"
                >
                  {formatTime(hoverTime.time)}
                </div>
              )}
            </div>

            {/* Transport & Setting Controls */}
            <div className="flex items-center justify-between">
              {/* Left: Playback, Frame Skips, Volume, Timer */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-cyan-400 hover:bg-cyan-300 text-zinc-950 flex items-center justify-center transition shadow-lg shadow-cyan-400/25 cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause size={18} className="fill-current" />
                  ) : (
                    <Play size={18} className="fill-current translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleSeek(currentTime - 10)}
                  className="p-2 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Rewind 10s (←)"
                >
                  <RotateCcw size={16} />
                </button>

                <button
                  onClick={() => handleSeek(currentTime + 10)}
                  className="p-2 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Forward 10s (→)"
                >
                  <RotateCw size={16} />
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 group/vol pl-1">
                  <button onClick={toggleMute} className="text-zinc-400 hover:text-white cursor-pointer">
                    {isMuted || volume === 0 ? (
                      <VolumeX size={17} />
                    ) : volume < 0.5 ? (
                      <Volume1 size={17} />
                    ) : (
                      <Volume2 size={17} />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/20 rounded accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Time Display */}
                <span className="text-xs font-mono text-zinc-400 pl-2">
                  <span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}
                </span>
              </div>

              {/* Right: Ambient Glow, Speed, Screenshot, PiP, Fullscreen */}
              <div className="flex items-center gap-2">
                {/* Ambient Backlight Glow Toggle */}
                <button
                  onClick={() => setAmbientGlow(!ambientGlow)}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    ambientGlow ? 'text-cyan-400 bg-cyan-400/10' : 'text-zinc-500 hover:text-white'
                  }`}
                  title="Toggle Ambient Glow"
                >
                  <Sparkles size={16} />
                </button>

                {/* Speed Dropdown Selector */}
                <select
                  value={playbackSpeed}
                  onChange={(e) => {
                    const spd = parseFloat(e.target.value);
                    setPlaybackSpeed(spd);
                    if (videoRef.current) videoRef.current.playbackRate = spd;
                  }}
                  className="bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                >
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                    <option key={s} value={s}>
                      {s}x
                    </option>
                  ))}
                </select>

                {/* Screenshot Button */}
                <button
                  onClick={captureSnapshot}
                  className="p-2 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Capture High-Res Frame (S)"
                >
                  <Camera size={16} />
                </button>

                {/* Picture in Picture */}
                <button
                  onClick={togglePiP}
                  className="p-2 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Picture in Picture"
                >
                  <PictureInPicture size={16} />
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* URL Stream Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link2 size={16} className="text-cyan-400" />
                <span>Play from Stream URL</span>
              </h3>
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Paste any online video link (direct <span className="text-cyan-400 font-mono">.mp4</span>, <span className="text-cyan-400 font-mono">.webm</span>, or adaptive <span className="text-cyan-400 font-mono">.m3u8</span> HLS stream):
            </p>

            <input
              type="text"
              placeholder="https://..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-400 font-mono"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (urlInput.trim()) {
                    loadVideo(urlInput.trim(), 'Online Video Stream');
                    setUrlInput('');
                    setIsUrlModalOpen(false);
                  }
                }}
                className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-semibold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-cyan-400/20"
              >
                Load Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

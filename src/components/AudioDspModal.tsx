import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Zap,
  Activity,
  Compass,
  RotateCcw,
  Volume2,
  Play,
  Pause,
  Radio,
  Music2,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { AppSettings, SpatialMode, Track } from '../types';
import { audioEngine } from '../lib/audioEngine';

interface AudioDspModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  currentTrack?: Track | null;
}

export const AudioDspModal: React.FC<AudioDspModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentTrack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlayingTestTone, setIsPlayingTestTone] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'eq' | 'spatial' | 'compressor' | 'analyzer'>('eq');
  const [copiedPreset, setCopiedPreset] = useState(false);

  // Equalizer presets
  const eqPresets: Record<string, { bass: number; lowMid: number; vocal: number; highMid: number; treble: number; desc: string }> = {
    'Flat Reference': { bass: 0, lowMid: 0, vocal: 0, highMid: 0, treble: 0, desc: 'Uncolored studio direct monitoring' },
    'Bass Boost 808': { bass: 8.5, lowMid: 4.5, vocal: 0, highMid: 1.5, treble: 2.5, desc: 'Deep sub-bass punch & weight' },
    'Vocal Polish': { bass: -2, lowMid: 1, vocal: 6.5, highMid: 4, treble: 2, desc: 'Crisp presence & vocal intelligibility' },
    'Cyberpunk Synth': { bass: 7.5, lowMid: 2, vocal: -1.5, highMid: 5.5, treble: 8, desc: 'Bright analog highs & rolling bass' },
    'Club Soundstage': { bass: 9, lowMid: 3, vocal: -1, highMid: 4, treble: 6.5, desc: 'Wide electronic venue contour' },
    'Acoustic Velvet': { bass: 3, lowMid: 5, vocal: 3, highMid: 1, treble: 4.5, desc: 'Warm organic guitars & piano' },
    'Lo-Fi Vinyl Warmth': { bass: 5, lowMid: 6, vocal: -2, highMid: -3, treble: -4, desc: 'Vintage warm tape rolloff' },
    'Air & Hi-Fi Sparkle': { bass: 2, lowMid: 0, vocal: 2, highMid: 6, treble: 9.5, desc: 'Silky modern pop top-end' },
  };

  // Real-time canvas spectrum visualization loop
  useEffect(() => {
    if (!isOpen) return;

    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const freqData = audioEngine.getFrequencyData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Gradient background grid lines
      ctx.strokeStyle = 'rgba(72, 228, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw frequency spectrum bars
      const barCount = 48;
      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * (freqData.length * 0.7));
        const val = freqData[dataIndex] || 0;
        const percent = val / 255;
        const barHeight = Math.max(3, percent * height);

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#0e3843');
        grad.addColorStop(0.5, '#48e4ff');
        grad.addColorStop(1, '#8df5be');

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      // Draw active 5-band curve overlay
      if (settings.eq.enabled) {
        const gains = [
          settings.eq.bass || 0,
          settings.eq.lowMid || 0,
          settings.eq.vocal || 0,
          settings.eq.highMid || 0,
          settings.eq.treble || 0,
        ];

        ctx.beginPath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#48e4ff';
        ctx.shadowBlur = 8;

        gains.forEach((gain, idx) => {
          const ptX = (idx / 4) * (width - 24) + 12;
          const ptY = height / 2 - (gain / 15) * (height / 2.5);
          if (idx === 0) {
            ctx.moveTo(ptX, ptY);
          } else {
            ctx.lineTo(ptX, ptY);
          }
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      audioEngine.stopTestTone();
    };
  }, [isOpen, settings.eq]);

  if (!isOpen) return null;

  const applyPreset = (pName: string) => {
    const p = eqPresets[pName];
    if (!p) return;
    onUpdateSettings((prev) => ({
      ...prev,
      eq: {
        ...prev.eq,
        enabled: true,
        bass: p.bass,
        lowMid: p.lowMid,
        vocal: p.vocal,
        highMid: p.highMid,
        treble: p.treble,
      },
    }));
  };

  const handleTestTone = (freq: number, type: OscillatorType, label: string) => {
    if (isPlayingTestTone === label) {
      audioEngine.stopTestTone();
      setIsPlayingTestTone(null);
    } else {
      audioEngine.playTestTone(freq, type);
      setIsPlayingTestTone(label);
    }
  };

  const handleExportEQ = () => {
    const jsonStr = JSON.stringify(settings.eq, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedPreset(true);
    setTimeout(() => setCopiedPreset(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-6 select-none animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#09171b] via-[#061215] to-[#040e11] border border-[#234b54] rounded-3xl w-full max-w-4xl p-6 md:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ambient Top Glow */}
        <div className="absolute -top-28 -right-28 w-80 h-80 bg-[#48e4ff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#183942] relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#143e47] to-[#0a1f24] border border-[#48e4ff]/40 flex items-center justify-center text-[#48e4ff] shadow-lg shadow-cyan-500/20">
              <Sliders size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">
                  Spotui Master DSP & 5-Band EQ
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#48e4ff] border border-cyan-500/30">
                  48kHz / 32-bit Float
                </span>
              </div>
              <p className="text-xs text-[#8aaeb5] mt-0.5">
                Hardware-accelerated Web Audio Biquad Equalizer, Spatial Acoustics & Dynamics Limiter
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.stopTestTone();
              onClose();
            }}
            className="p-2 rounded-xl bg-[#0e242a] text-[#789d9a] hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-[#143139]">
          <button
            onClick={() => setActiveTab('eq')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'eq'
                ? 'bg-[#48e4ff] text-[#051a20] shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#0c2227]'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>5-Band Parametric EQ</span>
          </button>

          <button
            onClick={() => setActiveTab('spatial')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'spatial'
                ? 'bg-[#48e4ff] text-[#051a20] shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#0c2227]'
            }`}
          >
            <Compass size={14} />
            <span>Spatial Acoustics & Pan</span>
          </button>

          <button
            onClick={() => setActiveTab('compressor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'compressor'
                ? 'bg-[#48e4ff] text-[#051a20] shadow-md shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-[#0c2227]'
            }`}
          >
            <Activity size={14} />
            <span>Dynamics Limiter</span>
          </button>
        </div>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto space-y-6 pt-4 pr-1">
          {/* Live FFT Spectrum Analyzer Canvas */}
          <div className="p-4 rounded-2xl bg-[#051114] border border-[#16363e] relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#48e4ff] animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Live Master Bus FFT Spectrum Visualizer
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-[#789d9a]">
                <span>60Hz Sub</span>
                <span>•</span>
                <span>1kHz Mid</span>
                <span>•</span>
                <span>12kHz Air</span>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={640}
              height={100}
              className="w-full h-24 rounded-xl bg-[#030a0c] border border-[#0e242a]"
            />
          </div>

          {/* TAB 1: 5-BAND EQUALIZER */}
          {activeTab === 'eq' && (
            <div className="space-y-6">
              {/* Controls Header */}
              <div className="p-4 rounded-2xl bg-[#07171a] border border-[#173a43] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        eq: { ...prev.eq, enabled: !prev.eq.enabled },
                      }))
                    }
                    className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                      settings.eq.enabled ? 'bg-[#48e4ff]' : 'bg-[#152e34]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full transition-transform ${
                        settings.eq.enabled ? 'translate-x-6 bg-[#051a20]' : 'bg-[#789d9a]'
                      }`}
                    />
                  </button>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {settings.eq.enabled ? '5-Band DSP Active' : 'DSP Bypass Mode'}
                    </div>
                    <div className="text-[10px] font-mono text-[#789d9a]">
                      {settings.eq.enabled ? 'Hardware biquad filter nodes engaged' : 'Clean direct feed'}
                    </div>
                  </div>
                </div>

                {/* Quick Audition Test Tone Generators */}
                <div className="flex items-center gap-1.5 bg-[#091f24] p-1.5 rounded-xl border border-[#183d47]">
                  <span className="text-[10px] font-mono text-[#789d9a] px-2">Audition Tone:</span>
                  <button
                    onClick={() => handleTestTone(60, 'sine', '60hz')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition ${
                      isPlayingTestTone === '60hz'
                        ? 'bg-[#48e4ff] text-black font-bold'
                        : 'bg-[#0e272e] text-zinc-300 hover:text-white'
                    }`}
                  >
                    60Hz Sub
                  </button>
                  <button
                    onClick={() => handleTestTone(440, 'sine', '440hz')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition ${
                      isPlayingTestTone === '440hz'
                        ? 'bg-[#48e4ff] text-black font-bold'
                        : 'bg-[#0e272e] text-zinc-300 hover:text-white'
                    }`}
                  >
                    440Hz Concert
                  </button>
                  <button
                    onClick={() => handleTestTone(1000, 'triangle', '1khz')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition ${
                      isPlayingTestTone === '1khz'
                        ? 'bg-[#48e4ff] text-black font-bold'
                        : 'bg-[#0e272e] text-zinc-300 hover:text-white'
                    }`}
                  >
                    1kHz Mid
                  </button>
                </div>
              </div>

              {/* Presets Selector Grid */}
              <div>
                <div className="text-xs font-bold text-white mb-2.5 flex items-center justify-between">
                  <span>Pro Studio EQ Presets</span>
                  <span className="text-[11px] font-mono text-[#789d9a]">Click preset to load curve</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(eqPresets).map(([pName, p]) => (
                    <button
                      key={pName}
                      onClick={() => applyPreset(pName)}
                      className="p-3 rounded-xl bg-[#08181c] hover:bg-[#0f2e36] border border-[#163840] hover:border-[#48e4ff]/50 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-white group-hover:text-[#48e4ff] truncate">
                        {pName}
                      </div>
                      <div className="text-[10px] text-[#789d9a] truncate mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5-Band Slider Deck */}
              <div className="grid grid-cols-5 gap-3 p-5 rounded-2xl bg-[#061215] border border-[#15343d]">
                {[
                  { label: 'Sub-Bass', freq: '60 Hz', type: 'Low Shelf', key: 'bass' as const },
                  { label: 'Low-Mid', freq: '250 Hz', type: 'Peaking', key: 'lowMid' as const },
                  { label: 'Vocal / Mid', freq: '1.0 kHz', type: 'Peaking', key: 'vocal' as const },
                  { label: 'High-Mid', freq: '4.0 kHz', type: 'Peaking', key: 'highMid' as const },
                  { label: 'Treble Air', freq: '12.0 kHz', type: 'High Shelf', key: 'treble' as const },
                ].map((band) => {
                  const val = settings.eq[band.key];
                  return (
                    <div
                      key={band.label}
                      className="p-4 rounded-xl bg-[#081b20] border border-[#193e48] flex flex-col items-center text-center relative group"
                    >
                      <span className="text-xs font-bold text-white mb-0.5">{band.label}</span>
                      <span className="text-[10px] font-mono text-[#48e4ff] font-bold">{band.freq}</span>
                      <span className="text-[9px] font-mono text-zinc-500 mb-6">{band.type}</span>

                      {/* Vertical Slider */}
                      <div className="h-32 flex items-center justify-center my-4">
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="0.5"
                          disabled={!settings.eq.enabled}
                          value={val}
                          onChange={(e) => {
                            const newVal = parseFloat(e.target.value);
                            onUpdateSettings((prev) => ({
                              ...prev,
                              eq: { ...prev.eq, [band.key]: newVal },
                            }));
                          }}
                          className="w-32 -rotate-90 accent-[#48e4ff] cursor-pointer disabled:opacity-30"
                        />
                      </div>

                      <div className="mt-2 text-xs font-mono font-bold px-2 py-1 rounded bg-[#040e11] border border-[#14323a] text-[#48e4ff] min-w-[50px]">
                        {val > 0 ? `+${val}` : val} dB
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SPATIAL ACOUSTICS */}
          {activeTab === 'spatial' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#061215] border border-[#15343d] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Spatial Soundstage Mode</h3>
                    <p className="text-xs text-[#789d9a] mt-0.5">
                      Binaural psychoacoustic stereo expansion and virtual venue positioning.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(['off', 'studio', 'wide', 'immersive', 'cinema'] as SpatialMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() =>
                        onUpdateSettings((prev) => ({
                          ...prev,
                          spatial: { ...prev.spatial, mode },
                        }))
                      }
                      className={`p-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        settings.spatial.mode === mode
                          ? 'bg-[#48e4ff] text-black shadow-md shadow-cyan-500/20'
                          : 'bg-[#081a1e] text-zinc-300 hover:bg-[#0f2e36] border border-[#183d47]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-[#133139]">
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>Stereo Width Multiplier:</span>
                    <span className="font-mono text-[#48e4ff] font-bold">
                      {settings.spatial.stereoWidth}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={settings.spatial.stereoWidth}
                    onChange={(e) => {
                      const w = parseInt(e.target.value);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        spatial: { ...prev.spatial, stereoWidth: w },
                      }));
                    }}
                    className="w-full accent-[#48e4ff] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span>0% (Pure Mono)</span>
                    <span>100% (Standard Stereo)</span>
                    <span>200% (Ultra-Wide Cinema)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DYNAMICS COMPRESSOR */}
          {activeTab === 'compressor' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#061215] border border-[#15343d] space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Hardware Dynamics Compressor</h3>
                    <p className="text-xs text-[#789d9a] mt-0.5">
                      Smooth peaks and prevent harmonic distortion during aggressive EQ boosts.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        compressor: { ...prev.compressor, enabled: !prev.compressor.enabled },
                      }))
                    }
                    className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                      settings.compressor.enabled ? 'bg-[#48e4ff]' : 'bg-[#152e34]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full transition-transform ${
                        settings.compressor.enabled ? 'translate-x-6 bg-[#051a20]' : 'bg-[#789d9a]'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#081b20] border border-[#183d47] space-y-2">
                    <div className="flex items-center justify-between text-xs text-white">
                      <span>Threshold Level:</span>
                      <span className="font-mono text-[#48e4ff] font-bold">
                        {settings.compressor.threshold} dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="0"
                      step="1"
                      disabled={!settings.compressor.enabled}
                      value={settings.compressor.threshold}
                      onChange={(e) => {
                        const t = parseInt(e.target.value);
                        onUpdateSettings((prev) => ({
                          ...prev,
                          compressor: { ...prev.compressor, threshold: t },
                        }));
                      }}
                      className="w-full accent-[#48e4ff] cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-[#081b20] border border-[#183d47] space-y-2">
                    <div className="flex items-center justify-between text-xs text-white">
                      <span>Compression Ratio:</span>
                      <span className="font-mono text-[#48e4ff] font-bold">
                        {settings.compressor.ratio}:1
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      disabled={!settings.compressor.enabled}
                      value={settings.compressor.ratio}
                      onChange={(e) => {
                        const r = parseInt(e.target.value);
                        onUpdateSettings((prev) => ({
                          ...prev,
                          compressor: { ...prev.compressor, ratio: r },
                        }));
                      }}
                      className="w-full accent-[#48e4ff] cursor-pointer disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="mt-5 pt-4 border-t border-[#183942] flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onUpdateSettings((prev) => ({
                  ...prev,
                  eq: { enabled: true, bass: 0, lowMid: 0, vocal: 0, highMid: 0, treble: 0 },
                  spatial: { mode: 'off', stereoWidth: 100, reverbWet: 0 },
                  compressor: { enabled: true, threshold: -12, ratio: 4 },
                }))
              }
              className="px-3.5 py-2 rounded-xl bg-[#0e242a] hover:bg-[#143e47] text-xs text-zinc-300 hover:text-white border border-[#1d3c45] transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Curve to Flat</span>
            </button>

            <button
              onClick={handleExportEQ}
              className="px-3.5 py-2 rounded-xl bg-[#0e242a] hover:bg-[#143e47] text-xs text-cyan-300 hover:text-white border border-[#1d3c45] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>{copiedPreset ? 'Copied to Clipboard!' : 'Export Preset'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              audioEngine.stopTestTone();
              onClose();
            }}
            className="px-6 py-2.5 bg-[#48e4ff] hover:bg-[#8df5be] text-[#051a20] font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-500/25 cursor-pointer"
          >
            Apply & Return to Deck
          </button>
        </div>
      </div>
    </div>
  );
};

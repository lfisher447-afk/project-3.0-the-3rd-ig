import { AppSettings, EQBandCount, Track } from '../types';
import { BAND_CONFIGURATIONS, calculateAutoGainCompensation } from './eqConfig';

class SpotuiAudioEngine {
  private ctx: AudioContext | null = null;
  private audio: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preAmpGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private captureDestinationNode: MediaStreamAudioDestinationNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private currentBandCount: EQBandCount = 5;
  private currentQMultiplier: number = 1.0;
  private currentObjectUrl: string | null = null;
  private currentTrack: Track | null = null;
  private isSourceConnected: boolean = false;
  private testToneOsc: OscillatorNode | null = null;
  private testToneGain: GainNode | null = null;

  private onTimeUpdateCallback: ((time: number, duration: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;
  private stateChangeListeners: Array<(state: { currentTime: number; duration: number; isLooping: boolean }) => void> = [];
  private isLooping: boolean = false;
  private hasTriggeredEndedForCurrentTrack: boolean = false;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';

    this.audio.addEventListener('timeupdate', () => {
      this.notifyStateChange();
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audio.currentTime, this.audio.duration || 0);
      }

      // Stream End Watchdog:
      // Certain chunked HTTP/WebM streams pause at the end of the byte stream without firing the native 'ended' event
      if (
        !this.isLooping &&
        !this.hasTriggeredEndedForCurrentTrack &&
        this.audio.duration > 2 &&
        this.audio.currentTime >= this.audio.duration - 0.3 &&
        (this.audio.paused || this.audio.ended)
      ) {
        this.hasTriggeredEndedForCurrentTrack = true;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    });

    this.audio.addEventListener('ended', () => {
      this.notifyStateChange();
      if (!this.hasTriggeredEndedForCurrentTrack) {
        this.hasTriggeredEndedForCurrentTrack = true;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('Audio stream encounter, attempting backup channel:', e);
      if (this.onErrorCallback) {
        this.onErrorCallback('Audio stream recovering...');
      }
    });
  }

  public onStateChange(cb: (state: { currentTime: number; duration: number; isLooping: boolean }) => void) {
    this.stateChangeListeners.push(cb);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter((l) => l !== cb);
    };
  }

  public setLooping(loop: boolean) {
    this.isLooping = loop;
    this.audio.loop = loop;
    this.notifyStateChange();
  }

  private notifyStateChange() {
    const state = {
      currentTime: this.audio.currentTime || 0,
      duration: this.audio.duration || 0,
      isLooping: this.isLooping,
    };
    this.stateChangeListeners.forEach((fn) => fn(state));
  }

  public initAudioContext() {
    if (this.ctx && this.ctx.state !== 'closed') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });

      this.preAmpGainNode = this.ctx.createGain();
      this.masterGainNode = this.ctx.createGain();
      this.compressorNode = this.ctx.createDynamicsCompressor();
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.85;

      if (this.ctx.createMediaStreamDestination) {
        this.captureDestinationNode = this.ctx.createMediaStreamDestination();
      }

      if (this.ctx.createStereoPanner) {
        this.pannerNode = this.ctx.createStereoPanner();
      }

      // Rebuild initial EQ chain (5 bands default)
      this.rebuildEQFilters(this.currentBandCount, this.currentQMultiplier);

      this.compressorNode.connect(this.masterGainNode);

      if (this.pannerNode) {
        this.masterGainNode.connect(this.pannerNode);
        this.pannerNode.connect(this.analyserNode);
      } else {
        this.masterGainNode.connect(this.analyserNode);
      }

      this.analyserNode.connect(this.ctx.destination);

      if (this.captureDestinationNode) {
        this.analyserNode.connect(this.captureDestinationNode);
      }

      // Connect media element source
      try {
        if (!this.isSourceConnected) {
          this.sourceNode = this.ctx.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.preAmpGainNode);
          this.isSourceConnected = true;
        }
      } catch (e) {
        console.warn('MediaElementSource already connected or CORS isolated:', e);
      }
    } catch (e) {
      console.warn('Web Audio API context init fallback:', e);
    }
  }

  /**
   * Dynamically constructs the BiquadFilterNode chain for any supported band count
   */
  public rebuildEQFilters(bandCount: EQBandCount, qMultiplier = 1.0) {
    if (!this.ctx || !this.preAmpGainNode || !this.compressorNode) return;

    // Disconnect old filters safely
    try {
      this.preAmpGainNode.disconnect();
    } catch {}

    this.eqFilters.forEach((f) => {
      try {
        f.disconnect();
      } catch {}
    });

    const bandDefs = BAND_CONFIGURATIONS[bandCount] || BAND_CONFIGURATIONS[5];
    this.currentBandCount = bandCount;
    this.currentQMultiplier = qMultiplier;

    this.eqFilters = bandDefs.map((def) => {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = def.type;
      filter.frequency.value = def.freq;
      filter.gain.value = 0;
      if (def.type === 'peaking') {
        filter.Q.value = Math.max(0.1, def.defaultQ * qMultiplier);
      } else {
        filter.Q.value = def.defaultQ;
      }
      return filter;
    });

    // Wire chain: preAmpGainNode -> filter[0] -> ... -> filter[n-1] -> compressorNode
    let lastNode: AudioNode = this.preAmpGainNode;
    this.eqFilters.forEach((filter) => {
      lastNode.connect(filter);
      lastNode = filter;
    });

    lastNode.connect(this.compressorNode);
  }

  public async playTrack(track: Track, startTime = 0): Promise<void> {
    this.currentTrack = track;
    this.hasTriggeredEndedForCurrentTrack = false;
    this.initAudioContext();
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume().catch(() => {});
    }

    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }

    let targetSrc = '';
    if (track.blob) {
      this.currentObjectUrl = URL.createObjectURL(track.blob);
      targetSrc = this.currentObjectUrl;
    } else if (track.streamUrl && track.streamUrl.startsWith('http') && !track.streamUrl.includes('/api/audio/stream')) {
      targetSrc = track.streamUrl;
    } else {
      const cleanId = track.id.replace(/^(yt_|sp_bridge_|sp_)/, '');
      targetSrc = `/api/audio/stream?id=${encodeURIComponent(cleanId)}`;
    }

    this.audio.src = targetSrc;
    this.audio.currentTime = startTime;

    try {
      await this.audio.play();
    } catch (err: any) {
      console.warn('Playback standard route encounter, retrying with direct audio fallback:', err);
      try {
        if (track.streamUrl && track.streamUrl.startsWith('http')) {
          this.audio.src = track.streamUrl;
          await this.audio.play();
        }
      } catch (e) {
        console.error('Final fallback error:', e);
      }
    }
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public play() {
    this.initAudioContext();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.audio.play();
  }

  public pause() {
    this.audio.pause();
  }

  public seek(seconds: number) {
    if (Number.isFinite(seconds) && seconds >= 0) {
      this.audio.currentTime = seconds;
    }
  }

  public setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  public setPlaybackRate(rate: number) {
    this.audio.playbackRate = Math.max(0.25, Math.min(3.0, rate));
  }

  public applySettings(settings?: AppSettings) {
    if (!settings) return;
    this.initAudioContext();
    if (!this.ctx) return;

    const currTime = this.ctx.currentTime;
    const isEqEnabled = Boolean(settings.eq?.enabled);
    const targetBandCount: EQBandCount = settings.eq?.bandCount || 5;
    const qMultiplier = settings.eq?.qFactorMultiplier || 1.0;

    // Check if filter chain needs reconfiguration
    if (
      this.eqFilters.length !== targetBandCount ||
      this.currentBandCount !== targetBandCount ||
      Math.abs(this.currentQMultiplier - qMultiplier) > 0.01
    ) {
      this.rebuildEQFilters(targetBandCount, qMultiplier);
    }

    // Resolve gains array
    let activeGains: number[] = [];
    if (Array.isArray(settings.eq?.gains) && settings.eq.gains.length === targetBandCount) {
      activeGains = settings.eq.gains;
    } else if (settings.eq?.modeGains && settings.eq.modeGains[targetBandCount]) {
      activeGains = settings.eq.modeGains[targetBandCount]!;
    } else if (targetBandCount === 5) {
      activeGains = [
        settings.eq.bass ?? 0,
        settings.eq.lowMid ?? 0,
        settings.eq.vocal ?? 0,
        settings.eq.highMid ?? 0,
        settings.eq.treble ?? 0,
      ];
    } else {
      activeGains = new Array(targetBandCount).fill(0);
    }

    // Pre-Amp & Auto Gain Loudness Compensation
    if (this.preAmpGainNode) {
      const manualPreAmpDb = settings.eq?.preAmpGain ?? 0;
      const autoCompDb = (isEqEnabled && settings.eq?.autoGainCompensation)
        ? calculateAutoGainCompensation(activeGains)
        : 0;
      const totalPreAmpDb = isEqEnabled ? (manualPreAmpDb + autoCompDb) : 0;
      const linearPreAmp = Math.max(0.05, Math.min(4.0, Math.pow(10, totalPreAmpDb / 20)));

      try {
        this.preAmpGainNode.gain.setTargetAtTime(linearPreAmp, currTime, 0.03);
      } catch {
        this.preAmpGainNode.gain.value = linearPreAmp;
      }
    }

    // Apply Filter Gains
    this.eqFilters.forEach((f, i) => {
      const targetGain = isEqEnabled ? (activeGains[i] ?? 0) : 0;
      try {
        f.gain.setTargetAtTime(targetGain, currTime, 0.02);
      } catch {
        f.gain.value = targetGain;
      }
    });

    // Apply Compressor
    if (this.compressorNode && settings.compressor) {
      const isCompEnabled = Boolean(settings.compressor.enabled);
      const thresholdVal = isCompEnabled ? (settings.compressor.threshold ?? -12) : 0;
      const ratioVal = isCompEnabled ? (settings.compressor.ratio ?? 4) : 1;
      try {
        this.compressorNode.threshold.setTargetAtTime(thresholdVal, currTime, 0.03);
        this.compressorNode.ratio.setTargetAtTime(ratioVal, currTime, 0.03);
      } catch {
        this.compressorNode.threshold.value = thresholdVal;
        this.compressorNode.ratio.value = ratioVal;
      }
    }

    // Apply Spatial Stereo Panning
    if (this.pannerNode && settings.spatial) {
      const panValue = ((settings.spatial.stereoWidth ?? 100) - 100) / 100;
      const isSpatialOn = settings.spatial.mode && settings.spatial.mode !== 'off';
      const targetPan = isSpatialOn ? Math.max(-1, Math.min(1, panValue)) : 0;
      try {
        this.pannerNode.pan.setTargetAtTime(targetPan, currTime, 0.03);
      } catch {
        this.pannerNode.pan.value = targetPan;
      }
    }

    // Master Gain
    if (this.masterGainNode) {
      const targetGain = 1.0;
      try {
        this.masterGainNode.gain.setTargetAtTime(targetGain, currTime, 0.03);
      } catch {
        this.masterGainNode.gain.value = targetGain;
      }
    }

    // Sync HTML5 Audio properties with settings
    if (settings.playback) {
      const vol = settings.playback.muted ? 0 : (settings.playback.volume ?? 1);
      this.setVolume(vol);
      if (typeof settings.playback.playbackRate === 'number') {
        this.setPlaybackRate(settings.playback.playbackRate);
      }
      const shouldLoop = settings.playback.repeatMode === 'one';
      if (this.isLooping !== shouldLoop) {
        this.setLooping(shouldLoop);
      }
    }
  }

  // Play a test tone to audition the EQ even if no music is loaded
  public playTestTone(frequency = 440, type: OscillatorType = 'sine') {
    this.initAudioContext();
    if (!this.ctx || !this.preAmpGainNode) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.stopTestTone();

    this.testToneOsc = this.ctx.createOscillator();
    this.testToneGain = this.ctx.createGain();

    this.testToneOsc.type = type;
    this.testToneOsc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
    this.testToneGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    this.testToneOsc.connect(this.testToneGain);
    this.testToneGain.connect(this.preAmpGainNode);

    this.testToneOsc.start();
  }

  // Play calibrated pink noise (1/f spectral density) for room acoustic calibration
  public playPinkNoise() {
    this.initAudioContext();
    if (!this.ctx || !this.preAmpGainNode) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.stopTestTone();

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    this.testToneGain = this.ctx.createGain();
    this.testToneGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    noiseSource.connect(this.testToneGain);
    this.testToneGain.connect(this.preAmpGainNode);

    noiseSource.start();
    (this as any)._noiseSource = noiseSource;
  }

  // Play a logarithmic frequency sweep from 20Hz to 20kHz
  public playSweep(duration = 4) {
    this.initAudioContext();
    if (!this.ctx || !this.preAmpGainNode) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.stopTestTone();

    this.testToneOsc = this.ctx.createOscillator();
    this.testToneGain = this.ctx.createGain();

    this.testToneOsc.type = 'sine';
    const now = this.ctx.currentTime;
    this.testToneOsc.frequency.setValueAtTime(20, now);
    this.testToneOsc.frequency.exponentialRampToValueAtTime(20000, now + duration);
    this.testToneGain.gain.setValueAtTime(0.2, now);

    this.testToneOsc.connect(this.testToneGain);
    this.testToneGain.connect(this.preAmpGainNode);

    this.testToneOsc.start();
    this.testToneOsc.stop(now + duration);
    this.testToneOsc.onended = () => {
      this.stopTestTone();
    };
  }

  public stopTestTone() {
    if (this.testToneOsc) {
      try {
        this.testToneOsc.stop();
        this.testToneOsc.disconnect();
      } catch {}
      this.testToneOsc = null;
    }
    if ((this as any)._noiseSource) {
      try {
        (this as any)._noiseSource.stop();
        (this as any)._noiseSource.disconnect();
      } catch {}
      (this as any)._noiseSource = null;
    }
    if (this.testToneGain) {
      try {
        this.testToneGain.disconnect();
      } catch {}
      this.testToneGain = null;
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(64);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  public getTimeDomainData(): Uint8Array {
    if (!this.analyserNode) return new Uint8Array(64);
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(data);
    return data;
  }

  public setAnalyserFftSize(size: number) {
    if (this.analyserNode && [128, 256, 512, 1024, 2048].includes(size)) {
      this.analyserNode.fftSize = size;
    }
  }

  public getCompressionReduction(): number {
    if (!this.compressorNode) return 0;
    return this.compressorNode.reduction || 0;
  }

  public getSampleRate(): number {
    return this.ctx?.sampleRate || 48000;
  }

  public onTimeUpdate(cb: (time: number, duration: number) => void) {
    this.onTimeUpdateCallback = cb;
  }

  public onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  public onError(cb: (err: string) => void) {
    this.onErrorCallback = cb;
  }
}

export const audioEngine = new SpotuiAudioEngine();

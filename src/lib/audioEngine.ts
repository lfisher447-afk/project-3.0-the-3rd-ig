import { AppSettings, Track } from '../types';

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

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';

    this.audio.addEventListener('timeupdate', () => {
      this.notifyStateChange();
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audio.currentTime, this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.notifyStateChange();
      if (this.onEndedCallback) {
        this.onEndedCallback();
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

      // Create 5-band EQ: 60Hz (Sub), 250Hz (Bass), 1000Hz (Vocal), 4000Hz (HighMid), 12000Hz (Treble)
      const frequencies = [60, 250, 1000, 4000, 12000];
      const types: BiquadFilterType[] = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];

      this.eqFilters = frequencies.map((freq, i) => {
        const filter = this.ctx!.createBiquadFilter();
        filter.type = types[i];
        filter.frequency.value = freq;
        filter.gain.value = 0;
        if (types[i] === 'peaking') {
          filter.Q.value = 1.0;
        }
        return filter;
      });

      // Chain: PreAmp -> EQ Filters (5 Bands) -> Compressor -> MasterGain -> Panner -> Analyser -> Destination
      let lastNode: AudioNode = this.preAmpGainNode;

      this.eqFilters.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });

      lastNode.connect(this.compressorNode);
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

  public async playTrack(track: Track, startTime = 0): Promise<void> {
    this.currentTrack = track;
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

    // Apply 5-Band EQ Gains
    if (this.eqFilters && this.eqFilters.length === 5 && settings.eq) {
      const isEqEnabled = Boolean(settings.eq.enabled);
      const gains = [
        isEqEnabled ? (settings.eq.bass ?? 0) : 0,
        isEqEnabled ? (settings.eq.lowMid ?? 0) : 0,
        isEqEnabled ? (settings.eq.vocal ?? 0) : 0,
        isEqEnabled ? (settings.eq.highMid ?? 0) : 0,
        isEqEnabled ? (settings.eq.treble ?? 0) : 0,
      ];
      this.eqFilters.forEach((f, i) => {
        try {
          f.gain.setTargetAtTime(gains[i], currTime, 0.03);
        } catch {
          f.gain.value = gains[i];
        }
      });
    }

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

  public stopTestTone() {
    if (this.testToneOsc) {
      try {
        this.testToneOsc.stop();
        this.testToneOsc.disconnect();
      } catch {}
      this.testToneOsc = null;
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

import { proxy } from "valtio";
import { audioTracks, defaultAudioTrackId, getAudioTrackById } from "../media/tracks";

export type AudioSource = "mic" | "music";
export type AudioModeIndex = 0 | 1 | 2;

const MODE_ROTATION_MS = 5000;
const BUCKET_COUNT = 10;
type FrequencyDataArray = Parameters<AnalyserNode["getByteFrequencyData"]>[0];

export const audioModes = [
  {
    id: "quake",
    label: "Mode 1 · Rafistole Quake",
    description: "Tous les elements vibrent, comme si la salle serveur dansait.",
  },
  {
    id: "flux",
    label: "Mode 2 · Flux Glitch",
    description: "Filtres chromatiques et halos reagissent aux frequences.",
  },
  {
    id: "jukebox",
    label: "Mode 3 · Ondes Jukebox",
    description: "Des ondes neon jaillissent des bords comme un dancefloor retro.",
  },
] as const;

export type AudioVizState = {
  active: boolean;
  source: AudioSource | null;
  mode: AudioModeIndex;
  intensity: number;
  burst: number;
  peak: number;
  bands: number[];
  colorHue: number;
  trackId: string;
  modeVersion: number;
  lastError: string | null;
};

const makeEmptyBuckets = () => Array.from({ length: BUCKET_COUNT }, () => 0);

const applyCssDynamics = (
  intensity: number,
  burst: number,
  glitch: number,
  vivid: number,
  hueDegrees: number,
  strobe: number,
  strobeSpeed: number,
) => {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.style.setProperty("--audio-intensity", intensity.toFixed(3));
  root.style.setProperty("--audio-burst", burst.toFixed(3));
  root.style.setProperty("--audio-glitch-strength", glitch.toFixed(3));
  root.style.setProperty("--audio-color-pop", vivid.toFixed(3));
  root.style.setProperty("--audio-hue", `${hueDegrees.toFixed(1)}deg`);
  root.style.setProperty("--audio-strobe-strength", strobe.toFixed(3));
  root.style.setProperty("--audio-strobe-speed", `${strobeSpeed.toFixed(3)}s`);
  const shakeSpeed = Math.max(0.05, 0.42 - burst * 0.35);
  root.style.setProperty("--audio-shake-speed", `${shakeSpeed.toFixed(3)}s`);
  root.style.setProperty("--audio-spectrum-bloom", (0.2 + vivid * 0.8).toFixed(3));
};

const computeFrequencyBuckets = (array: Uint8Array) => {
  const bucketSize = Math.max(1, Math.floor(array.length / BUCKET_COUNT));
  const buckets: number[] = [];
  for (let i = 0; i < BUCKET_COUNT; i += 1) {
    const start = i * bucketSize;
    const end = i === BUCKET_COUNT - 1 ? array.length : Math.min(array.length, start + bucketSize);
    if (start >= array.length) {
      buckets.push(0);
      continue;
    }
    let sum = 0;
    for (let j = start; j < end; j += 1) {
      sum += array[j];
    }
    const avg = sum / Math.max(1, end - start);
    buckets.push(Math.min(1, avg / 255));
  }
  return buckets;
};

export const audioVizState = proxy<AudioVizState>({
  active: false,
  source: null,
  mode: 0,
  intensity: 0,
  burst: 0,
  peak: 0,
  bands: makeEmptyBuckets(),
  colorHue: 210,
  trackId: defaultAudioTrackId,
  modeVersion: 0,
  lastError: null,
});

let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: FrequencyDataArray | null = null;
let rafId: number | null = null;
let modeTimer: number | null = null;
let micStream: MediaStream | null = null;
let musicElement: HTMLAudioElement | null = null;
let musicSource: MediaElementAudioSourceNode | null = null;
let noiseTracker = 0.3;
let peakTracker = 0.4;

const ensureAudioContext = () => {
  if (typeof window === "undefined") {
    throw new Error("AudioContext unavailable côté serveur");
  }
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
};

const cancelRaf = () => {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
};

const clearModeTimer = () => {
  if (modeTimer) {
    window.clearInterval(modeTimer);
    modeTimer = null;
  }
};

const updateIntensityLoop = () => {
  if (!analyser || !dataArray) {
    return;
  }
  const buffer = dataArray as FrequencyDataArray;
  analyser.getByteFrequencyData(buffer);

  let sumSquares = 0;
  let maxValue = 0;
  let lows = 0;
  let highs = 0;
  const lowBound = Math.floor(buffer.length * 0.35);
  const highBound = Math.floor(buffer.length * 0.65);

  for (let i = 0; i < buffer.length; i += 1) {
    const value = buffer[i];
    sumSquares += value * value;
    if (value > maxValue) {
      maxValue = value;
    }
    if (i < lowBound) {
      lows += value;
    }
    if (i > highBound) {
      highs += value;
    }
  }

  const rms = Math.sqrt(sumSquares / Math.max(1, buffer.length)) / 255;
  const peak = maxValue / 255;
  const lowAvg = lows / Math.max(1, lowBound);
  const highAvg = highs / Math.max(1, buffer.length - highBound);
  const tilt = Math.max(0, highAvg - lowAvg) / 255;

  noiseTracker = noiseTracker * 0.9 + rms * 0.1;
  peakTracker = peakTracker * 0.88 + peak * 0.12;

  const signal = rms * 0.65 + peak * 0.35;
  const floorFactor = audioVizState.source === "mic" ? 1.9 : 1.25;
  const ceilingFactor = audioVizState.source === "mic" ? 1.7 : 1.2;
  const floor = Math.min(0.8, noiseTracker * floorFactor);
  const ceiling = Math.min(1.4, Math.max(floor + 0.12, peakTracker * ceilingFactor));
  const normalizedRaw = (signal - floor) / Math.max(0.12, ceiling - floor);
  const normalized = Math.min(1, Math.max(0, normalizedRaw));
  const eased = Math.pow(normalized, audioVizState.source === "mic" ? 0.78 : 0.9);
  const burstBase = Math.max(0, (peak - floor) / Math.max(0.1, ceiling - floor));
  const burst = Math.min(1, (burstBase * 0.7 + eased * 0.3) * (audioVizState.source === "mic" ? 1.5 : 1.25));
  const glitch = Math.min(1, eased * 1.2 + tilt * 0.6);
  const vivid = Math.min(1, eased * (1.15 + tilt * 0.6));
  const hue = (212 + tilt * 220 + burst * 60) % 360;
  const strobe = Math.min(1, 0.15 + burst * 0.95);
  const strobeSpeed = Math.max(0.08, 0.45 - burst * 0.36);

  audioVizState.intensity = eased;
  audioVizState.burst = burst;
  audioVizState.peak = peak;
  audioVizState.bands = computeFrequencyBuckets(buffer);
  audioVizState.colorHue = hue;
  applyCssDynamics(eased, burst, glitch, vivid, hue, strobe, strobeSpeed);
  rafId = requestAnimationFrame(updateIntensityLoop);
};

const initAnalyser = (node: AudioNode, { monitor }: { monitor?: boolean } = {}) => {
  const ctx = ensureAudioContext();
  analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  dataArray = new Uint8Array(analyser.frequencyBinCount) as FrequencyDataArray;
  cancelRaf();
  node.connect(analyser);
  if (monitor) {
    analyser.connect(ctx.destination);
  }
  updateIntensityLoop();
};

const stopMicStream = () => {
  if (!micStream) {
    return;
  }
  micStream.getTracks().forEach((track) => track.stop());
  micStream = null;
};

const stopMusicTrack = () => {
  if (musicElement) {
    musicElement.pause();
    musicElement.src = "";
    musicElement.load();
    musicElement = null;
  }
  if (musicSource) {
    musicSource.disconnect();
    musicSource = null;
  }
};

const resolveTrack = () => {
  if (!audioTracks.length) {
    return null;
  }
  const match = getAudioTrackById(audioVizState.trackId);
  if (match) {
    return match;
  }
  audioVizState.trackId = audioTracks[0].id;
  return audioTracks[0];
};

const startMusicTrack = async (ctx: AudioContext) => {
  const track = resolveTrack();
  if (!track) {
    throw new Error("Aucune piste audio disponible");
  }
  stopMusicTrack();
  const element = new Audio(track.url);
  element.loop = true;
  element.crossOrigin = "anonymous";
  musicElement = element;
  const source = ctx.createMediaElementSource(element);
  musicSource = source;
  initAnalyser(source, { monitor: true });
  try {
    await element.play();
  } catch (error) {
    throw new Error("La lecture est bloquee, autorisez le son dans votre navigateur.");
  }
};

const resetAnalyser = () => {
  cancelRaf();
  if (analyser) {
    analyser.disconnect();
    analyser = null;
  }
  dataArray = null;
  audioVizState.intensity = 0;
  audioVizState.burst = 0;
  audioVizState.peak = 0;
  audioVizState.bands = makeEmptyBuckets();
  audioVizState.colorHue = 210;
  noiseTracker = 0.3;
  peakTracker = 0.4;
  applyCssDynamics(0, 0, 0, 0, 210, 0, 0.4);
};

const startMicrophone = async () => {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Micro non disponible dans ce navigateur");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  micStream = stream;
  const ctx = ensureAudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyserGain = ctx.createGain();
  analyserGain.gain.value = 1;
  source.connect(analyserGain);
  initAnalyser(analyserGain, { monitor: false });
};

const switchMode = (next: AudioModeIndex) => {
  audioVizState.mode = next;
  audioVizState.modeVersion += 1;
};

const startModeRotation = () => {
  clearModeTimer();
  modeTimer = window.setInterval(() => {
    const next = ((audioVizState.mode + 1) % audioModes.length) as AudioModeIndex;
    switchMode(next);
  }, MODE_ROTATION_MS);
};

export const stopAudioViz = () => {
  stopMicStream();
  stopMusicTrack();
  resetAnalyser();
  clearModeTimer();
  audioVizState.active = false;
  audioVizState.source = null;
  switchMode(0);
};

export const activateAudioViz = async (source: AudioSource) => {
  try {
    audioVizState.lastError = null;
    const ctx = ensureAudioContext();
    stopAudioViz();
    if (source === "mic") {
      await startMicrophone();
    } else {
      await startMusicTrack(ctx);
    }
    audioVizState.source = source;
    audioVizState.active = true;
    switchMode(0);
    startModeRotation();
  } catch (error) {
    if (error instanceof Error) {
      audioVizState.lastError = error.message;
    } else {
      audioVizState.lastError = "Activation audio impossible";
    }
    stopAudioViz();
    throw error;
  }
};

export const toggleAudioSource = async (source: AudioSource) => {
  if (audioVizState.active && audioVizState.source === source) {
    stopAudioViz();
    return;
  }
  await activateAudioViz(source);
};

export const getActiveModeMeta = () => audioModes[audioVizState.mode];

export const setAudioTrack = async (trackId: string) => {
  if (!audioTracks.length) {
    return;
  }
  const next = getAudioTrackById(trackId) ?? audioTracks[0];
  audioVizState.trackId = next.id;
  if (audioVizState.active && audioVizState.source === "music") {
    await activateAudioViz("music");
  }
};

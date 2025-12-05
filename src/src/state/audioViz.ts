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
  bands: number[];
  trackId: string;
  modeVersion: number;
  lastError: string | null;
};

const makeEmptyBuckets = () => Array.from({ length: BUCKET_COUNT }, () => 0);

const applyCssDynamics = (intensity: number, burst: number, glitch: number, vivid: number) => {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.style.setProperty("--audio-intensity", intensity.toFixed(3));
  root.style.setProperty("--audio-burst", burst.toFixed(3));
  root.style.setProperty("--audio-glitch-strength", glitch.toFixed(3));
  root.style.setProperty("--audio-color-pop", vivid.toFixed(3));
  const shakeSpeed = Math.max(0.06, 0.45 - burst * 0.33);
  root.style.setProperty("--audio-shake-speed", `${shakeSpeed.toFixed(3)}s`);
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
  bands: makeEmptyBuckets(),
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
  const avg = buffer.reduce((sum, value) => sum + value, 0) / buffer.length;
  const normalized = Math.min(1, avg / 160);
  const sourceBoost = audioVizState.source === "mic" ? 1.7 : 1.25;
  const boosted = Math.min(1, normalized * sourceBoost);
  const eased = Math.min(1, Math.pow(boosted, audioVizState.source === "mic" ? 0.7 : 0.85));
  const burst = Math.min(1, boosted * (audioVizState.source === "mic" ? 1.35 : 1.15));
  const glitch = Math.min(1, burst * 1.4);
  const vivid = Math.min(1, burst * (audioVizState.source === "music" ? 1.4 : 1));
  audioVizState.intensity = eased;
  audioVizState.burst = burst;
  audioVizState.bands = computeFrequencyBuckets(buffer);
  applyCssDynamics(eased, burst, glitch, vivid);
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
  audioVizState.bands = makeEmptyBuckets();
  applyCssDynamics(0, 0, 0, 0);
};

const startMicrophone = async () => {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Micro non disponible dans ce navigateur");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  micStream = stream;
  const ctx = ensureAudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const silentGain = ctx.createGain();
  silentGain.gain.value = 0;
  source.connect(silentGain);
  initAnalyser(silentGain, { monitor: false });
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

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
  meterLevel: number;
  hyperLevel: number;
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
  beamStrength: number,
  hyper: number,
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
  root.style.setProperty("--audio-beam-strength", beamStrength.toFixed(3));
  root.style.setProperty("--audio-hyper", hyper.toFixed(3));
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
  meterLevel: 0,
  hyperLevel: 0,
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
let meterValue = 0;
let bassTracker = 0.25;
let bassCeilingTracker = 0.65;

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
  let bassSum = 0;
  let bassMax = 0;
  const lowBound = Math.floor(buffer.length * 0.35);
  const highBound = Math.floor(buffer.length * 0.65);
  const bassBound = Math.max(1, Math.floor(buffer.length * 0.18));

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
    if (i < bassBound) {
      bassSum += value;
      if (value > bassMax) {
        bassMax = value;
      }
    }
  }

  const rms = Math.sqrt(sumSquares / Math.max(1, buffer.length)) / 255;
  const peak = maxValue / 255;
  const lowAvg = lows / Math.max(1, lowBound);
  const highAvg = highs / Math.max(1, buffer.length - highBound);
  const tilt = Math.max(0, highAvg - lowAvg) / 255;
  const bassAvg = bassSum / Math.max(1, bassBound) / 255;
  const bassPeak = bassMax / 255;

  noiseTracker = noiseTracker * 0.9 + rms * 0.1;
  peakTracker = peakTracker * 0.88 + peak * 0.12;
  bassTracker = bassTracker * 0.92 + bassAvg * 0.08;

  const signal = rms * 0.55 + peak * 0.45;
  const isMic = audioVizState.source === "mic";
  const baseFloor = isMic ? 0.08 : 0.22;
  const baseCeiling = isMic ? 0.55 : 0.4;
  const floor = Math.min(0.95, baseFloor + noiseTracker * (isMic ? 1.8 : 1.2));
  const ceiling = Math.min(1.35, Math.max(floor + 0.2, baseCeiling + peakTracker * (isMic ? 1.2 : 0.85)));
  const normalizedRaw = (signal - floor) / Math.max(0.25, ceiling - floor);
  const normalized = Math.min(1, Math.max(0, normalizedRaw));
  const eased = Math.min(1, Math.pow(normalized, isMic ? 0.85 : 1.2));
  const bassFloor = Math.min(0.7, bassTracker * (isMic ? 1.1 : 1.4));
  const bassHeadroom = Math.max(0.18, 1 - bassFloor);
  const bassNormalized = Math.max(0, Math.min(1, (bassAvg - bassFloor * 0.7) / bassHeadroom));
  const bassPunch = Math.min(1, bassNormalized * 1.1 + Math.max(0, bassPeak - bassFloor * 0.5) * 0.95);
  const burstBase = Math.max(0, (peak - floor * 0.85) / Math.max(0.2, ceiling - floor * 0.7));
  const burst = Math.min(
    1,
    (bassPunch * (isMic ? 0.6 : 1.05) + burstBase * 0.75 + normalized * 0.35) * (isMic ? 1.4 : 1.02),
  );
  const glitch = Math.min(1, eased * 1.25 + tilt * 0.65);
  const vivid = Math.min(1, eased * (1.3 + tilt * 0.7));
  const hue = (208 + tilt * 250 + burst * 90) % 360;
  const strobe = Math.min(1, 0.08 + burst * 1.15);
  const strobeSpeed = Math.max(0.06, 0.52 - burst * 0.45);
  const beamStrength = Math.min(1, burst * 1.1 + eased * 0.3);

  const peakEnergy = Math.max(0, peak - floor * 0.8);
  const peakWindow = Math.max(0.22, ceiling - floor * 0.75);
  const normalizedBeat = Math.min(1, peakEnergy / peakWindow);
  let meterTarget: number;
  let attack: number;
  let release: number;
  if (isMic) {
    meterTarget = Math.pow(normalizedBeat, 0.78);
    attack = 0.55;
    release = 0.12;
  } else {
    const punchFloor = 0.12;
    const punchValue = Math.max(0, bassPunch - punchFloor);
    bassCeilingTracker = Math.max(punchValue, bassCeilingTracker * 0.985);
    const adaptiveCeiling = Math.max(0.35, bassCeilingTracker * 1.1);
    const punchRatio = Math.min(1, punchValue / adaptiveCeiling);
    const groove = Math.min(1, punchRatio * 1.15 + normalized * 0.15 + normalizedBeat * 0.2);
    meterTarget = Math.pow(groove, 0.68);
    meterTarget = Math.min(0.985, meterTarget);
    attack = 0.9;
    release = 0.26;
  }
  const delta = meterTarget - meterValue;
  meterValue += delta * (delta > 0 ? attack : release);
  meterValue = Math.min(1, Math.max(0, meterValue));
  const hyper = Math.min(1, Math.max(0, meterValue - 0.9) / 0.1);

  audioVizState.intensity = eased;
  audioVizState.burst = burst;
  audioVizState.peak = peak;
  audioVizState.meterLevel = meterValue;
  audioVizState.bands = computeFrequencyBuckets(buffer);
  audioVizState.colorHue = hue;
  audioVizState.hyperLevel = hyper;
  applyCssDynamics(eased, burst, glitch, vivid, hue, strobe, strobeSpeed, beamStrength, hyper);
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
  meterValue = 0;
  bassTracker = 0.25;
  bassCeilingTracker = 0.65;
  audioVizState.hyperLevel = 0;
  applyCssDynamics(0, 0, 0, 0, 210, 0, 0.4, 0, 0);
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

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useSnapshot } from "valtio";
import { audioModes, audioVizState } from "../state/audioViz";

const stripes = Array.from({ length: 6 });

type NeonBlob = {
  id: string;
  x: number;
  y: number;
  scale: number;
  warp: number;
};

type Beam = {
  id: string;
  angle: number;
  delay: number;
};

type Pixel = {
  id: string;
  x: number;
  y: number;
  size: number;
};

function AudioWavefield() {
  const snap = useSnapshot(audioVizState);
  const mode = audioModes[snap.mode];
  const active = snap.active;
  const spectrumActive = active && snap.source === "music";

  const waves = useMemo(() => stripes.map((_, index) => index), []);
  const blobs = useMemo<NeonBlob[]>(
    () =>
      Array.from({ length: 7 }).map((_, index) => ({
        id: `blob-${index}`,
        x: Math.random(),
        y: Math.random(),
        scale: 0.7 + Math.random() * 1.8,
        warp: 0.6 + Math.random() * 0.6,
      })),
    [snap.modeVersion],
  );

  const beams = useMemo<Beam[]>(
    () =>
      Array.from({ length: 9 }).map((_, index) => ({
        id: `beam-${index}`,
        angle: Math.random() * 360,
        delay: Math.random() * 0.4,
      })),
    [snap.modeVersion],
  );

  const pixels = useMemo<Pixel[]>(
    () =>
      Array.from({ length: 24 }).map((_, index) => ({
        id: `pixel-${index}`,
        x: Math.random(),
        y: Math.random(),
        size: 0.3 + Math.random() * 1.1,
      })),
    [snap.modeVersion],
  );

  const flashSpeed = Math.max(0.22, 0.8 - snap.burst * 0.65);

  return (
    <motion.div
      className="audio-wavefield"
      data-active={active || undefined}
      data-mode={mode.id}
      data-source={snap.source ?? undefined}
      initial={false}
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      aria-hidden
    >
      <div className="audio-nebula-clouds" data-active={active || undefined}>
        {blobs.map((blob) => (
          <i
            key={blob.id}
            style={{
              left: `${blob.x * 100}%`,
              top: `${blob.y * 100}%`,
              animationDuration: `${flashSpeed + blob.warp * 0.3}s`,
              transform: `scale(${blob.scale * (1 + snap.intensity * 1.8)})`,
            }}
          />
        ))}
      </div>

      <div className="audio-beam-stack" data-active={active || undefined}>
        {beams.map((beam) => (
          <span
            key={beam.id}
            style={{
              transform: `rotate(${beam.angle}deg) scaleX(${1 + snap.intensity * 4})`,
              animationDelay: `${beam.delay}s`,
              animationDuration: `${Math.max(0.18, flashSpeed * 0.6)}s`,
            }}
          />
        ))}
      </div>

      <div className="audio-strobe-grid" data-active={active || undefined}>
        {pixels.map((pixel) => (
          <b
            key={pixel.id}
            style={{
              left: `${pixel.x * 100}%`,
              top: `${pixel.y * 100}%`,
              width: `${pixel.size * 22}px`,
              height: `${pixel.size * 22}px`,
              animationDuration: `${Math.max(0.14, flashSpeed * 0.45)}s`,
            }}
          />
        ))}
      </div>

      {waves.map((wave) => (
        <span key={wave} style={{ animationDelay: `${wave * 0.25}s` }} />
      ))}

      <div className="audio-spectrum audio-spectrum--left" data-active={spectrumActive || undefined}>
        {snap.bands.map((value, index) => (
          <i
            key={`left-${index}`}
            style={{
              transform: `scaleY(${0.4 + value * 3.3}) scaleX(${0.75 + value * 0.5})`,
              opacity: Math.max(0.2, 0.12 + value * 1.1),
              animationDelay: `${index * 0.04}s`,
            }}
          />
        ))}
      </div>

      <div className="audio-spectrum audio-spectrum--right" data-active={spectrumActive || undefined}>
        {snap.bands.map((value, index) => (
          <i
            key={`right-${index}`}
            style={{
              transform: `scaleY(${0.4 + value * 3.3}) scaleX(${0.75 + value * 0.5})`,
              opacity: Math.max(0.2, 0.12 + value * 1.1),
              animationDelay: `${index * 0.04}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default AudioWavefield;

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

type Shard = {
  id: string;
  angle: number;
  radius: number;
  width: number;
};

type Shock = {
  id: string;
  delay: number;
  scale: number;
};

function AudioWavefield() {
  const snap = useSnapshot(audioVizState);
  const mode = audioModes[snap.mode];
  const active = snap.active;
  const spectrumActive = active && snap.source === "music";
  const hyper = snap.hyperLevel ?? 0;

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

  const shards = useMemo<Shard[]>(
    () =>
      Array.from({ length: 14 }).map((_, index) => ({
        id: `shard-${index}`,
        angle: Math.random() * 360,
        radius: 0.4 + Math.random() * 0.8,
        width: 20 + Math.random() * 60,
      })),
    [snap.modeVersion],
  );

  const shocks = useMemo<Shock[]>(
    () =>
      Array.from({ length: 5 }).map((_, index) => ({
        id: `shock-${index}`,
        delay: Math.random() * 0.4,
        scale: 0.8 + Math.random() * 1.4,
      })),
    [snap.modeVersion],
  );

  const flashSpeed = Math.max(0.12, 0.8 - snap.burst * 0.55 - hyper * 0.35);

  return (
    <motion.div
      className="audio-wavefield"
      data-active={active || undefined}
      data-mode={mode.id}
      data-source={snap.source ?? undefined}
      data-hyper={hyper > 0.01 ? "true" : undefined}
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
              animationDuration: `${flashSpeed + blob.warp * 0.2}s`,
              transform: `scale(${blob.scale * (1 + snap.intensity * 1.8 + hyper * 3)}) rotate(${hyper * 90}deg)`,
              filter: `saturate(${1 + hyper * 1.5}) hue-rotate(${hyper * 120}deg)`,
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
              animationDuration: `${Math.max(0.12, flashSpeed * 0.55)}s`,
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
              width: `${pixel.size * (22 + hyper * 30)}px`,
              height: `${pixel.size * (22 + hyper * 30)}px`,
              animationDuration: `${Math.max(0.1, flashSpeed * 0.35)}s`,
            }}
          />
        ))}
      </div>

      <div className="audio-shard-field" data-hyper={hyper > 0.05 ? "true" : undefined}>
        {shards.map((shard) => (
          <em
            key={shard.id}
            style={{
              transform: `rotate(${shard.angle}deg) scaleX(${shard.radius * (1 + hyper * 1.4)})`,
              width: `${shard.width + hyper * 80}px`,
              animationDuration: `${Math.max(0.08, flashSpeed * 0.25)}s`,
            }}
          />
        ))}
      </div>

      <div className="audio-shock-rings" data-hyper={hyper > 0.1 ? "true" : undefined}>
        {shocks.map((shock) => (
          <em
            key={shock.id}
            style={{
              animationDelay: `${shock.delay}s`,
              animationDuration: `${Math.max(0.2, flashSpeed * 0.8)}s`,
              transform: `scale(${shock.scale * (1 + hyper * 3)})`,
            }}
          />
        ))}
      </div>

      {waves.map((wave) => (
        <span
          key={wave}
          style={{
            animationDelay: `${wave * 0.2}s`,
            animationDuration: `${Math.max(0.4, 1.6 - snap.intensity - hyper * 1.2)}s`,
            transform: `scaleY(${1 + snap.burst * 2.1 + hyper * 3.2})`,
            filter: `brightness(${1 + hyper * 0.8}) saturate(${1 + hyper})`,
          }}
        />
      ))}

      <div className="audio-spectrum audio-spectrum--left" data-active={spectrumActive || undefined}>
        {snap.bands.map((value, index) => (
          <i
            key={`left-${index}`}
            style={{
              transform: `scaleY(${0.4 + value * 3.8 + hyper * 2.2}) scaleX(${0.75 + value * 0.6 + hyper * 0.4})`,
              opacity: Math.max(0.15, 0.12 + value * 1.2 + hyper * 0.5),
              animationDelay: `${index * 0.035}s`,
            }}
          />
        ))}
      </div>

      <div className="audio-spectrum audio-spectrum--right" data-active={spectrumActive || undefined}>
        {snap.bands.map((value, index) => (
          <i
            key={`right-${index}`}
            style={{
              transform: `scaleY(${0.4 + value * 3.8 + hyper * 2.2}) scaleX(${0.75 + value * 0.6 + hyper * 0.4})`,
              opacity: Math.max(0.15, 0.12 + value * 1.2 + hyper * 0.5),
              animationDelay: `${index * 0.035}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default AudioWavefield;

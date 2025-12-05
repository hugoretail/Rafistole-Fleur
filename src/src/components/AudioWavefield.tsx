import { motion } from "framer-motion";
import { useMemo } from "react";
import { useSnapshot } from "valtio";
import { audioModes, audioVizState } from "../state/audioViz";

const stripes = Array.from({ length: 6 });

function AudioWavefield() {
  const snap = useSnapshot(audioVizState);
  const mode = audioModes[snap.mode];
  const active = snap.active;
  const spectrumActive = active && snap.source === "music";

  const waves = useMemo(() => stripes.map((_, index) => index), []);

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
      {waves.map((wave) => (
        <span key={wave} style={{ animationDelay: `${wave * 0.35}s` }} />
      ))}

      <div className="audio-spectrum audio-spectrum--left" data-active={spectrumActive || undefined}>
        {snap.bands.map((value, index) => (
          <i
            key={`left-${index}`}
            style={{
              transform: `scaleY(${0.5 + value * 2})`,
              opacity: 0.2 + value * 0.8,
              animationDelay: `${index * 0.05}s`,
            }}
          />
        ))}
      </div>

      <div className="audio-spectrum audio-spectrum--right" data-active={spectrumActive || undefined}>
        {snap.bands.map((value, index) => (
          <i
            key={`right-${index}`}
            style={{
              transform: `scaleY(${0.5 + value * 2})`,
              opacity: 0.2 + value * 0.8,
              animationDelay: `${index * 0.05}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default AudioWavefield;

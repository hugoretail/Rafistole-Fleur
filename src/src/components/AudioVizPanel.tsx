import { AnimatePresence, motion } from "framer-motion";
import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { useSnapshot } from "valtio";
import { audioTracks } from "../media/tracks";
import {
    activateAudioViz,
    audioModes,
    audioVizState,
    setAudioTrack,
    stopAudioViz,
    toggleAudioSource,
    type AudioSource,
} from "../state/audioViz";

const buttonVariant = {
  rest: { y: 0, opacity: 1 },
  hover: { y: -2, opacity: 1 },
};

const sourceLabels: Record<AudioSource, { title: string; glyph: string }> = {
  mic: { title: "Mode micro", glyph: "🎙" },
  music: { title: "Mode musique", glyph: "♫" },
};

function AudioVizPanel() {
  const snap = useSnapshot(audioVizState);
  const [loadingSource, setLoadingSource] = useState<AudioSource | null>(null);
  const [changingTrack, setChangingTrack] = useState(false);
  const activeMode = audioModes[snap.mode];
  const levelPercent = Math.round(Math.min(1, snap.burst || snap.intensity) * 100);
  const statusLabel = snap.active ? `${sourceLabels[snap.source ?? "mic"].title}` : "Mode desactive";
  const error = snap.lastError;
  const trackList = audioTracks;
  const selectedTrack = trackList.find((track) => track.id === snap.trackId) ?? trackList[0];
  const hasTracks = trackList.length > 0;
  const trackValue = selectedTrack?.id ?? snap.trackId ?? "";

  const description = useMemo(() => {
    if (!snap.active) {
      return "Active le defibrillateur visuel en choisissant micro ou musique.";
    }
    return activeMode.description;
  }, [snap.active, activeMode.description]);

  const handleSource = async (source: AudioSource) => {
    try {
      setLoadingSource(source);
      await toggleAudioSource(source);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSource(null);
    }
  };

  const handleResume = async () => {
    if (!snap.source) {
      return;
    }
    try {
      setLoadingSource(snap.source);
      await activateAudioViz(snap.source);
    } finally {
      setLoadingSource(null);
    }
  };

  const handleTrackChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    if (!event.target.value) {
      return;
    }
    setChangingTrack(true);
    try {
      await setAudioTrack(event.target.value);
    } catch (err) {
      console.error(err);
    } finally {
      setChangingTrack(false);
    }
  };

  return (
    <aside className="audio-panel" aria-live="polite">
      <div className="audio-panel-head">
        <p className="eyebrow">Defi Capgemini</p>
        <h2>Visualisation Audio</h2>
        <p>{description}</p>
      </div>

      <div className="audio-button-row">
        {(Object.keys(sourceLabels) as AudioSource[]).map((source) => {
          const label = sourceLabels[source];
          const isActive = snap.active && snap.source === source;
          const isLoading = loadingSource === source;
          return (
            <motion.button
              key={source}
              className="audio-button"
              data-active={isActive || undefined}
              disabled={isLoading}
              variants={buttonVariant}
              initial="rest"
              whileHover="hover"
              animate="rest"
              onClick={() => void handleSource(source)}
            >
              <span>{label.glyph}</span>
              {label.title}
            </motion.button>
          );
        })}
        <motion.button
          className="audio-button stop"
          disabled={!snap.active}
          variants={buttonVariant}
          initial="rest"
          whileHover="hover"
          animate="rest"
          onClick={() => stopAudioViz()}
        >
          ✕ Stop
        </motion.button>
      </div>

      <div className="audio-meter">
        <div className="meter-track" aria-hidden>
          <span style={{ width: `${levelPercent}%` }} />
        </div>
        <div className="meter-caption">
          <strong>{statusLabel}</strong>
          <span>{levelPercent}%</span>
        </div>
      </div>

      {hasTracks && (
        <div className="audio-track-select">
          <div>
            <p className="eyebrow">Piste musique</p>
            <p className="track-meta">
              {selectedTrack?.title ?? "Selectionne"} — {selectedTrack?.artist}
              <span>{selectedTrack?.mood}</span>
            </p>
          </div>
          <select
            value={trackValue}
            onChange={(event) => void handleTrackChange(event)}
            disabled={changingTrack}
            aria-label="Choisir une piste audio"
          >
            {trackList.map((track) => (
              <option key={track.id} value={track.id}>
                {track.title} — {track.artist}
              </option>
            ))}
          </select>
        </div>
      )}

      <AnimatePresence mode="wait">
        {snap.active && (
          <motion.div
            key={activeMode.id}
            className="audio-mode-callout"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <p className="eyebrow">Mode cyclique toutes les 5s</p>
            <h3>{activeMode.label}</h3>
            <p>{activeMode.description}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="audio-error" role="alert">
          <p>{error}</p>
          {!snap.active && snap.source && (
            <button onClick={() => void handleResume()}>Reessayer</button>
          )}
        </div>
      )}
    </aside>
  );
}

export default AudioVizPanel;

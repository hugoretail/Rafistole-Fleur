import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";
import { storyState } from "../state/story";
import SnakePortalScene from "./SnakePortalScene";

const SECRET_PATTERN = ["F", "L", "E", "U", "R"];
const ACTIVATION_WINDOW = 6500;

function HiddenSnakePortal() {
  const storySnap = useSnapshot(storyState);
  const [progress, setProgress] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPortal, setShowPortal] = useState(false);
  const windowStart = useRef(0);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (storySnap.autopilot) {
        return;
      }

      const pressed = event.key.toUpperCase();
      const expected = SECRET_PATTERN[progress];
      const now = Date.now();

      if (progress === 0) {
        windowStart.current = now;
      } else if (now - windowStart.current > ACTIVATION_WINDOW) {
        setProgress(0);
        windowStart.current = now;
      }

      if (pressed !== expected) {
        if (pressed === SECRET_PATTERN[0]) {
          setProgress(1);
          windowStart.current = now;
        } else {
          setProgress(0);
        }
        return;
      }

      const next = progress + 1;
      if (next === SECRET_PATTERN.length) {
        setProgress(0);
        windowStart.current = 0;
        setIsUnlocked(true);
        setShowPortal(true);
        return;
      }

      setProgress(next);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [progress, storySnap.autopilot]);

  useEffect(() => {
    if (storySnap.autopilot) {
      setProgress(0);
    }
  }, [storySnap.autopilot]);

  useEffect(() => {
    if (!showPortal) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowPortal(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [showPortal]);

  return (
    <section className="snake-shell">
      <div className="snake-sigil" data-active={!storySnap.autopilot || undefined}>
        <span className="eyebrow">Balise clandestine</span>
        <div className="glyph-row">
          {SECRET_PATTERN.map((glyph, index) => (
            <span key={glyph + index} className="snake-glyph" data-lit={index < progress}>
              {glyph}
            </span>
          ))}
        </div>
        <p>
          Coupez l'autopilote et laissez les lettres fleurir en moins de sept secondes. Les initi-es trouveront
          le passage.
        </p>
      </div>

      <AnimatePresence>
        {showPortal && (
          <motion.div className="snake-portal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="snake-panel"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <p className="eyebrow">Hidden Snake / Mode Lotus</p>
              <h3>La chambre des serpents est ouverte</h3>
              <p>
                Tu as desactive l'autopilote et epelle FLEUR. Le portail te mene vers Serpentini, cree par Mateo. Quand tu
                es pret, lance le mode serpent dans une nouvelle fenetre et continue a raconter la detox numerique.
              </p>
              <div className="snake-portal-scene">
                <SnakePortalScene />
              </div>
              <a className="snake-cta" href="https://serpentini.mateoguidi.fr" target="_blank" rel="noreferrer">
                Lancer Serpentini
              </a>
              <button className="snake-dismiss" onClick={() => setShowPortal(false)}>
                Refermer le portail
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isUnlocked && !showPortal && (
        <button className="snake-rearm" onClick={() => setShowPortal(true)}>
          Relancer Hidden Snake
        </button>
      )}
    </section>
  );
}

export default HiddenSnakePortal;

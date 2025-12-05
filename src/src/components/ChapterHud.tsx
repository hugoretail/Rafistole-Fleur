import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { chapters } from "../content/chapters";
import { nudgeChapter, setChapter, storyState, toggleAutopilot } from "../state/story";

const cardVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  enter: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
};

function ChapterHud() {
  const snap = useSnapshot(storyState);
  const current = chapters[snap.chapterIndex];
  const progress = ((snap.chapterIndex + 1) / chapters.length) * 100;
  const autopilotLabel = snap.autopilot ? "Autopilote on" : "Mode manuel";

  useEffect(() => {
    if (!snap.autopilot) {
      return undefined;
    }
    const timer = setInterval(() => nudgeChapter(1), 9000);
    return () => clearInterval(timer);
  }, [snap.autopilot]);

  return (
    <section className="hud-shell">
      <div className="timeline">
        <span className="eyebrow">Nous ne sommes pas condamnes</span>
        <div className="timeline-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <button className="chapter-pill" onClick={() => nudgeChapter(1, { manual: true })}>
          Hop chapitre suivant
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={current.id}
          className="hud-card"
          variants={cardVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ borderColor: current.color }}
        >
          <h2>{current.title}</h2>
          <p className="eyebrow" style={{ letterSpacing: "0.2em", marginTop: "0.8rem" }}>
            {current.vibe}
          </p>
          <p style={{ marginTop: "0.8rem" }}>{current.body}</p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <span className="chapter-pill" data-active="true" style={{ background: current.color, color: "#05060b" }}>
              {current.metric}
            </span>
            <button
              key={`autopilot-${snap.autopilot ? "on" : "off"}`}
              className="chapter-pill autopilot-toggle"
              style={{ borderColor: current.color }}
              data-mode={snap.autopilot ? "auto" : "manual"}
              data-version={snap.interactionVersion}
              aria-pressed={!snap.autopilot}
              onClick={() => toggleAutopilot()}
            >
              {autopilotLabel}
            </button>
            <button
              className="chapter-pill"
              style={{ borderColor: current.color }}
              onClick={() => nudgeChapter(1, { manual: true })}
            >
              {current.action}
            </button>
          </div>
        </motion.article>
      </AnimatePresence>

      <div className="chapter-grid">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            className="chapter-pill"
            data-active={index === snap.chapterIndex}
            style={{ borderColor: index === snap.chapterIndex ? chapter.color : undefined }}
            onClick={() => setChapter(index, { manual: true })}
          >
            {chapter.title}
          </button>
        ))}
      </div>
    </section>
  );
}

export default ChapterHud;

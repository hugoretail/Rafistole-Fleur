import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { partners } from "../content/partners";
import {
    cyclePartner,
    getPartnerById,
    getVisiblePartners,
    partnerFilterOptions,
    partnerState,
    setActivePartner,
    setPartnerFocus,
    togglePinnedPartner,
} from "../state/partners";

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.96 },
  enter: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.96 },
};

function PartnerConstellation() {
  const snap = useSnapshot(partnerState);
  const visiblePartners = getVisiblePartners();
  const activePartner = getPartnerById(snap.activeId) ?? visiblePartners[0] ?? partners[0];
  const pinnedCount = snap.pinned.length;

  useEffect(() => {
    const timer = setInterval(() => cyclePartner(1), 12000);
    return () => clearInterval(timer);
  }, [snap.focus]);

  if (!activePartner) {
    return null;
  }

  return (
    <section className="constellation-shell">
      <header className="constellation-head">
        <div>
          <p className="eyebrow">Allies NDI 2025</p>
          <h2>Constellation des Allies</h2>
          <p className="constellation-lede">
            Cliquez sur les badges pour voir comment chaque partenaire reduit la dependance numerique et quelles actions lancer des maintenant.
          </p>
        </div>
        <div className="constellation-stats">
          <div>
            <span className="stat-label">Focus</span>
            <strong>{partnerFilterOptions.find((option) => option.id === snap.focus)?.label ?? "Tous"}</strong>
          </div>
          <div>
            <span className="stat-label">Partenaires visibles</span>
            <strong>{visiblePartners.length}</strong>
          </div>
          <div>
            <span className="stat-label">Allies epingles</span>
            <strong>{pinnedCount}</strong>
          </div>
        </div>
      </header>

      <div className="filter-row">
        {partnerFilterOptions.map((option) => (
          <button
            key={option.id}
            className="chapter-pill"
            data-active={snap.focus === option.id}
            onClick={() => setPartnerFocus(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="constellation-panel">
        <button className="dial-button" onClick={() => cyclePartner(-1)} aria-label="Partenaire precedent">
          ◂
        </button>

        <AnimatePresence mode="wait">
          <motion.article
            key={activePartner.id}
            className="partner-card"
            variants={cardVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ borderColor: activePartner.color }}
          >
            <div className="partner-card-header">
              <span className="partner-type" style={{ color: activePartner.color }}>
                {activePartner.type}
              </span>
              <span className="partner-region">{activePartner.region}</span>
            </div>
            <h3>{activePartner.name}</h3>
            <p className="partner-tagline">{activePartner.tagline}</p>

            <ul className="signal-list">
              {activePartner.signals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>

            <div className="impact-bar">
              <span>Impact terrain</span>
              <div className="impact-track">
                <span style={{ width: `${activePartner.impact}%`, background: activePartner.color }} />
              </div>
            </div>

            <div className="partner-actions">
              <button className="chapter-pill" onClick={() => togglePinnedPartner(activePartner.id)}>
                {snap.pinned.includes(activePartner.id) ? "Retirer du carnet" : "Epingle ce mentor"}
              </button>
              <button className="chapter-pill" style={{ borderColor: activePartner.color }}>
                {activePartner.action}
              </button>
            </div>

            <div className="ally-band">
              <span>Allies a combiner :</span>
              <div>
                {activePartner.allies.map((ally) => (
                  <span key={ally}>{getPartnerById(ally)?.name ?? ally}</span>
                ))}
              </div>
            </div>
          </motion.article>
        </AnimatePresence>

        <button className="dial-button" onClick={() => cyclePartner(1)} aria-label="Partenaire suivant">
          ▸
        </button>
      </div>

      <div className="partner-orbits">
        {visiblePartners.map((partner) => (
          <button
            key={partner.id}
            className="partner-orbit-pill"
            data-active={partner.id === activePartner.id}
            style={{ borderColor: partner.id === activePartner.id ? partner.color : undefined }}
            onClick={() => setActivePartner(partner.id)}
          >
            <span className="orbit-dot" style={{ background: partner.color }} />
            <span className="orbit-name">{partner.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default PartnerConstellation;

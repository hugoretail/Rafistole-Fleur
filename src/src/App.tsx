import { useSnapshot } from "valtio";
import AudioVizPanel from "./components/AudioVizPanel";
import AudioWavefield from "./components/AudioWavefield";
import ChapterHud from "./components/ChapterHud";
import Experience from "./components/Experience";
import HiddenSnakePortal from "./components/HiddenSnakePortal";
import LoadingOverlay from "./components/LoadingOverlay";
import PartnerConstellation from "./components/PartnerConstellation";
import { audioModes, audioVizState } from "./state/audioViz";

function App() {
  const audioSnap = useSnapshot(audioVizState);
  const currentMode = audioModes[audioSnap.mode];

  return (
    <div
      className="app-shell"
      data-audio-active={audioSnap.active || undefined}
      data-audio-mode={audioSnap.active ? currentMode.id : undefined}
      data-audio-source={audioSnap.source ?? undefined}
    >
      <div className="canvas-layer" aria-hidden>
        <Experience />
      </div>

      <AudioWavefield />

      <div className="ui-layer">
        <AudioVizPanel />
        <header className="hero">
          <p className="eyebrow">NDI 2025 — Mission commune</p>
          <h1>Rafistole Fleur</h1>
          <p className="lede">
            Un parcours ludique pour montrer comment une ecole peut desintoxiquer ses usages
            numeriques sans perdre son energie creative. On ne subit plus le cloud infini, on le
            rafistole avec style.
          </p>
        </header>

        <ChapterHud />
        <PartnerConstellation />
        <HiddenSnakePortal />
      </div>

      <LoadingOverlay />
    </div>
  );
}

export default App;

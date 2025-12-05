import ChapterHud from "./components/ChapterHud";
import Experience from "./components/Experience";
import HiddenSnakePortal from "./components/HiddenSnakePortal";
import LoadingOverlay from "./components/LoadingOverlay";
import PartnerConstellation from "./components/PartnerConstellation";

function App() {
  return (
    <div className="app-shell">
      <div className="canvas-layer" aria-hidden>
        <Experience />
      </div>

      <div className="ui-layer">
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

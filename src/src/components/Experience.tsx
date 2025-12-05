import {
    ContactShadows,
    Environment,
    Float,
    PerspectiveCamera,
    Sparkles,
    Stars,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useMemo, useRef, type FC } from "react";
import * as THREE from "three";
import { useSnapshot } from "valtio";
import { chapters } from "../content/chapters";
import { audioVizState } from "../state/audioViz";
import { storyState } from "../state/story";

const anchorSpread = 3.4;
const cameraAnchors = chapters.map((_, index) => {
  const offset = (index - (chapters.length - 1) / 2) * anchorSpread;
  return {
    position: new THREE.Vector3(offset * 0.7, 2.2 + index * 0.08, 7 - Math.abs(offset) * 0.4),
    target: new THREE.Vector3(offset * 0.7, 1, 0),
    offset,
  };
});

function CameraRig() {
  const { chapterIndex } = useSnapshot(storyState);
  const { camera } = useThree();
  const focus = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const targetAnchor = cameraAnchors[chapterIndex];
    camera.position.lerp(targetAnchor.position, delta * 1.5);
    focus.current.lerp(targetAnchor.target, delta * 1.5);
    const intensity = audioVizState.burst;
    if (audioVizState.active) {
      const wobble = 0.12 + intensity * 0.9;
      const time = state.clock.getElapsedTime();
      camera.position.x += Math.sin(time * 8) * wobble * 0.05;
      camera.position.y += Math.cos(time * 6) * wobble * 0.04;
      camera.position.z += Math.sin(time * 5) * wobble * 0.03;
    }
    camera.lookAt(focus.current);
  });

  return null;
}

type ClusterProps = {
  offset: number;
};

const AtelierCluster: FC<ClusterProps> = ({ offset }) => {
  const seeds = useMemo(() =>
    Array.from({ length: 8 }).map((_, idx) => ({
      position: [
        -2 + Math.random() * 2,
        0.2 + Math.random() * 1.2,
        -1 + Math.random() * 2,
      ] as [number, number, number],
      scale: 0.4 + Math.random() * 0.6,
      hue: 0.9 + idx * 0.03,
    })),
  []);

  return (
    <group position-x={offset * 0.75}>
      {seeds.map((seed, idx) => (
        <Float key={`atelier-${idx}`} speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
          <mesh position={seed.position} scale={seed.scale} castShadow>
            <boxGeometry args={[1, 0.4, 1]} />
            <meshStandardMaterial color={`hsl(${seed.hue * 320}, 70%, 65%)`} metalness={0.2} roughness={0.4} />
          </mesh>
        </Float>
      ))}
      <ContactShadows position={[0, -0.2, 0]} blur={3} opacity={0.4} scale={6} />
    </group>
  );
};

const CommonsCluster: FC<ClusterProps> = ({ offset }) => {
  const torus = useRef<THREE.Mesh>(null);
  const satellites = useMemo(() =>
    Array.from({ length: 6 }).map((_, idx) => ({ angle: (Math.PI * 2 * idx) / 6 })),
  []);

  useFrame((state, delta) => {
    if (!torus.current) return;
    torus.current.rotation.x += delta * 0.2;
    torus.current.rotation.y += delta * 0.35;
  });

  return (
    <group position-x={offset * 0.75}>
      <Float floatIntensity={0.6}>
        <mesh ref={torus} scale={1.6}>
          <torusKnotGeometry args={[0.8, 0.18, 220, 16]} />
          <meshStandardMaterial color="#8de36a" metalness={0.6} roughness={0.2} />
        </mesh>
      </Float>
      {satellites.map((sat, idx) => (
        <mesh key={`commons-${idx}`} position={[Math.cos(sat.angle) * 2.5, Math.sin(sat.angle) * 0.8, Math.sin(sat.angle) * 2.5]}>
          <icosahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color="#ffffff" emissive="#8de36a" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
};

const FanfareCluster: FC<ClusterProps> = ({ offset }) => {
  const instanced = useRef<THREE.InstancedMesh>(null);
  const petalCount = 120;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!instanced.current) return;
    const time = state.clock.getElapsedTime();
    for (let i = 0; i < petalCount; i += 1) {
      const radius = 2 + Math.sin(time * 0.6 + i) * 0.5;
      const angle = (i / petalCount) * Math.PI * 2 + time * 0.2;
      dummy.position.set(offset + Math.cos(angle) * radius, Math.sin(angle * 2) * 1.4, Math.sin(angle) * radius);
      dummy.rotation.set(angle, angle * 0.5, 0);
      const scale = 0.25 + (Math.sin(i * 0.3 + time) + 1) * 0.15;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      instanced.current.setMatrixAt(i, dummy.matrix);
    }
    instanced.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instanced} args={[undefined, undefined, petalCount]}>
      <coneGeometry args={[0.24, 0.8, 6]} />
      <meshStandardMaterial color="#ffd369" emissive="#ffc857" emissiveIntensity={0.4} />
    </instancedMesh>
  );
};

function GlowGrid() {
  const lines = useMemo(() =>
    Array.from({ length: 20 }).map((_, idx) => ({
      z: -10 + idx,
      alpha: 0.05 + idx * 0.02,
    })),
  []);

  return (
    <group rotation-x={-Math.PI / 2} position-y={-1.2}>
      {lines.map((line) => (
        <mesh key={line.z} position={[0, 0, line.z]}>
          <planeGeometry args={[18, 0.02]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={line.alpha} />
        </mesh>
      ))}
    </group>
  );
}

function ChapterClusters() {
  return (
    <>
      {chapters.map((chapter, index) => {
        const { offset } = cameraAnchors[index];
        if (chapter.id === "commons") {
          return <CommonsCluster key={chapter.id} offset={offset} />;
        }
        if (chapter.id === "fanfare") {
          return <FanfareCluster key={chapter.id} offset={offset} />;
        }
        return <AtelierCluster key={chapter.id} offset={offset} />;
      })}
    </>
  );
}

function SceneContents() {
  const pulseLight = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!pulseLight.current) {
      return;
    }
    const energy = audioVizState.burst;
    const wobble = audioVizState.active ? 1 + energy * 3.2 : 1;
    pulseLight.current.intensity = 0.5 * wobble;
    pulseLight.current.position.x = Math.sin(state.clock.getElapsedTime() * 1.2) * (2 + energy * 4);
    pulseLight.current.color.setHSL(0.5 + energy * 0.2, 1, 0.65);
  });

  return (
    <group>
      <color attach="background" args={["#05060b"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 4]} intensity={1.2} castShadow />
      <pointLight position={[-6, 4, -2]} intensity={0.8} color="#f96fb0" />
      <pointLight ref={pulseLight} position={[0, 3, 4]} intensity={0.5} color="#00d2ff" />
      <CameraRig />
      <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={45} />

      <ChapterClusters />

      <Sparkles count={400} size={3} speed={0.2} opacity={0.6} color="#ffffff" scale={[12, 8, 12]} />
      <Stars radius={80} depth={40} count={2000} factor={4} saturation={0} fade />
      <GlowGrid />
      <Environment preset="dawn" />
    </group>
  );
}

function Experience() {
  return (
    <Canvas shadows dpr={[1, 2]}>
      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>
    </Canvas>
  );
}

export default Experience;

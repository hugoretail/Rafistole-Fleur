import { Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type SnakeCurveProps = {
  curve: THREE.CatmullRomCurve3;
};

function SnakeBody({ curve }: SnakeCurveProps) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const snakeGroupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const segmentCount = 72;

  useLayoutEffect(() => {
    if (!bodyRef.current) {
      return;
    }
    const matrix = new THREE.Matrix4();
    const point = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < segmentCount; i += 1) {
      const t = 0.02 + (i / (segmentCount - 1)) * 0.94;
      curve.getPoint(t, point);
      curve.getTangent(t, tangent).normalize();
      quaternion.setFromUnitVectors(up, tangent);
      const thickness = Math.max(0.085, 0.42 - t * 0.26);
      scale.set(thickness, thickness, thickness * 1.08);
      matrix.compose(point.clone(), quaternion.clone(), scale.clone());
      bodyRef.current.setMatrixAt(i, matrix);
    }
    bodyRef.current.instanceMatrix.needsUpdate = true;
  }, [curve, segmentCount]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (snakeGroupRef.current) {
      snakeGroupRef.current.rotation.y = Math.sin(elapsed * 0.3) * 0.35;
      snakeGroupRef.current.rotation.x = Math.cos(elapsed * 0.25) * 0.15;
      snakeGroupRef.current.position.y = Math.sin(elapsed * 0.8) * 0.08;
    }

    const updateNode = (ref: RefObject<THREE.Group>, positionT: number) => {
      if (!ref.current) {
        return;
      }
      const point = curve.getPoint(positionT);
      const tangent = curve.getTangent(positionT).normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      ref.current.position.copy(point);
      ref.current.quaternion.copy(quaternion);
    };

    updateNode(headRef, 0.98);
    updateNode(tailRef, 0.05);

    if (headRef.current) {
      const pulse = 1 + Math.sin(elapsed * 4) * 0.1;
      headRef.current.children.forEach((child) => {
        child.scale.setScalar(pulse);
      });
    }
  });

  return (
    <group ref={snakeGroupRef}>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, segmentCount]} castShadow receiveShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#47dea0"
          emissive="#1ddf8a"
          emissiveIntensity={0.65}
          roughness={0.35}
          metalness={0.15}
        />
      </instancedMesh>

      <group ref={headRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.42, 1.05, 32]} />
          <meshStandardMaterial color="#f4ffe1" emissive="#f9ffb8" emissiveIntensity={1.3} roughness={0.2} />
        </mesh>
        <mesh position={[0.22, 0.15, 0.22]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#05060b" emissive="#72ffe0" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[-0.22, 0.15, 0.22]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#05060b" emissive="#72ffe0" emissiveIntensity={0.25} />
        </mesh>
      </group>

      <group ref={tailRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.18, 0.7, 16]} />
          <meshStandardMaterial color="#3fe19d" emissive="#7bffc2" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function SerpentTrail({ curve }: SnakeCurveProps) {
  const trailRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const segments = 200;
    const arr = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i += 1) {
      const t = i / (segments - 1);
      const point = curve.getPoint(t);
      const jitter = (1 - t) * 0.2;
      const i3 = i * 3;
      arr[i3] = point.x + (Math.random() - 0.5) * jitter;
      arr[i3 + 1] = point.y + (Math.random() - 0.5) * jitter;
      arr[i3 + 2] = point.z + (Math.random() - 0.5) * jitter;
    }
    return arr;
  }, [curve]);

  useFrame((state) => {
    if (trailRef.current) {
      trailRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.2;
    }
  });

  return (
    <points ref={trailRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#9effd4" size={0.04} sizeAttenuation depthWrite={false} transparent opacity={0.85} />
    </points>
  );
}

function RunicHalo() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.3;
    }
  });
  return (
    <mesh ref={ringRef} rotation-x={Math.PI / 2}>
      <ringGeometry args={[1.4, 1.7, 96]} />
      <meshBasicMaterial color="#f7ff66" transparent opacity={0.35} side={THREE.DoubleSide} />
    </mesh>
  );
}

function FireflyField() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const count = 900;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const radius = 2 + Math.random() * 1.8;
      const angle = Math.random() * Math.PI * 2;
      arr[i3] = Math.cos(angle) * radius;
      arr[i3 + 1] = (Math.random() - 0.5) * 1.6;
      arr[i3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={positions.length / 3} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#4dd7ff" size={0.03} sizeAttenuation depthWrite={false} transparent opacity={0.45} />
    </points>
  );
}

function SpineGlow({ curve }: SnakeCurveProps) {
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 220, 0.05, 12, false), [curve]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[0, 0.01, 0]}>
      <meshBasicMaterial color="#fff6c3" transparent opacity={0.55} />
    </mesh>
  );
}

function SnakePortalScene() {
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-0.8, -0.4, 0.6),
          new THREE.Vector3(0.3, -0.2, 0.3),
          new THREE.Vector3(0.9, 0.05, -0.4),
          new THREE.Vector3(0.4, 0.25, -1.1),
          new THREE.Vector3(-0.6, 0.1, -0.6),
          new THREE.Vector3(-0.4, -0.15, 0.2),
        ],
        false,
        "catmullrom",
        0.7,
      ),
    [],
  );

  return (
    <Canvas camera={{ position: [0, 0, 4.5], fov: 48 }} dpr={[1, 2]}>
      <color attach="background" args={["#05060b"]} />
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 2, 3]} intensity={1.4} color="#f7ff66" />
      <pointLight position={[0, -3, -2]} intensity={0.85} color="#4dd7ff" />
      <Suspense fallback={null}>
        <SnakeBody curve={curve} />
        <SpineGlow curve={curve} />
        <SerpentTrail curve={curve} />
        <RunicHalo />
        <FireflyField />
        <Environment preset="forest" background={false} />
      </Suspense>
    </Canvas>
  );
}

export default SnakePortalScene;

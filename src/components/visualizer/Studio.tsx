"use client";

import { Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// ── Polyaspartic Epoxy Floor ──────────────────────────────────────
function ShopFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
      <circleGeometry args={[14, 64]} />
      <meshStandardMaterial
        color="#0c0c0e"
        roughness={0.18}
        metalness={0.45}
        envMapIntensity={0.8}
      />
    </mesh>
  );
}

// ── Subtle ground circle accent (red M-stripe radial glow) ─────────
function FloorAccent() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <ringGeometry args={[5.5, 6.2, 64]} />
      <meshBasicMaterial color="#dc2626" transparent opacity={0.09} />
    </mesh>
  );
}

// ── Studio Environment — creates the car's reflections ─────────────
function StudioEnvironment() {
  return (
    <Environment resolution={512} background={false}>
      {/* Primary overhead soft box — creates the sharp hood/roof highlight */}
      <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 10]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      {/* Secondary side boxes — glancing reflections along the body */}
      <mesh position={[-5, 6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshBasicMaterial color="#dce0ff" toneMapped={false} />
      </mesh>
      <mesh position={[5, 6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshBasicMaterial color="#e8e0d5" toneMapped={false} />
      </mesh>
      {/* Back edge fill */}
      <mesh position={[0, 5, -6]}>
        <planeGeometry args={[14, 6]} />
        <meshBasicMaterial color="#1a1a22" toneMapped={false} />
      </mesh>
      {/* Front reveal — a little warmer for cinematic face light */}
      <mesh position={[0, 5, 6]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[14, 6]} />
        <meshBasicMaterial color="#2a1a18" toneMapped={false} />
      </mesh>
      {/* Dark floor for environment */}
      <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[18, 32]} />
        <meshBasicMaterial color="#050507" toneMapped={false} />
      </mesh>
      {/* Accent red panel — gives a red glint on black cars */}
      <mesh position={[-4, 4, 3]} rotation={[0, Math.PI / 3, 0]}>
        <planeGeometry args={[2, 1.5]} />
        <meshBasicMaterial color="#7a0a0a" toneMapped={false} />
      </mesh>
    </Environment>
  );
}

// ── 3-Point Lighting Rig ───────────────────────────────────────────
function StudioLights() {
  return (
    <>
      {/* Ambient bounce — lifts the shadows without flattening */}
      <ambientLight intensity={0.35} color="#f0f0ff" />
      {/* Key light — front-right overhead (classic 3/4 front) */}
      <spotLight
        position={[4, 8, 5]}
        angle={0.55}
        penumbra={0.9}
        intensity={85}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
      />
      {/* Fill light — front-left, cooler, softer */}
      <spotLight
        position={[-5, 6, 3]}
        angle={0.6}
        penumbra={1}
        intensity={40}
        color="#dce6ff"
      />
      {/* Rim/back light — defines silhouette */}
      <spotLight
        position={[0, 6, -6]}
        angle={0.5}
        penumbra={0.85}
        intensity={55}
        color="#ffe8d5"
      />
      {/* Under-car bounce — prevents pitch-black underside */}
      <pointLight position={[0, 0.8, 0]} intensity={2.5} color="#e8e8ff" distance={6} decay={2} />
      {/* Accent red rim — brand glint on the rear quarter */}
      <spotLight
        position={[3.5, 3, -4]}
        angle={0.35}
        penumbra={0.9}
        intensity={15}
        color="#ff3322"
      />
    </>
  );
}

// ── Public Studio Component ────────────────────────────────────────
export function Studio() {
  return (
    <>
      <StudioLights />
      <StudioEnvironment />
      <ShopFloor />
      <FloorAccent />
      <ContactShadows
        position={[0, 0.005, 0]}
        opacity={0.42}
        scale={14}
        blur={2.2}
        far={4}
        resolution={1024}
        color="#000000"
      />
    </>
  );
}

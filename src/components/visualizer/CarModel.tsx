'use client';

import { useEffect, useRef } from 'react';
import { useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';

interface CarModelProps {
  modelPath: string;
  bodyColor: string;
  tintLevel: number;
  ceramicCoating: boolean;
  ppf: boolean;
  paintCorrection: boolean;
  detailing: boolean;
  wrapEnabled: boolean;
  tintEnabled: boolean;
}

// Heuristics to classify mesh materials
function isBodyMaterial(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes('body') ||
    n.includes('paint') ||
    n.includes('car') ||
    n.includes('hood') ||
    n.includes('fender') ||
    n.includes('door') ||
    n.includes('bumper') ||
    n.includes('roof') ||
    n.includes('trunk') ||
    n.includes('panel') ||
    n.includes('exterior') ||
    n.includes('shell') ||
    n.includes('metal') ||
    n.includes('chassis') ||
    n.includes('quarter')
  );
}

function isGlassMaterial(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes('glass') ||
    n.includes('window') ||
    n.includes('windshield') ||
    n.includes('windscreen') ||
    n.includes('tint')
  );
}

function isChromeMaterial(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes('chrome') ||
    n.includes('trim') ||
    n.includes('mirror') ||
    n.includes('grille') ||
    n.includes('handle')
  );
}

export default function CarModel({
  modelPath,
  bodyColor,
  tintLevel,
  ceramicCoating,
  ppf,
  paintCorrection,
  detailing,
  wrapEnabled,
  tintEnabled,
}: CarModelProps) {
  const { scene } = useGLTF(modelPath);
  const groupRef = useRef<THREE.Group>(null);

  // Clone the scene so we can manipulate materials without affecting cache
  const clonedScene = useRef<THREE.Group | null>(null);
  if (!clonedScene.current) {
    clonedScene.current = scene.clone(true);
  }

  useEffect(() => {
    if (!clonedScene.current) return;

    clonedScene.current.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const mesh = child as THREE.Mesh;

      // Handle arrays of materials
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial)) return;

        const name = (mat.name || mesh.name || '').toLowerCase();
        const isBody = isBodyMaterial(name);
        const isGlass = isGlassMaterial(name);
        const isChrome = isChromeMaterial(name);

        // If we can't classify, check color — most body panels are the dominant non-black, non-glass material
        // For unclassified materials with color, treat large meshes as body
        const isFallbackBody =
          !isBody && !isGlass && !isChrome && !name.includes('wheel') && !name.includes('tire') &&
          !name.includes('light') && !name.includes('headlight') && !name.includes('tail') &&
          !name.includes('interior') && !name.includes('seat') && !name.includes('dash') &&
          !name.includes('rubber') && !name.includes('black');

        // ── Body panels ──
        if (isBody || isFallbackBody) {
          if (wrapEnabled) {
            mat.color = new THREE.Color(bodyColor);
          }

          // Base paint finish
          let metalness = 0.6;
          let roughness = 0.3;

          if (ceramicCoating) {
            metalness = 0.9;
            roughness = 0.08;
          }
          if (paintCorrection) {
            roughness = Math.max(roughness - 0.12, 0.05);
          }
          if (ppf) {
            // PPF adds a subtle glossy clearcoat layer
            if (mat instanceof THREE.MeshPhysicalMaterial) {
              mat.clearcoat = 0.8;
              mat.clearcoatRoughness = 0.05;
            } else {
              metalness = Math.min(metalness + 0.1, 1.0);
              roughness = Math.max(roughness - 0.05, 0.05);
            }
          }
          if (detailing) {
            roughness = Math.max(roughness - 0.05, 0.03);
            metalness = Math.min(metalness + 0.05, 1.0);
          }

          mat.metalness = metalness;
          mat.roughness = roughness;
          mat.needsUpdate = true;
        }

        // ── Glass/windows ──
        if (isGlass) {
          if (tintEnabled) {
            // tintLevel: 5 = very dark (limo), 70 = very light
            const darkness = 1 - tintLevel / 100; // 0.95 for 5%, 0.30 for 70%
            mat.color = new THREE.Color(0x111111).lerp(new THREE.Color(0x4488aa), 1 - darkness);
            mat.opacity = 0.3 + darkness * 0.5; // Range: 0.3 (light) to 0.8 (dark)
            mat.transparent = true;
          } else {
            mat.color = new THREE.Color(0x88aacc);
            mat.opacity = 0.35;
            mat.transparent = true;
          }
          mat.needsUpdate = true;
        }

        // ── Chrome/trim ──
        if (isChrome) {
          mat.metalness = 0.95;
          mat.roughness = 0.05;
          mat.needsUpdate = true;
        }
      });
    });
  }, [bodyColor, tintLevel, ceramicCoating, ppf, paintCorrection, detailing, wrapEnabled, tintEnabled]);

  return (
    <Center>
      <group ref={groupRef}>
        <primitive object={clonedScene.current} />
      </group>
    </Center>
  );
}

// Preload all models
useGLTF.preload('/rpm-auto-lab/models/sedan.glb');
useGLTF.preload('/rpm-auto-lab/models/sports.glb');
useGLTF.preload('/rpm-auto-lab/models/truck.glb');

"use client";

import { useEffect, useMemo } from "react";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import { classifyScene, restoreAll, type ClassificationResult } from "./meshClassifier";
import { applyEffects, type EffectState } from "./materialEffects";
import type { VehicleConfig } from "./types";

interface VehicleCarProps {
  vehicle: VehicleConfig;
  effectState: EffectState;
}

// Note: we deliberately do NOT upgrade MeshStandardMaterial →
// MeshPhysicalMaterial here. Physical.copy(Standard) fails because Physical
// expects physical-only Vector fields on the source (clearcoatNormalScale,
// iridescenceTint, etc.). Instead, materialEffects.ts checks
// `"clearcoat" in mat` to gracefully skip physical-only tweaks when the
// material is plain Standard — ceramic/PPF/wraps still look great using
// roughness + metalness + envMapIntensity alone. GLBs with glass already
// ship MeshPhysicalMaterial from the GLTFLoader for alpha=BLEND materials.

// Target "vehicle length" after auto-normalization — the longest axis
// of the bounding box becomes this many world units. Tuned so different
// GLBs (BMW M4, Tesla M3, Lambo Urus, Cybertruck) render at consistent size.
const TARGET_VEHICLE_LENGTH = 4.6;

export function VehicleCar({ vehicle, effectState }: VehicleCarProps) {
  const { scene } = useGLTF(vehicle.modelPath);

  // Clone scene so each vehicle switch gets fresh materials (avoids cross-contamination)
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Make every mesh's material unique to this clone so we can mutate safely
    clone.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.material) return;
      if (Array.isArray(child.material)) {
        child.material = child.material.map((m) => m.clone());
      } else {
        child.material = child.material.clone();
      }
    });
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = false;
      }
    });
    return clone;
  }, [scene]);

  // Auto-fit: measure bbox, normalize scale + center, so any GLB drops in
  // at consistent world size regardless of its authoring units/origin.
  // IMPORTANT: updateMatrixWorld(true) before setFromObject — otherwise
  // children's world matrices are stale and the bbox ignores node transforms
  // (this bites the Lambo Urus GLB which has nodes rotated 90° around X).
  const { normalizedScale, groundOffset, lengthAxis } = useMemo(() => {
    clonedScene.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(clonedScene, true);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const longestAxis = Math.max(size.x, size.y, size.z);
    const s = longestAxis > 0.001 && isFinite(longestAxis) ? TARGET_VEHICLE_LENGTH / longestAxis : 1;
    // After we scale the scene by `s`, the bottom of the bbox lands at bbox.min.y * s.
    // We want the bottom at y=0 so the scene sits on the floor.
    const bottomAfterScale = bbox.min.y * s;
    return {
      normalizedScale: s,
      groundOffset: -bottomAfterScale,
      lengthAxis: size.x > size.z ? "x" : "z",
    };
  }, [clonedScene]);
  void lengthAxis; // reserved for future rotation auto-correction

  // Classify once per vehicle/scene
  const classified: ClassificationResult = useMemo(
    () => classifyScene(clonedScene, vehicle.classify),
    [clonedScene, vehicle.classify]
  );

  // Apply effects any time state changes
  useEffect(() => {
    restoreAll(classified);
    applyEffects(classified, effectState, clonedScene);
  }, [classified, effectState, clonedScene]);

  // Composition: normalize → center (X/Z only via Center disableY) → ground-align → user offset
  const finalScale = normalizedScale * vehicle.scale;
  const yPosition = groundOffset * vehicle.scale + vehicle.yOffset;

  return (
    <group position={[0, yPosition, 0]} rotation={[0, vehicle.rotationY ?? 0, 0]}>
      <Center disableY>
        <primitive object={clonedScene} scale={finalScale} />
      </Center>
    </group>
  );
}

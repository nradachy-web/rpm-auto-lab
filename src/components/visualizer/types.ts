// Shared configurator types

export type FinishType = "gloss" | "high-gloss" | "satin" | "matte" | "metallic" | "pearl" | "texture" | "color-flip";

export type VehicleCategory = "sports" | "sedan" | "suv" | "truck" | "exotic" | "ev";

export type BodyZone = "front" | "side" | "rear" | "top";
export type GlassZone = "windshield" | "front-side" | "rear-side" | "rear-windshield";

// Color with finish metadata for wrap selection
export interface WrapColor {
  name: string;
  hex: string;
  finish: FinishType;
  brand: string;
}

// Mesh role after classification
export type MeshRole = "body" | "glass" | "chrome" | "wheel" | "tire" | "interior" | "light" | "rubber" | "other";

// Vehicle config entry
export interface VehicleConfig {
  id: string;
  make: string;
  model: string;
  year?: string;
  category: VehicleCategory;
  description: string;
  modelPath: string; // relative to basePath — e.g. "/models/bmw-m4.glb"
  thumbPath?: string; // optional poster image
  // Scene placement
  scale: number;
  yOffset: number;
  rotationY?: number;
  // Camera framing
  cameraDistance: number; // base orbit radius on desktop
  cameraHeight: number;
  cameraTarget: [number, number, number];
  // Mesh classification overrides (when auto-detection fails)
  // Each array is matched as case-insensitive substrings against mesh + material names combined
  classify?: {
    body?: string[];
    glass?: string[];
    chrome?: string[];
    wheel?: string[];
    tire?: string[];
    interior?: string[];
    light?: string[];
    ignore?: string[]; // meshes to skip (debug markers, etc.)
  };
  // Optional palette tweaks
  defaultBodyColor?: string; // hex — reset color on mount
}

// Zone selection state shared across the configurator
export interface ConfiguratorState {
  vehicleId: string;
  activeServices: Set<string>;
  wrapColor: string;
  wrapFinish: FinishType;
  tintLevel: number; // VLT %
  ppfPackage: string;
  tintZone: string;
}

import type { VehicleConfig } from "./types";
import { BASE_PATH } from "@/lib/constants";

// All vehicle GLBs live under /public/models and are referenced with the
// Next static-export basePath prefix (/rpm-auto-lab/models/<file>.glb).
// VehicleCar.tsx auto-normalizes each GLB so they render at consistent scene
// size — `scale` and `yOffset` here are fine-tuning multipliers applied on
// top of that. Keep them near 1.0 / 0.0 unless a specific model needs help.
const MODELS = `${BASE_PATH}/models`;

export const VEHICLES: VehicleConfig[] = [
  {
    id: "bmw-m4",
    make: "BMW",
    model: "M4 Competition",
    year: "2024",
    category: "sports",
    description: "Twin-turbo inline-6 — 503 hp of sports coupe performance.",
    modelPath: `${MODELS}/bmw-m4.glb`,
    scale: 1.0,
    yOffset: 0,
    cameraDistance: 6.8,
    cameraHeight: 2.2,
    cameraTarget: [0, 0.7, 0],
    classify: {
      body: ["body_material", "driver_door", "passenger_door", "bumpers", "tail_material"],
      glass: ["headglass", "glsslight", "palettematerial003", "palettematerial010", "material_718"],
      interior: ["seats", "interioralcntr", "steering wheel", "dashboard", "plds", "object002"],
      wheel: ["brake", "cylinder"],
      tire: ["tire"],
      light: ["headlight", "plate_material"],
    },
  },
  {
    id: "tesla-model-3",
    make: "Tesla",
    model: "Model 3 Performance",
    year: "2024",
    category: "ev",
    description: "All-electric luxury sedan — instant torque, zero emissions.",
    modelPath: `${MODELS}/tesla-model-3.glb`,
    scale: 1.0,
    yOffset: 0,
    cameraDistance: 6.8,
    cameraHeight: 2.1,
    cameraTarget: [0, 0.7, 0],
    classify: {
      body: ["paint_color"],
      glass: ["index_0_2"],
      chrome: ["metal_white"],
      wheel: ["index_0_1"],
    },
  },
  {
    id: "lambo-urus",
    make: "Lamborghini",
    model: "Urus",
    year: "2024",
    category: "suv",
    description: "Super SUV — 641 hp twin-turbo V8, 0–60 in 3.5s.",
    modelPath: `${MODELS}/lambo-urus.glb`,
    scale: 1.0,
    yOffset: 0,
    rotationY: Math.PI, // GLB ships facing -Z; flip so front points at camera
    cameraDistance: 7.5,
    cameraHeight: 2.4,
    cameraTarget: [0, 0.7, 0],
    classify: {
      body: ["yellow_body", "silver_body", "gloss_black_body", "matt_black_body"],
      glass: ["glass_glass"],
      wheel: ["wheel_wheel", "wheel001", "wheel002", "wheel003"],
      light: ["lights_wheel"],
    },
  },
  {
    id: "cybertruck",
    make: "Tesla",
    model: "Cybertruck",
    year: "2024",
    category: "truck",
    description: "Stainless-steel exoskeleton — built for the apocalypse and your driveway.",
    modelPath: `${MODELS}/cybertruck.glb`,
    scale: 1.0,
    yOffset: 0,
    cameraDistance: 7.5,
    cameraHeight: 2.6,
    cameraTarget: [0, 0.8, 0],
    classify: {
      body: ["body_mat", "car_paint_mat", "trunk_mat"],
      glass: ["glass_windows_mat"],
      light: ["light_mat", "glass_light_mat"],
      wheel: ["wheel_mat"],
      interior: ["interior_mat"],
    },
  },
];

export function getVehicleById(id: string): VehicleConfig {
  return VEHICLES.find((v) => v.id === id) ?? VEHICLES[0];
}

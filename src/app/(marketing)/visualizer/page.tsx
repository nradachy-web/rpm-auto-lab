import type { Metadata } from "next";
import VehicleVisualizer from "@/components/visualizer/VehicleVisualizer";

export const metadata: Metadata = {
  title: "3D Configurator",
  description: "Build and customize your dream ride with our interactive 3D vehicle configurator.",
};

export default function VisualizerPage() {
  return <VehicleVisualizer />;
}

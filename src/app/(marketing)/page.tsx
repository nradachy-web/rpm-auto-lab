import Hero from "@/components/sections/Hero";
import ServicesPreview from "@/components/sections/ServicesPreview";
import StatsBar from "@/components/sections/StatsBar";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import CTABanner from "@/components/sections/CTABanner";
import VehicleVisualizer from "@/components/visualizer/VehicleVisualizer";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <ServicesPreview />
      <VehicleVisualizer />
      <WhyChooseUs />
      <CTABanner />
    </>
  );
}

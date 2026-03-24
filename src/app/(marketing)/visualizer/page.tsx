import type { Metadata } from 'next';
import VehicleVisualizer from '@/components/visualizer/VehicleVisualizer';
import AnimatedSection from '@/components/ui/AnimatedSection';

export const metadata: Metadata = {
  title: 'Vehicle Visualizer | RPM Auto Lab',
  description:
    'See your vehicle transformed before you commit. Toggle ceramic coating, PPF, window tint, wraps, paint correction, and detailing on our interactive 3D visualizer.',
};

export default function VisualizerPage() {
  return (
    <>
      {/* Hero — compact */}
      <section className="relative pt-28 pb-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-rpm-red/[0.03] rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <AnimatedSection className="text-center mb-8">
            <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rpm-red border border-rpm-red/30 rounded-full bg-rpm-red/5">
              3D Configurator
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-rpm-white leading-tight">
              Build Your <span className="text-gradient-red">Dream Ride</span>
            </h1>
            <p className="mt-3 text-lg text-rpm-silver max-w-xl mx-auto leading-relaxed">
              Explore our services in 3D. Rotate, zoom, and customize.
            </p>
            <p className="mt-4 text-sm text-rpm-silver/50 animate-pulse">
              Click and drag to rotate &bull; Scroll to zoom
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Visualizer — full width */}
      <section className="relative pb-20">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <VehicleVisualizer />
        </div>
      </section>
    </>
  );
}

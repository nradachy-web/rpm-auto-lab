import type { Metadata } from 'next';
import VehicleVisualizer from '@/components/visualizer/VehicleVisualizer';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimatedSection from '@/components/ui/AnimatedSection';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Vehicle Visualizer | RPM Auto Lab',
  description:
    'See your vehicle transformed before you commit. Toggle ceramic coating, PPF, window tint, wraps, paint correction, and detailing on our interactive visualizer.',
};

export default function VisualizerPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-8 sm:pb-12 overflow-hidden">
        {/* Background accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-rpm-red/[0.03] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-rpm-red/[0.02] rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <SectionHeading
            badge="Interactive Visualizer"
            title="Build Your"
            highlight="Dream Ride"
            description="See your vehicle transformed before you commit. Toggle services, pick colors, adjust tint — and watch it all come to life."
          />
        </div>
      </section>

      {/* Visualizer */}
      <section className="relative pb-20">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <VehicleVisualizer />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-rpm-red/[0.04] rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <AnimatedSection className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-rpm-white mb-4">
              Love What You See?
            </h2>
            <p className="text-rpm-silver mb-8 text-lg leading-relaxed">
              Let&apos;s make it real. Get a personalized quote for your exact vehicle and service combination.
            </p>
            <Button href="/contact" size="lg">
              Get Your Free Quote
            </Button>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}

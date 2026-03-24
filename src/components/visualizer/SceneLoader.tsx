'use client';

import { Html } from '@react-three/drei';

export default function SceneLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-rpm-gray/30" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#dc2626] animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#f97316] animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
        </div>
        {/* Text */}
        <div className="text-center">
          <p className="text-[#fafafa] text-sm font-semibold tracking-wide">RPM Auto Lab</p>
          <p className="text-[#8a8a8a] text-xs mt-1">Loading 3D Model...</p>
        </div>
      </div>
    </Html>
  );
}

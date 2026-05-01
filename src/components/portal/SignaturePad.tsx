'use client';

import { useEffect, useRef, useState } from 'react';

// Minimal HTML canvas signature pad. Mouse + touch. Exposes the current
// drawing as a base64 data URL via the onChange callback (fired on stroke
// end). Clear button wipes the canvas.

export default function SignaturePad({
  initialData,
  onChange,
  height = 140,
}: {
  initialData?: string | null;
  onChange?: (dataUrl: string | null) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(Boolean(initialData));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#161616';
    ctx.fillRect(0, 0, rect.width, height);
    if (initialData) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, height);
      img.src = initialData;
    }
  }, [height, initialData]);

  const point = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    const p = point(e);
    if (!p) return;
    drawingRef.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    const p = point(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!p || !ctx) return;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };

  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && onChange) onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#161616';
    ctx.fillRect(0, 0, rect.width, height);
    setHasInk(false);
    onChange?.(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height, touchAction: 'none' }}
        className="rounded-lg border border-rpm-gray bg-rpm-charcoal cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-rpm-silver">
        <span>{hasInk ? 'Signed.' : 'Sign above with finger or mouse.'}</span>
        <button type="button" onClick={clear} className="hover:text-rpm-red">Clear</button>
      </div>
    </div>
  );
}

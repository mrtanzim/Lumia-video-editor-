import React from 'react';
import { Clip } from '../types';
import { Move, RotateCw, RotateCcw } from 'lucide-react';

interface TransformOverlayProps {
  clip: Clip;
  containerWidth: number;
  containerHeight: number;
  projectWidth: number;
  projectHeight: number;
  onTransformChange: (updates: { scale?: number; x?: number; y?: number; rotation?: number }) => void;
}

export const TransformOverlay: React.FC<TransformOverlayProps> = ({
  clip,
  containerWidth,
  containerHeight,
  projectWidth,
  projectHeight,
  onTransformChange,
}) => {
  const scale = clip.properties?.scale ?? 1;
  const x = clip.properties?.x || 0;
  const y = clip.properties?.y || 0;
  const rotation = clip.properties?.rotation || 0;

  const boxW = containerWidth * scale;
  const boxH = containerHeight * scale;
  const cx = containerWidth / 2 + x * (containerWidth / projectWidth);
  const cy = containerHeight / 2 + y * (containerHeight / projectHeight);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, axis: 'x' | 'y' | 'scale') => {
    e.stopPropagation();
    e.preventDefault();
    const startX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const startVal = axis === 'scale' ? scale : axis === 'x' ? x : y;

    const onMove = (ev: MouseEvent | TouchEvent) => {
      const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
      const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      const dx = cx - startX;
      const dy = cy - startY;
      if (axis === 'scale') {
        const delta = dx / 100;
        onTransformChange({ scale: Math.max(0.1, startVal + delta) });
      } else if (axis === 'x') {
        const px = dx / (containerWidth / projectWidth);
        onTransformChange({ x: startVal + px });
      } else {
        const py = dy / (containerHeight / projectHeight);
        onTransformChange({ y: startVal + py });
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };

  if (!clip) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: cx - boxW / 2,
        top: cy - boxH / 2,
        width: boxW,
        height: boxH,
        transform: `rotate(${rotation}deg)`,
        border: '2px solid rgba(99, 102, 241, 0.9)',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
        zIndex: 100,
      }}
    >
      {/* move handle (top-left) */}
      <div
        className="pointer-events-auto absolute -top-3 -left-3 w-5 h-5 bg-indigo-500 rounded-full border-2 border-white shadow cursor-move flex items-center justify-center"
        onMouseDown={(e) => handleDrag(e, 'x')}
        onTouchStart={(e) => handleDrag(e, 'x')}
        title="Drag to move"
      >
        <Move size={10} className="text-white" />
      </div>
      {/* scale handle (bottom-right) */}
      <div
        className="pointer-events-auto absolute -bottom-3 -right-3 w-5 h-5 bg-indigo-500 rounded-full border-2 border-white shadow cursor-se-resize flex items-center justify-center"
        onMouseDown={(e) => handleDrag(e, 'scale')}
        onTouchStart={(e) => handleDrag(e, 'scale')}
        title="Drag to scale"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      </div>
      {/* rotation handle (top-center) */}
      <div
        className="pointer-events-auto absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow cursor-grab flex items-center justify-center"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startRot = rotation;
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const startMouseAngle = Math.atan2((e as MouseEvent).clientY - cy, (e.clientX - cx));
          const onMove = (ev: MouseEvent) => {
            const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx);
            const deg = ((angle - startMouseAngle) * 180) / Math.PI;
            onTransformChange({ rotation: startRot + deg });
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
        title="Drag to rotate"
      >
        <RotateCw size={10} className="text-white" />
      </div>
    </div>
  );
};

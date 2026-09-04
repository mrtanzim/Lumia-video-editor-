import React, { useRef, useEffect, useMemo } from 'react';
import { Project, TrackType, Clip, Keyframe } from '../types';

interface KeyframeEditorProps {
  clip: Clip;
  currentTime: number;
  onAddKeyframe: (property: string, value: number) => void;
  onUpdateKeyframe: (id: string, updates: Partial<Keyframe>) => void;
  onRemoveKeyframe: (id: string) => void;
}

export const KeyframeEditor: React.FC<KeyframeEditorProps> = ({
  clip,
  currentTime,
  onAddKeyframe,
  onUpdateKeyframe,
  onRemoveKeyframe,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const keyframes = clip.keyframes || [];

  const animatableProperties = useMemo(() => [
    { key: 'scale', label: 'Scale', min: 0, max: 3, default: 1 },
    { key: 'x', label: 'Pos X', min: -500, max: 500, default: 0 },
    { key: 'y', label: 'Pos Y', min: -500, max: 500, default: 0 },
    { key: 'rotation', label: 'Rotation', min: -180, max: 180, default: 0 },
    { key: 'opacity', label: 'Opacity', min: 0, max: 1, default: 1 },
    { key: 'volume', label: 'Volume', min: 0, max: 2, default: 1 },
  ], []);

  const getPropertyValue = (prop: string) => {
    if (prop === 'scale') return clip.properties?.scale ?? 1;
    if (prop === 'x') return clip.properties?.x ?? 0;
    if (prop === 'y') return clip.properties?.y ?? 0;
    if (prop === 'rotation') return clip.properties?.rotation ?? 0;
    if (prop === 'opacity') return clip.properties?.opacity ?? 1;
    if (prop === 'volume') return clip.properties?.volume ?? 1;
    return 0;
  };

  const setPropertyValue = (prop: string, value: number) => {
    if (prop === 'scale' || prop === 'x' || prop === 'y' || prop === 'rotation' || prop === 'opacity' || prop === 'volume') {
      // handled by parent via properties
    }
  };

  const getKeyframesForProperty = (prop: string) => {
    return keyframes.filter(k => k.property === prop).sort((a, b) => a.time - b.time);
  };

  const handleTrackClick = (e: React.MouseEvent, prop: string) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const time = pct * clip.duration;
    const value = getPropertyValue(prop);
    onAddKeyframe(prop, value);
  };

  const interpolateValue = (prop: string, time: number) => {
    const kfs = getKeyframesForProperty(prop);
    if (kfs.length === 0) return getPropertyValue(prop);
    if (kfs.length === 1) return kfs[0].value;
    if (time <= kfs[0].time) return kfs[0].value;
    if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value;

    for (let i = 0; i < kfs.length - 1; i++) {
      const a = kfs[i];
      const b = kfs[i + 1];
      if (time >= a.time && time <= b.time) {
        const t = (time - a.time) / (b.time - a.time);
        const ease = a.easing === 'ease-in' ? t * t : a.easing === 'ease-out' ? t * (2 - t) : a.easing === 'ease-in-out' ? t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t : t;
        return a.value + (b.value - a.value) * ease;
      }
    }
    return getPropertyValue(prop);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Keyframes</div>
      {animatableProperties.map(prop => {
        const kfs = getKeyframesForProperty(prop.key);
        const currentVal = interpolateValue(prop.key, currentTime - clip.startTime);
        return (
          <div key={prop.key} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-600 dark:text-gray-400">{prop.label}</span>
              <span className="text-[10px] font-mono text-gray-500">{typeof currentVal === 'number' ? currentVal.toFixed(2) : currentVal}</span>
            </div>
            <div
              ref={trackRef}
              className="relative h-6 bg-gray-100 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-gray-800 cursor-crosshair overflow-hidden"
              onClick={(e) => handleTrackClick(e, prop.key)}
            >
              <div className="absolute inset-0 flex items-center px-1 pointer-events-none">
                <div className="w-full h-px bg-gray-300 dark:bg-gray-700" />
              </div>
              {kfs.map(kf => {
                const left = (kf.time / clip.duration) * 100;
                return (
                  <div
                    key={kf.id}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 border-2 border-white rounded-sm shadow cursor-pointer hover:scale-125 transition-transform"
                    style={{ left: `${left}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (e.shiftKey) onRemoveKeyframe(kf.id);
                    }}
                    title={`${prop.label} @ ${kf.time.toFixed(2)}s`}
                  />
                );
              })}
              <div
                className="absolute top-0 bottom-0 w-px bg-indigo-400/60 pointer-events-none"
                style={{ left: `${((currentTime - clip.startTime) / clip.duration) * 100}%` }}
              />
            </div>
            <div className="flex gap-1">
              {['linear', 'ease-in', 'ease-out', 'ease-in-out'].map(easing => (
                <button
                  key={easing}
                  onClick={() => {
                    const lastKf = kfs[kfs.length - 1];
                    if (lastKf) onUpdateKeyframe(lastKf.id, { easing: easing as Keyframe['easing'] });
                  }}
                  className={`text-[9px] px-1.5 py-0.5 rounded border ${kfs[kfs.length - 1]?.easing === easing ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                >
                  {easing}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React, { useState } from 'react';
import { Clip } from '../types';
import { Circle, Square, Triangle } from 'lucide-react';

interface MaskPanelProps {
  clip: Clip;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

export const MaskPanel: React.FC<MaskPanelProps> = ({ clip, onUpdateClip }) => {
  const mask = clip.properties?.mask || { shape: 'none', feather: 0, inverted: false };

  const updateMask = (patch: Partial<{ shape: 'none' | 'rectangle' | 'circle'; feather: number; inverted: boolean }>) => {
    onUpdateClip({ properties: { ...clip.properties, mask: { ...mask, ...patch } } });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Apply Mask</div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'none', label: 'None', icon: null },
          { key: 'rectangle', label: 'Rectangle', icon: <Square size={16} /> },
          { key: 'circle', label: 'Circle', icon: <Circle size={16} /> },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => updateMask({ shape: opt.key as any })}
            className={`p-2 rounded border text-[10px] flex flex-col items-center gap-1 transition ${
              mask.shape === opt.key ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {mask.shape && mask.shape !== 'none' && (
        <>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-gray-500">Feather</label>
              <span className="text-[10px] font-mono text-gray-500">{mask.feather}px</span>
            </div>
            <input type="range" min={0} max={50} value={mask.feather} onChange={(e) => updateMask({ feather: parseInt(e.target.value) })} className="w-full h-1.5 accent-indigo-600 rounded-lg cursor-pointer" />
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={mask.inverted} onChange={(e) => updateMask({ inverted: e.target.checked })} className="accent-indigo-600" />
            Invert Mask
          </label>
        </>
      )}
    </div>
  );
};

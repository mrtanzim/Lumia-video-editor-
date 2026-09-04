import React, { useRef, useCallback } from 'react';
import { Clip } from '../types';
import { Pipette, RefreshCw } from 'lucide-react';

interface ChromaKeyPanelProps {
  clip: Clip;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

export const ChromaKeyPanel: React.FC<ChromaKeyPanelProps> = ({ clip, onUpdateClip }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const current = clip.advancedEffects?.find(e => e.type === 'chroma-key') || {
    id: 'chroma-key',
    type: 'chroma-key',
    name: 'Chroma Key',
    isActive: true,
    params: { keyColor: '#00ff00', tolerance: 40, feather: 5, spill: 50 },
  };

  const updateParam = (key: string, value: any) => {
    const params = { ...current.params, [key]: value };
    onUpdateClip({
      advancedEffects: [
        ...(clip.advancedEffects?.filter(e => e.type !== 'chroma-key') || []),
        { ...current, params },
      ],
    });
  };

  const pickColor = useCallback(() => {
    if ('EyeDropper' in window) {
      const dropper = new (window as any).EyeDropper();
      dropper.open().then((result: any) => {
        updateParam('keyColor', result.sRGBHex);
      }).catch(() => {});
    }
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Chroma Key</span>
        <button onClick={pickColor} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 flex items-center gap-1 hover:border-indigo-500 transition">
          <Pipette size={10} /> Pick Color
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700" style={{ backgroundColor: current.params?.keyColor || '#00ff00' }} />
        <input
          type="color"
          value={current.params?.keyColor || '#00ff00'}
          onChange={(e) => updateParam('keyColor', e.target.value)}
          className="w-full h-10 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent"
        />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-500">Tolerance</label>
          <span className="text-[10px] font-mono text-gray-500">{current.params?.tolerance || 40}</span>
        </div>
        <input type="range" min={0} max={100} value={current.params?.tolerance || 40} onChange={(e) => updateParam('tolerance', parseInt(e.target.value))} className="w-full h-1.5 accent-indigo-600 rounded-lg cursor-pointer" />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-500">Feather</label>
          <span className="text-[10px] font-mono text-gray-500">{current.params?.feather || 5}</span>
        </div>
        <input type="range" min={0} max={50} value={current.params?.feather || 5} onChange={(e) => updateParam('feather', parseInt(e.target.value))} className="w-full h-1.5 accent-indigo-600 rounded-lg cursor-pointer" />
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-500">Spill Suppression</label>
          <span className="text-[10px] font-mono text-gray-500">{current.params?.spill || 50}</span>
        </div>
        <input type="range" min={0} max={100} value={current.params?.spill || 50} onChange={(e) => updateParam('spill', parseInt(e.target.value))} className="w-full h-1.5 accent-indigo-600 rounded-lg cursor-pointer" />
      </div>

      <button onClick={() => onUpdateClip({ advancedEffects: clip.advancedEffects?.filter(e => e.type !== 'chroma-key') })} className="w-full text-[10px] py-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition">Reset Chroma Key</button>
    </div>
  );
};

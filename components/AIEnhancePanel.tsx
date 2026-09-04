import React, { useState, useCallback } from 'react';
import { Clip } from '../types';
import { Wand2, RefreshCw, Maximize, Activity, Sun, Sparkles } from 'lucide-react';

interface AIEnhancePanelProps {
  clip: Clip;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

export const AIEnhancePanel: React.FC<AIEnhancePanelProps> = ({ clip, onUpdateClip }) => {
  const [processing, setProcessing] = useState(false);
  const [preset, setPreset] = useState('auto');

  const applyEnhance = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      const effects = [...(clip.effects || [])];
      if (preset === 'auto') {
        effects.push({ id: `enhance_${Date.now()}`, type: 'contrast', value: 110 });
        effects.push({ id: `enhance_${Date.now() + 1}`, type: 'saturate', value: 110 });
      } else if (preset === 'cinematic') {
        effects.push({ id: `enhance_${Date.now()}`, type: 'contrast', value: 120 });
        effects.push({ id: `enhance_${Date.now() + 1}`, type: 'saturate', value: 90 });
      } else if (preset === 'vibrant') {
        effects.push({ id: `enhance_${Date.now()}`, type: 'saturate', value: 140 });
        effects.push({ id: `enhance_${Date.now() + 1}`, type: 'brightness', value: 110 });
      }
      onUpdateClip({ effects });
      setProcessing(false);
    }, 1200);
  }, [clip, preset, onUpdateClip]);

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">AI Enhance</div>

      <div className="grid grid-cols-2 gap-2">
        {['auto', 'cinematic', 'vibrant', 'bw'].map(p => (
          <button key={p} onClick={() => setPreset(p)} className={`py-2 rounded border text-[10px] capitalize ${preset === p ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}>{p}</button>
        ))}
      </div>

      <button onClick={applyEnhance} disabled={processing} className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
        {processing ? <><RefreshCw size={14} className="animate-spin" /> Enhancing...</> : <><Sparkles size={14} /> Apply Enhance</>}
      </button>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-3 space-y-3">
        <div className="text-[10px] text-gray-500">Quick Tools</div>
        {[
          { label: 'Upscale 2x', icon: <Maximize size={12} />, action: () => onUpdateClip({ ai: { ...clip.ai, upscaling: { enabled: true, scale: 2, quality: 'fast' } } }) },
          { label: 'Denoise', icon: <Activity size={12} />, action: () => onUpdateClip({ properties: { ...clip.properties, denoise: true } }) },
          { label: 'Auto Adjust', icon: <Sun size={12} />, action: () => onUpdateClip({ effects: [...(clip.effects || []), { id: `adj_${Date.now()}`, type: 'brightness', value: 105 }] }) },
        ].map(tool => (
          <button key={tool.label} onClick={tool.action} className="w-full py-1.5 border border-gray-200 dark:border-gray-700 rounded text-[10px] hover:bg-gray-50 dark:hover:bg-white/5 transition flex items-center justify-center gap-2">
            {tool.icon} {tool.label}
          </button>
        ))}
      </div>
    </div>
  );
};

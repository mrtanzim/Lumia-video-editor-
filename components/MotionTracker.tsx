import React, { useState } from 'react';
import { Clip } from '../types';
import { ScanFace, Plus, Trash2 } from 'lucide-react';

interface MotionTrackerProps {
  clip: Clip;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

export const MotionTracker: React.FC<MotionTrackerProps> = ({ clip, onUpdateClip }) => {
  const [trackers, setTrackers] = useState<{ id: string; type: 'position' | 'scale' | 'rotation'; x: number; y: number }[]>([]);

  const addTracker = () => {
    const newTracker = {
      id: `trk_${Date.now()}`,
      type: 'position' as const,
      x: 0,
      y: 0,
    };
    setTrackers(prev => [...prev, newTracker]);
    onUpdateClip({
      ai: {
        ...clip.ai,
        motionTracking: { enabled: true, targetId: newTracker.id, type: 'position' },
      },
    });
  };

  const removeTracker = (id: string) => {
    setTrackers(prev => prev.filter(t => t.id !== id));
    onUpdateClip({
      ai: {
        ...clip.ai,
        motionTracking: { enabled: false, targetId: undefined, type: 'position' },
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Motion Tracking</div>
      <p className="text-[10px] text-gray-500">Attach text, stickers, or mosaic to a moving subject. Add tracking points and the editor will generate keyframes automatically.</p>

      <div className="space-y-2">
        {trackers.map(trk => (
          <div key={trk.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <ScanFace size={12} className="text-indigo-500" />
              <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 capitalize">{trk.type}</span>
            </div>
            <button onClick={() => removeTracker(trk.id)} className="text-gray-400 hover:text-red-500 transition">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {trackers.length === 0 && (
          <p className="text-[10px] text-gray-500 text-center py-2">No trackers added.</p>
        )}
      </div>

      <button
        onClick={addTracker}
        className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2"
      >
        <Plus size={14} /> Add Tracking Point
      </button>
    </div>
  );
};

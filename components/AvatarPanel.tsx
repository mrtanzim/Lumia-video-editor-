import React, { useState } from 'react';
import { Clip } from '../types';
import { Smile, RefreshCw } from 'lucide-react';

interface AvatarPanelProps {
  clip: Clip;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

export const AvatarPanel: React.FC<AvatarPanelProps> = ({ clip, onUpdateClip }) => {
  const [avatar, setAvatar] = useState<'none' | 'talking' | 'emoji'>('none');

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">AI Avatar</div>
      <p className="text-[10px] text-gray-500">Generate a talking avatar from a photo or emoji, synced to audio.</p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'none', label: 'None' },
          { key: 'talking', label: 'Talking Photo' },
          { key: 'emoji', label: 'Emoji Avatar' },
        ].map(opt => (
          <button key={opt.key} onClick={() => setAvatar(opt.key as any)} className={`py-2 rounded border text-[10px] ${avatar === opt.key ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}>{opt.label}</button>
        ))}
      </div>

      {avatar !== 'none' && (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Voice</label>
            <select className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-1.5 text-xs">
              <option>Rachel</option>
              <option>Domi</option>
              <option>Antoni</option>
            </select>
          </div>
          <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
            <RefreshCw size={14} /> Generate Avatar
          </button>
        </div>
      )}
    </div>
  );
};

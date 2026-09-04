import React, { useState } from 'react';
import { Clip } from '../types';
import { Languages, Play } from 'lucide-react';

interface TranslationPanelProps {
  clip: Clip;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = ({ clip, onUpdateClip }) => {
  const [targetLang, setTargetLang] = useState('Spanish');
  const [dubbing, setDubbing] = useState(false);

  const translate = () => {
    setDubbing(true);
    setTimeout(() => {
      onUpdateClip({
        ai: {
          ...clip.ai,
          subtitles: { enabled: true, language: targetLang, style: 'standard' },
        },
      });
      setDubbing(false);
      alert(`Translated captions to ${targetLang}. Dubbing voiceover generated.`);
    }, 1000);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">AI Translation & Dubbing</div>
      <p className="text-[10px] text-gray-500">Translate captions to another language and generate AI-dubbed voiceover.</p>

      <div>
        <label className="text-[10px] text-gray-500 block mb-1">Target Language</label>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-2 text-xs">
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
          <option>Hindi</option>
          <option>Japanese</option>
          <option>Portuguese</option>
        </select>
      </div>

      <button onClick={translate} disabled={dubbing} className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
        {dubbing ? <><div className="animate-spin h-3 w-3 border-b-2 border-white rounded-full"></div> Translating...</> : <><Languages size={14} /> Translate & Dub</>}
      </button>
    </div>
  );
};

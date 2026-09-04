import React, { useState, useMemo } from 'react';
import { Clip, TrackType } from '../types';
import { Smile, Star, Heart } from 'lucide-react';

interface StickerOverlayProps {
  clip: Clip;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

const STICKERS = [
  { id: 's1', name: 'Smile', emoji: '😀', category: 'Emoji' },
  { id: 's2', name: 'Star', emoji: '⭐', category: 'Emoji' },
  { id: 's3', name: 'Heart', emoji: '❤️', category: 'Emoji' },
  { id: 's4', name: 'Fire', emoji: '🔥', category: 'Emoji' },
  { id: 's5', name: 'Thumbs Up', emoji: '👍', category: 'Emoji' },
  { id: 's6', name: 'Clap', emoji: '👏', category: 'Emoji' },
  { id: 's7', name: 'Thinking', emoji: '🤔', category: 'Emoji' },
  { id: 's8', name: 'Party', emoji: '🎉', category: 'Emoji' },
];

export const StickerOverlay: React.FC<StickerOverlayProps> = ({ clip, onUpdateClip }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const stickers = useMemo(() => STICKERS, []);

  const addSticker = (sticker: typeof STICKERS[0]) => {
    const text = (clip.properties?.text || '') + ' ' + sticker.emoji;
    onUpdateClip({ properties: { ...clip.properties, text } });
  };

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Stickers & Overlays</div>
      <div className="grid grid-cols-4 gap-2">
        {stickers.map(s => (
          <button
            key={s.id}
            onClick={() => addSticker(s)}
            className={`p-2 rounded border text-lg flex items-center justify-center hover:border-indigo-500 transition ${selected === s.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500' : 'border-gray-200 dark:border-gray-700'}`}
            title={s.name}
          >
            {s.emoji}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-500">Click to append sticker to selected text clip. For full sticker layers, use the text tool and paste emojis.</p>
    </div>
  );
};

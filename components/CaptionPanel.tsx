import React from 'react';

interface CaptionPanelProps {
  captions: { id: string; start: number; end: number; text: string }[];
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateCaption: (id: string, text: string) => void;
  onGenerateCaptions: () => void;
  isGenerating: boolean;
}

export const CaptionPanel: React.FC<CaptionPanelProps> = ({
  captions, currentTime, onSeek, onUpdateCaption, onGenerateCaptions, isGenerating,
}) => {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Transcript</span>
        <button
          onClick={onGenerateCaptions}
          disabled={isGenerating}
          className="text-[10px] px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {isGenerating ? 'Generating...' : 'Auto-Generate'}
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {captions.length === 0 && (
          <p className="text-[10px] text-gray-500 text-center py-4">No captions yet. Select an audio/video clip and click "Auto-Generate".</p>
        )}
        {captions.map(cap => {
          const isActive = currentTime >= cap.start && currentTime <= cap.end;
          return (
            <div
              key={cap.id}
              onClick={() => onSeek(cap.start)}
              className={`p-2 rounded border cursor-pointer transition text-xs ${
                isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-gray-800 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-gray-500">
                  {new Date(cap.start * 1000).toISOString().substr(14, 5)} - {new Date(cap.end * 1000).toISOString().substr(14, 5)}
                </span>
                {isActive && <span className="text-[9px] text-indigo-600 font-bold">PLAYING</span>}
              </div>
              <input
                type="text"
                value={cap.text}
                onChange={(e) => onUpdateCaption(cap.id, e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs text-gray-800 dark:text-gray-200"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

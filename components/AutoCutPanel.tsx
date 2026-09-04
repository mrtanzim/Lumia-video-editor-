import React, { useState, useCallback } from 'react';
import { Project, Clip } from '../types';
import { Scissors, VolumeX, Mic } from 'lucide-react';

interface AutoCutPanelProps {
  project: Project;
  selectedClip: Clip | null;
  onUpdateProject: (updates: Partial<Project>) => void;
  onDeleteClip: (clipId: string) => void;
}

export const AutoCutPanel: React.FC<AutoCutPanelProps> = ({ project, selectedClip, onUpdateProject, onDeleteClip }) => {
  const [removingSilences, setRemovingSilences] = useState(false);
  const [removingFillers, setRemovingFillers] = useState(false);

  const removeSilences = useCallback(() => {
    if (!selectedClip || selectedClip.type !== 'audio') return;
    setRemovingSilences(true);
    setTimeout(() => {
      onDeleteClip(selectedClip.id);
      setRemovingSilences(false);
      alert('Silences removed from selected audio clip. (Demo)');
    }, 800);
  }, [selectedClip, onDeleteClip]);

  const removeFillers = useCallback(() => {
    if (!selectedClip || selectedClip.type !== 'audio') return;
    setRemovingFillers(true);
    setTimeout(() => {
      onDeleteClip(selectedClip.id);
      setRemovingFillers(false);
      alert('Filler words removed from selected audio clip. (Demo)');
    }, 800);
  }, [selectedClip, onDeleteClip]);

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Auto Cut & Smart Edit</div>
      <p className="text-[10px] text-gray-500">Transcript-based editing. Delete words in transcript → matching video segment removed.</p>

      <div className="space-y-2">
        <button onClick={removeSilences} disabled={removingSilences || !selectedClip} className="w-full py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50 transition flex items-center justify-center gap-2">
          {removingSilences ? <><div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full"></div> Removing...</> : <><VolumeX size={14} /> Remove Silences</>}
        </button>
        <button onClick={removeFillers} disabled={removingFillers || !selectedClip} className="w-full py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50 transition flex items-center justify-center gap-2">
          {removingFillers ? <><div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full"></div> Removing...</> : <><Scissors size={14} /> Remove Filler Words</>}
        </button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
        <div className="text-[10px] text-gray-500 mb-2">Transcript Editor</div>
        <div className="p-2 bg-gray-50 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-gray-800 text-[10px] text-gray-600 dark:text-gray-400">
          {selectedClip ? 'Select an audio/video clip to see transcript here. Click words to remove segments.' : 'Select a clip first.'}
        </div>
      </div>
    </div>
  );
};

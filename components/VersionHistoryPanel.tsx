import React, { useState } from 'react';
import { Project, Clip } from '../types';
import { History, RotateCcw, MessageSquare, ChevronRight, ChevronDown } from 'lucide-react';

interface VersionHistoryPanelProps {
  project: Project;
  selectedClip: Clip | null;
  onRestoreVersion: (version: { timestamp: number; label: string; project: Project }) => void;
  onAddComment: (clipId: string, comment: string) => void;
}

interface Version {
  timestamp: number;
  label: string;
  project: Project;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({ project, selectedClip, onRestoreVersion, onAddComment }) => {
  const [versions, setVersions] = useState<Version[]>([
    { timestamp: Date.now() - 3600000, label: 'Auto-save', project },
    { timestamp: Date.now() - 7200000, label: 'Manual save', project },
  ]);
  const [showVersions, setShowVersions] = useState(true);
  const [commentText, setCommentText] = useState('');

  const createSnapshot = () => {
    const snapshot: Version = {
      timestamp: Date.now(),
      label: `Snapshot ${versions.length + 1}`,
      project: JSON.parse(JSON.stringify(project)),
    };
    setVersions(prev => [snapshot, ...prev]);
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleString();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Version History</span>
        <button onClick={createSnapshot} className="text-[10px] px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Save Snapshot</button>
      </div>

      <div className="space-y-1">
        {versions.map((v, i) => (
          <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowVersions(true)}
              className="w-full flex items-center justify-between p-2 bg-gray-50 dark:bg-[#1f1f1f] hover:bg-gray-100 dark:hover:bg-[#252525] transition text-left"
            >
              <div className="flex items-center gap-2">
                <History size={12} className="text-indigo-500" />
                <div>
                  <div className="text-[10px] font-medium text-gray-800 dark:text-gray-200">{v.label}</div>
                  <div className="text-[9px] text-gray-500">{formatDate(v.timestamp)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); onRestoreVersion(v); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded" title="Restore">
                  <RotateCcw size={10} />
                </button>
                <ChevronDown size={10} className="text-gray-400" />
              </div>
            </button>
          </div>
        ))}
      </div>

      {selectedClip && (
        <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Clip Comments</span>
          <div className="space-y-2 mb-2">
            {(selectedClip.metadata?.notes || '').split('\n').filter(Boolean).map((note, i) => (
              <div key={i} className="p-2 bg-gray-50 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-gray-800 text-[10px] text-gray-700 dark:text-gray-300">{note}</div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add comment..."
              className="flex-1 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252525] text-xs outline-none focus:border-indigo-500"
            />
            <button onClick={() => { onAddComment(selectedClip.id, commentText); setCommentText(''); }} className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px] hover:bg-indigo-700 transition">Add</button>
          </div>
        </div>
      )}
    </div>
  );
};

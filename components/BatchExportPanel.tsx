import React, { useState, useCallback } from 'react';
import { Project, Clip } from '../types';
import { Download, Play, Trash2, Check, X, Loader2 } from 'lucide-react';

interface ExportQueueItem {
  id: string;
  filename: string;
  format: string;
  resolution: string;
  progress: number;
  status: 'queued' | 'rendering' | 'done' | 'error';
}

interface BatchExportPanelProps {
  project: Project;
  onExport: (options: any) => Promise<Blob>;
}

export const BatchExportPanel: React.FC<BatchExportPanelProps> = ({ project, onExport }) => {
  const [queue, setQueue] = useState<ExportQueueItem[]>([]);
  const [rendering, setRendering] = useState(false);

  const addToQueue = useCallback(() => {
    const item: ExportQueueItem = {
      id: `exp_${Date.now()}`,
      filename: `${project.name.replace(/\.[^.]+$/, '')}_export_${queue.length + 1}.webm`,
      format: 'webm',
      resolution: `${project.width}x${project.height}`,
      progress: 0,
      status: 'queued',
    };
    setQueue(prev => [...prev, item]);
  }, [project.name, queue.length]);

  const processQueue = useCallback(async () => {
    setRendering(true);
    for (const item of queue) {
      if (item.status === 'done') continue;
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'rendering', progress: 0 } : q));
      try {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
        if (!canvas) throw new Error('No canvas found');
        await onExport({ format: 'webm', resolution: { width: project.width, height: project.height }, fps: project.fps, quality: 23 });
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 100, status: 'done' } : q));
      } catch {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error' } : q));
      }
    }
    setRendering(false);
  }, [queue, project, onExport]);

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Batch Export Queue</div>
      <p className="text-[10px] text-gray-500">Export multiple versions/resolutions in the background.</p>

      <button onClick={addToQueue} className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2">
        <Download size={14} /> Add Export to Queue
      </button>

      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map(item => (
            <div key={item.id} className="p-3 bg-gray-50 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{item.filename}</div>
                  <div className="text-[9px] text-gray-500">{item.resolution} • {item.format}</div>
                </div>
                <div className="flex items-center gap-1">
                  {item.status === 'done' && <Check size={12} className="text-green-500" />}
                  {item.status === 'error' && <X size={12} className="text-red-500" />}
                  {item.status === 'rendering' && <Loader2 size={12} className="animate-spin text-indigo-500" />}
                  <button onClick={() => removeFromQueue(item.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><Trash2 size={10} /></button>
                </div>
              </div>
              {item.status === 'rendering' && (
                <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                </div>
              )}
            </div>
          ))}
          <button onClick={processQueue} disabled={rendering || queue.every(q => q.status === 'done')} className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {rendering ? <><Loader2 size={14} className="animate-spin" /> Rendering...</> : <><Play size={14} /> Process Queue</>}
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useCallback } from 'react';
import { Project, ProjectSettings, ASPECT_RATIOS } from '../services/projectSettings';
import { X, Check, MonitorPlay, Gauge, RefreshCw, Magnet } from 'lucide-react';

interface ProjectSettingsModalProps {
  project: Project;
  onClose: () => void;
  onUpdateProject: (updates: Partial<Project>) => void;
  rippleEdit: boolean;
  onToggleRipple: () => void;
  snapEnabled: boolean;
  onToggleSnap: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  onClose,
  onUpdateProject,
  rippleEdit,
  onToggleRipple,
  snapEnabled,
  onToggleSnap,
}) => {
  const [settings, setSettings] = useState<ProjectSettings>({
    width: project.width,
    height: project.height,
    fps: project.fps,
    aspectRatio: (() => {
      const r = project.width / project.height;
      if (Math.abs(r - 16/9) < 0.05) return '16:9';
      if (Math.abs(r - 9/16) < 0.05) return '9:16';
      if (Math.abs(r - 1) < 0.05) return '1:1';
      if (Math.abs(r - 4/5) < 0.05) return '4:5';
      return '16:9';
    })(),
    rippleEdit,
  });

  const handleAspectChange = (key: string) => {
    const dims = ASPECT_RATIOS[key];
    if (!dims) return;
    setSettings(prev => ({ ...prev, aspectRatio: key as ProjectSettings['aspectRatio'], width: dims.width, height: dims.height }));
  };

  const handleApply = () => {
    onUpdateProject({ width: settings.width, height: settings.height, fps: settings.fps });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><MonitorPlay size={16} /> Sequence Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ASPECT_RATIOS).map(([key, dims]) => (
                <button
                  key={key}
                  onClick={() => handleAspectChange(key)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition ${
                    settings.aspectRatio === key
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-gray-50 dark:bg-[#252525] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {dims.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Resolution</label>
              <div className="flex items-center gap-2">
                <input type="number" value={settings.width} onChange={e => setSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 1920 }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252525] text-xs text-gray-900 dark:text-white" />
                <span className="text-gray-400">x</span>
                <input type="number" value={settings.height} onChange={e => setSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 1080 }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252525] text-xs text-gray-900 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Frame Rate</label>
              <select value={settings.fps} onChange={e => setSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#252525] text-xs text-gray-900 dark:text-white">
                {[24, 30, 60].map(fps => <option key={fps} value={fps}>{fps} fps</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Editing Behavior</label>
            <div className="space-y-2">
              <button onClick={onToggleRipple} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${rippleEdit ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-gray-50 dark:bg-[#252525] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
                <span className="flex items-center gap-2"><RefreshCw size={14} /> Ripple Edit</span>
                <span className="text-[10px] font-mono opacity-60">{rippleEdit ? 'ON' : 'OFF'}</span>
              </button>
              <button onClick={onToggleSnap} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${snapEnabled ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' : 'bg-gray-50 dark:bg-[#252525] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>
                <span className="flex items-center gap-2"><Magnet size={14} /> Snapping</span>
                <span className="text-[10px] font-mono opacity-60">{snapEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">Cancel</button>
          <button onClick={handleApply} className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-2"><Check size={14} /> Apply</button>
        </div>
      </div>
    </div>
  );
};

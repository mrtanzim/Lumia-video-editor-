import React, { useState } from 'react';
import { Puzzle, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  installed: boolean;
}

const DEFAULT_PLUGINS: Plugin[] = [
  { id: 'p1', name: 'ProRes Export', description: 'Export in ProRes codec for professional workflows.', version: '1.2.0', enabled: true, installed: true },
  { id: 'p2', name: 'FilmBurn Transitions', description: 'Add 50+ film-burn and light-leak transitions.', version: '2.0.1', enabled: false, installed: true },
  { id: 'p3', name: '3D Text Generator', description: 'Generate 3D text layers with depth and materials.', version: '0.9.0', enabled: false, installed: false },
  { id: 'p4', name: 'Audio Ducking Pro', description: 'AI-powered auto-ducking with scene detection.', version: '1.0.0', enabled: false, installed: false },
];

interface PluginPanelProps {
  plugins?: Plugin[];
  onToggle?: (id: string) => void;
  onInstall?: (id: string) => void;
  onUninstall?: (id: string) => void;
}

export const PluginPanel: React.FC<PluginPanelProps> = ({ plugins = DEFAULT_PLUGINS, onToggle, onInstall, onUninstall }) => {
  const [list, setList] = useState<Plugin[]>(plugins);

  const handleToggle = (id: string) => {
    const updated = list.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
    setList(updated);
    onToggle?.(id);
  };

  const handleInstall = (id: string) => {
    const updated = list.map(p => p.id === id ? { ...p, installed: true, enabled: true } : p);
    setList(updated);
    onInstall?.(id);
  };

  const handleUninstall = (id: string) => {
    const updated = list.filter(p => p.id !== id);
    setList(updated);
    onUninstall?.(id);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Plugins & Extensions</div>
      <p className="text-[10px] text-gray-500">Extend Lumina with community plugins or build your own.</p>

      <div className="space-y-2">
        {list.map(plugin => (
          <div key={plugin.id} className="p-3 bg-gray-50 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Puzzle size={14} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">{plugin.name}</div>
                  <div className="text-[9px] text-gray-500">v{plugin.version}</div>
                </div>
              </div>
              {plugin.installed ? (
                <button onClick={() => handleToggle(plugin.id)} className="text-gray-400 hover:text-indigo-500 transition">
                  {plugin.enabled ? <ToggleRight size={20} className="text-indigo-500" /> : <ToggleLeft size={20} />}
                </button>
              ) : (
                <button onClick={() => handleInstall(plugin.id)} className="text-[10px] px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">Install</button>
              )}
            </div>
            <p className="text-[10px] text-gray-600 dark:text-gray-400">{plugin.description}</p>
            {plugin.installed && (
              <div className="flex justify-end">
                <button onClick={() => handleUninstall(plugin.id)} className="text-[9px] text-red-500 hover:text-red-600 flex items-center gap-1"><Trash2 size={10} /> Uninstall</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2">
        <Plus size={14} /> Browse Plugin Store
      </button>
    </div>
  );
};

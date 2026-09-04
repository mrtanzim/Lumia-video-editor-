import React, { useState, useCallback } from 'react';
import { Project } from '../types';
import { Monitor, Smartphone, Tablet, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ProxyMediaPanelProps {
  project: Project;
  onUpdateProject: (updates: Partial<Project>) => void;
}

type QualityPreset = 'auto' | 'draft' | 'full';

export const ProxyMediaPanel: React.FC<ProxyMediaPanelProps> = ({ project, onUpdateProject }) => {
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [preset, setPreset] = useState<QualityPreset>('auto');
  const [connected, setConnected] = useState(false);

  const presets = [
    { key: 'auto' as QualityPreset, label: 'Auto', desc: '720p proxy for 4K+' },
    { key: 'draft' as QualityPreset, label: 'Draft', desc: '480p for slow machines' },
    { key: 'full' as QualityPreset, label: 'Full', desc: 'Original resolution' },
  ];

  const toggleProxy = useCallback(() => {
    const next = !proxyEnabled;
    setProxyEnabled(next);
    if (next && preset === 'auto') {
      onUpdateProject({ width: 1280, height: 720 });
    } else if (!next && preset === 'auto') {
      onUpdateProject({ width: 1920, height: 1080 });
    }
  }, [proxyEnabled, preset, onUpdateProject]);

  const handlePresetChange = (p: QualityPreset) => {
    setPreset(p);
    if (p === 'auto' && proxyEnabled) onUpdateProject({ width: 1280, height: 720 });
    else if (p === 'full' && proxyEnabled) onUpdateProject({ width: 1920, height: 1080 });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Performance & Proxy</div>

      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {connected ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-gray-400" />}
          <div>
            <div className="text-[10px] font-medium text-gray-800 dark:text-gray-200">Cloud Sync</div>
            <div className="text-[9px] text-gray-500">{connected ? 'Connected' : 'Offline'}</div>
          </div>
        </div>
        <button onClick={() => setConnected(!connected)} className={`text-[10px] px-2 py-1 rounded ${connected ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
          {connected ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-medium text-gray-800 dark:text-gray-200">Proxy Media</div>
          <div className="text-[9px] text-gray-500">Use lower-res placeholders for smoother scrubbing</div>
        </div>
        <button onClick={toggleProxy} className={`text-[10px] px-2 py-1 rounded ${proxyEnabled ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
          {proxyEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {proxyEnabled && (
        <div className="space-y-2">
          {presets.map(p => (
            <button key={p.key} onClick={() => handlePresetChange(p.key)} className={`w-full p-2 rounded border text-left transition ${preset === p.key ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}>
              <div className="text-[10px] font-medium text-gray-800 dark:text-gray-200">{p.label}</div>
              <div className="text-[9px] text-gray-500">{p.desc}</div>
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
        <div className="text-[10px] text-gray-500 mb-2">Device Preview</div>
        <div className="flex gap-2">
          {[Monitor, Tablet, Smartphone].map((Icon, i) => (
            <button key={i} className="flex-1 p-2 border border-gray-200 dark:border-gray-700 rounded flex items-center justify-center hover:border-indigo-500 transition">
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

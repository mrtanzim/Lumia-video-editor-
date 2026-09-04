
import React, { useState } from 'react';
import { X, Monitor, Zap, LayoutTemplate, Share2, Keyboard, Shield, Globe, Bell, Code, Palette } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'performance', label: 'Performance', icon: <Zap size={18} /> },
  { id: 'project', label: 'Project Defaults', icon: <LayoutTemplate size={18} /> },
  { id: 'export', label: 'Export', icon: <Share2 size={18} /> },
  { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={18} /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield size={18} /> },
  { id: 'language', label: 'Language', icon: <Globe size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'advanced', label: 'Advanced', icon: <Code size={18} /> },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#121212] w-full max-w-5xl h-[80vh] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl flex overflow-hidden flex-col md:flex-row transition-colors duration-300">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-gray-50 dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Monitor className="text-indigo-600 dark:text-indigo-500" /> Settings
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-2
                        ${activeTab === tab.id 
                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-white' 
                            : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#121212]">
            {/* Header */}
            <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{TABS.find(t => t.id === activeTab)?.label}</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition">
                    <X size={24} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                
                {activeTab === 'appearance' && (
                    <div className="space-y-8">
                        <Section title="Theme Settings">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['dark', 'light', 'auto'].map((mode) => (
                                    <button 
                                        key={mode}
                                        onClick={() => updateSetting('appearance', 'theme', mode)}
                                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition
                                        ${localSettings.appearance.theme === mode 
                                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}
                                    >
                                        <div className={`w-full h-12 rounded bg-gradient-to-br border border-gray-200 dark:border-transparent ${mode === 'light' ? 'from-gray-100 to-white' : 'from-gray-800 to-black'}`}></div>
                                        <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{mode}</span>
                                    </button>
                                ))}
                            </div>
                        </Section>

                        <Section title="Interface">
                            <Toggle 
                                label="Show Timeline Grid" 
                                checked={localSettings.appearance.showGrid} 
                                onChange={(v) => updateSetting('appearance', 'showGrid', v)} 
                            />
                             <Toggle 
                                label="Show Ruler Marks" 
                                checked={localSettings.appearance.showRuler} 
                                onChange={(v) => updateSetting('appearance', 'showRuler', v)} 
                            />
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">UI Density</label>
                                <select 
                                    value={localSettings.appearance.uiDensity}
                                    onChange={(e) => updateSetting('appearance', 'uiDensity', e.target.value)}
                                    className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 w-full text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="compact">Compact</option>
                                    <option value="comfortable">Comfortable</option>
                                    <option value="spacious">Spacious</option>
                                </select>
                            </div>
                        </Section>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div className="space-y-6">
                         <Section title="Rendering & Playback">
                            <Toggle 
                                label="Hardware Acceleration (GPU)" 
                                desc="Use graphics card for faster rendering"
                                checked={localSettings.performance.hardwareAcceleration} 
                                onChange={(v) => updateSetting('performance', 'hardwareAcceleration', v)} 
                            />
                            
                            <div className="pt-4">
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Preview Quality</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['low', 'medium', 'high'].map((q) => (
                                        <button 
                                            key={q}
                                            onClick={() => updateSetting('performance', 'previewQuality', q)}
                                            className={`px-4 py-2 rounded-lg text-sm border transition
                                            ${localSettings.performance.previewQuality === q 
                                                ? 'bg-indigo-600 border-indigo-500 text-white' 
                                                : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                                        >
                                            {q.charAt(0).toUpperCase() + q.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                             <div className="pt-4">
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">RAM Limit</label>
                                    <span className="text-sm text-indigo-600 dark:text-indigo-400 font-mono">{localSettings.performance.ramLimit} GB</span>
                                </div>
                                <input 
                                    type="range" min="2" max="16" step="2"
                                    value={localSettings.performance.ramLimit}
                                    onChange={(e) => updateSetting('performance', 'ramLimit', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
                                />
                            </div>
                        </Section>
                    </div>
                )}

                {activeTab === 'project' && (
                    <div className="space-y-6">
                        <Section title="Auto-Save & Recovery">
                            <Toggle 
                                label="Enable Auto-Save" 
                                checked={localSettings.projectDefaults.autoSave} 
                                onChange={(v) => updateSetting('projectDefaults', 'autoSave', v)} 
                            />
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Auto-Save Interval (Minutes)</label>
                                <select 
                                    value={localSettings.projectDefaults.autoSaveInterval}
                                    onChange={(e) => updateSetting('projectDefaults', 'autoSaveInterval', parseInt(e.target.value))}
                                    className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 w-full text-gray-900 dark:text-white"
                                >
                                    <option value={1}>1 Minute</option>
                                    <option value={5}>5 Minutes</option>
                                    <option value={10}>10 Minutes</option>
                                    <option value={30}>30 Minutes</option>
                                </select>
                            </div>
                        </Section>
                        <Section title="New Project Defaults">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Resolution</label>
                                    <select 
                                        value={localSettings.projectDefaults.defaultResolution}
                                        onChange={(e) => updateSetting('projectDefaults', 'defaultResolution', e.target.value)}
                                        className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 w-full text-gray-900 dark:text-white"
                                    >
                                        <option value="720p">720p HD</option>
                                        <option value="1080p">1080p Full HD</option>
                                        <option value="4K">4K Ultra HD</option>
                                    </select>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Duration (Sec)</label>
                                    <input 
                                        type="number"
                                        value={localSettings.projectDefaults.defaultDuration}
                                        onChange={(e) => updateSetting('projectDefaults', 'defaultDuration', parseInt(e.target.value))}
                                        className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 w-full text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </Section>
                    </div>
                )}
                
                 {['export', 'shortcuts', 'privacy', 'language', 'notifications', 'advanced'].includes(activeTab) && (
                     <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                         <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                             {TABS.find(t => t.id === activeTab)?.icon}
                         </div>
                         <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Settings for {TABS.find(t => t.id === activeTab)?.label}</h3>
                         <p className="text-sm">This section is currently under development.</p>
                     </div>
                 )}

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] flex justify-end gap-3 shrink-0">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 dark:shadow-indigo-900/20 transition"
                >
                    Save Changes
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

// UI Components for Settings
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a]/50 rounded-xl p-6">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">{title}</h4>
        {children}
    </div>
);

const Toggle: React.FC<{ label: string; desc?: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between py-3">
        <div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</div>
            {desc && <div className="text-xs text-gray-500 mt-0.5">{desc}</div>}
        </div>
        <button 
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);

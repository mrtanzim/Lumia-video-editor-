
import React, { useState, useMemo } from 'react';
import { Command, X, Search, Keyboard } from 'lucide-react';

interface ShortcutsOverlayProps {
  onClose: () => void;
}

const SHORTCUT_DATA = [
    { category: 'Playback', keys: [{ key: 'Space', desc: 'Play / Pause' }, { key: 'J', desc: 'Rewind' }, { key: 'K', desc: 'Stop' }, { key: 'L', desc: 'Fast Forward' }, { key: '←', desc: 'Previous Frame' }, { key: '→', desc: 'Next Frame' }] },
    { category: 'Editing', keys: [{ key: 'Ctrl+Z', desc: 'Undo Action' }, { key: 'Ctrl+Y', desc: 'Redo Action' }, { key: 'Ctrl+C', desc: 'Copy Clip' }, { key: 'Ctrl+V', desc: 'Paste Clip' }, { key: 'Del', desc: 'Delete Selected' }, { key: 'Ctrl+D', desc: 'Duplicate Clip' }] },
    { category: 'Timeline', keys: [{ key: '+', desc: 'Zoom In' }, { key: '-', desc: 'Zoom Out' }, { key: '0', desc: 'Reset Zoom' }, { key: 'Home', desc: 'Go to Start' }, { key: 'End', desc: 'Go to End' }, { key: 'S', desc: 'Split Clip' }] },
    { category: 'Tools', keys: [{ key: 'V', desc: 'Select Tool' }, { key: 'C', desc: 'Razor Tool' }, { key: 'T', desc: 'Type Tool' }, { key: 'A', desc: 'Audio Tool' }, { key: 'E', desc: 'Effects' }, { key: 'K', desc: 'AI Assistant' }] },
];

export const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ onClose }) => {
  const [search, setSearch] = useState('');

  const filteredShortcuts = useMemo(() => {
    if (!search) return SHORTCUT_DATA;
    return SHORTCUT_DATA.map(cat => ({
        ...cat,
        keys: cat.keys.filter(k => k.desc.toLowerCase().includes(search.toLowerCase()) || k.key.toLowerCase().includes(search.toLowerCase()))
    })).filter(cat => cat.keys.length > 0);
  }, [search]);

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121212] w-full max-w-2xl h-[80vh] rounded-2xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-[#1a1a1a]">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Keyboard className="text-indigo-500" /> Keyboard Shortcuts
                    </h2>
                    <p className="text-sm text-gray-500">Master your workflow with these hotkeys.</p>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={24} /></button>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search shortcuts..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#121212] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
            </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800">
            {filteredShortcuts.length === 0 ? (
                <div className="text-center text-gray-500 py-10">No shortcuts found matching "{search}"</div>
            ) : (
                <div className="space-y-8">
                    {filteredShortcuts.map((category, idx) => (
                        <div key={idx}>
                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4 px-2 border-l-2 border-indigo-500">{category.category}</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {category.keys.map((s, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-white/5 group transition">
                                        <span className="text-gray-300 text-sm">{s.desc}</span>
                                        <kbd className="font-mono text-xs bg-[#252525] text-white px-2 py-1 rounded border border-gray-700 shadow-sm min-w-[30px] text-center group-hover:border-gray-500 transition">
                                            {s.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#1a1a1a] text-center text-xs text-gray-500 flex justify-between items-center">
            <span>Press <kbd className="font-mono text-gray-300 bg-gray-800 px-1 rounded">?</kbd> to toggle this menu</span>
            <button className="text-indigo-400 hover:text-indigo-300">Reset to Defaults</button>
        </div>
      </div>
    </div>
  );
};

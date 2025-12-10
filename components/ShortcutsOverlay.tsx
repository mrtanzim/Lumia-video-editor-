import React from 'react';
import { Command, X } from 'lucide-react';

interface ShortcutsOverlayProps {
  onClose: () => void;
}

export const ShortcutsOverlay: React.FC<ShortcutsOverlayProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause' },
    { key: 'C', desc: 'Cut Tool' },
    { key: 'V', desc: 'Select Tool' },
    { key: 'Del', desc: 'Delete Selected Clip' },
    { key: 'Ctrl + Z', desc: 'Undo' },
    { key: '?', desc: 'Show/Hide Shortcuts' },
    { key: 'Arrow Left', desc: 'Frame Step Back' },
    { key: 'Arrow Right', desc: 'Frame Step Forward' },
    { key: 'J / K / L', desc: 'Rev / Stop / Fwd' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-700 shadow-2xl w-[500px] relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
        >
            <X size={20} />
        </button>
        
        <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2 border-b border-gray-700 pb-3">
            <Command size={20} className="text-indigo-500" /> Keyboard Shortcuts
        </h2>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between group">
                    <span className="text-gray-400 text-sm group-hover:text-gray-200 transition">{s.desc}</span>
                    <span className="text-xs font-mono bg-[#252525] text-indigo-300 px-2 py-1 rounded border border-gray-800 min-w-[30px] text-center shadow-sm">
                        {s.key}
                    </span>
                </div>
            ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
            Press <span className="font-mono text-gray-300">?</span> anytime to toggle this menu
        </div>
      </div>
    </div>
  );
};
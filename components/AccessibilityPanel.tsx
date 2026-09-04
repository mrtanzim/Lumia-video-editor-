import React from 'react';
import { Keyboard, Volume2, Eye, EyeOff } from 'lucide-react';

const SHORTCUTS = [
  { category: 'Playback', items: [
    { keys: ['Space'], action: 'Play / Pause' },
    { keys: ['←'], action: 'Step back 1 frame' },
    { keys: ['→'], action: 'Step forward 1 frame' },
    { keys: ['Shift+←'], action: 'Step back 1 second' },
    { keys: ['Shift+→'], action: 'Step forward 1 second' },
    { keys: ['J'], action: 'Reverse playback' },
    { keys: ['K'], action: 'Pause' },
    { keys: ['L'], action: 'Forward playback' },
  ]},
  { category: 'Editing', items: [
    { keys: ['Ctrl+Z'], action: 'Undo' },
    { keys: ['Ctrl+Y'], action: 'Redo' },
    { keys: ['Ctrl+Shift+Z'], action: 'Redo' },
    { keys: ['Ctrl+X'], action: 'Cut' },
    { keys: ['Ctrl+C'], action: 'Copy' },
    { keys: ['Ctrl+V'], action: 'Paste' },
    { keys: ['Ctrl+D'], action: 'Duplicate' },
    { keys: ['Ctrl+A'], action: 'Select All' },
    { keys: ['Del'], action: 'Delete selected' },
    { keys: ['S'], action: 'Split at playhead' },
    { keys: ['M'], action: 'Add marker' },
    { keys: ['Ctrl+E'], action: 'Export' },
    { keys: ['Ctrl+I'], action: 'Import media' },
    { keys: ['Ctrl+N'], action: 'New project' },
    { keys: ['Ctrl+O'], action: 'Open project' },
    { keys: ['Ctrl+S'], action: 'Save project' },
    { keys: ['Shift+Ctrl+S'], action: 'Save As...' },
    { keys: ['Ctrl+/'], action: 'Show shortcuts' },
  ]},
  { category: 'Timeline', items: [
    { keys: ['Ctrl++'], action: 'Zoom in' },
    { keys: ['Ctrl+-'], action: 'Zoom out' },
    { keys: ['Ctrl+0'], action: 'Fit to window' },
    { keys: ['Shift+Scroll'], action: 'Pan horizontally' },
    { keys: ['Ctrl+Scroll'], action: 'Zoom timeline' },
    { keys: ['Home'], action: 'Go to start' },
    { keys: ['End'], action: 'Go to end' },
  ]},
  { category: 'Accessibility', items: [
    { keys: ['F11'], action: 'Fullscreen preview' },
    { keys: ['Alt+Z'], action: 'Zoom to selection' },
    { keys: ['Ctrl+Q'], action: 'Quit' },
  ]},
];

export const AccessibilityPanel: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Keyboard size={14} className="text-indigo-500" />
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Keyboard Shortcuts</span>
      </div>

      <div className="space-y-4">
        {SHORTCUTS.map(group => (
          <div key={group.category}>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{group.category}</div>
            <div className="space-y-1">
              {group.items.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-[11px] text-gray-700 dark:text-gray-300">{shortcut.action}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, j) => (
                      <React.Fragment key={j}>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-[9px] font-mono text-gray-700 dark:text-gray-300 shadow-sm">{key}</kbd>
                        {j < shortcut.keys.length - 1 && <span className="text-[9px] text-gray-400">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Screen Reader</div>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-gray-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <Volume2 size={12} className="text-gray-500" />
              <span className="text-[10px] text-gray-700 dark:text-gray-300">Enable screen reader labels</span>
            </div>
            <input type="checkbox" className="accent-indigo-600" />
          </label>
          <label className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#1f1f1f] rounded border border-gray-200 dark:border-gray-800 cursor-pointer">
            <div className="flex items-center gap-2">
              <Eye size={12} className="text-gray-500" />
              <span className="text-[10px] text-gray-700 dark:text-gray-300">Focus indicators</span>
            </div>
            <input type="checkbox" defaultChecked className="accent-indigo-600" />
          </label>
        </div>
      </div>
    </div>
  );
};

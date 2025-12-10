import React from 'react';
import { Scissors, Type, Music, Wand2, Zap, Film, MousePointer2, Upload } from 'lucide-react';

interface ToolsSidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export const ToolsSidebar: React.FC<ToolsSidebarProps> = ({ activeTool, onToolChange }) => {
  const tools = [
    { id: 'import', icon: <Upload size={24} strokeWidth={1.5} />, label: 'Import Media', shortcut: 'I' },
    { id: 'select', icon: <MousePointer2 size={24} strokeWidth={1.5} />, label: 'Selection Tool', shortcut: 'V' },
    { id: 'cut', icon: <Scissors size={24} strokeWidth={1.5} />, label: 'Razor Tool', shortcut: 'C' },
    { id: 'text', icon: <Type size={24} strokeWidth={1.5} />, label: 'Type Tool', shortcut: 'T' },
    { id: 'audio', icon: <Music size={24} strokeWidth={1.5} />, label: 'Audio Tool', shortcut: 'A' },
    { id: 'ai', icon: <Wand2 size={24} strokeWidth={1.5} />, label: 'AI Assistant', shortcut: 'K' },
    { id: 'effects', icon: <Zap size={24} strokeWidth={1.5} />, label: 'Visual Effects', shortcut: 'E' },
    { id: 'transitions', icon: <Film size={24} strokeWidth={1.5} />, label: 'Transitions', shortcut: 'R' },
  ];

  return (
    <div className="w-[72px] bg-[#0f0f0f] border-r border-gray-800 flex flex-col items-center py-8 gap-6 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
      {tools.map((tool) => {
        const isActive = activeTool === tool.id;
        const isAction = tool.id === 'import'; // Import is an action, not a state
        
        return (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`
              relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group
              ${isActive && !isAction
                ? 'bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
              }
              ${isAction ? 'hover:text-indigo-400 hover:bg-indigo-500/10' : ''}
            `}
            aria-label={tool.label}
          >
            {/* Active Indicator Line (Skip for actions like Import) */}
            {!isAction && (
                <div className={`
                  absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-300
                  ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
                `}></div>
            )}

            {/* Icon with Hover Effect */}
            <div className={`transition-transform duration-300 ${isActive && !isAction ? 'scale-105' : 'group-hover:scale-110'}`}>
                {tool.icon}
            </div>
            
            {/* Modern Animated Tooltip */}
            <div className="absolute left-full ml-5 px-3 py-2 bg-[#1a1a1a]/95 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap flex items-center gap-3 invisible group-hover:visible">
              <span className="text-xs font-medium text-gray-200 tracking-wide">{tool.label}</span>
              <span className="text-[10px] font-mono bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700 min-w-[24px] text-center">{tool.shortcut}</span>
              
              {/* Tooltip Arrow */}
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#1a1a1a] border-l border-b border-gray-700 rotate-45"></div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, Clock, Keyboard, HelpCircle, Info, MessageSquare, Bug, Moon, Sun, LogOut, ChevronRight } from 'lucide-react';
import { UserSettings } from '../types';

interface ProfileMenuProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenShortcuts: () => void;
  onToggleTheme: () => void;
  currentTheme: 'dark' | 'light' | 'auto';
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ 
  onOpenSettings, 
  onOpenHistory, 
  onOpenShortcuts,
  onToggleTheme,
  currentTheme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: <User size={16} />, label: 'My Account', action: () => {}, divider: true },
    { icon: <Settings size={16} />, label: 'Settings', action: onOpenSettings },
    { icon: <Clock size={16} />, label: 'Export History', action: onOpenHistory },
    { icon: <Keyboard size={16} />, label: 'Keyboard Shortcuts', action: onOpenShortcuts, divider: true },
    { icon: <HelpCircle size={16} />, label: 'Tutorials', action: () => {} },
    { icon: <Info size={16} />, label: 'About Lumina', action: () => {} },
    { icon: <MessageSquare size={16} />, label: 'Give Feedback', action: () => {} },
    { icon: <Bug size={16} />, label: 'Report Bug', action: () => {}, divider: true },
  ];

  return (
    <div className="relative z-50" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-transparent hover:border-indigo-300 transition shadow-lg flex items-center justify-center text-white overflow-hidden relative"
      >
        <span className="font-bold text-sm">JS</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* User Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-sm font-bold text-gray-900 dark:text-white">John Smith</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pro Plan Member</p>
          </div>

          <div className="py-2">
            {menuItems.map((item, idx) => (
              <React.Fragment key={idx}>
                <button 
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-white flex items-center gap-3 transition-colors group"
                >
                  <span className="text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.icon}</span>
                  {item.label}
                </button>
                {item.divider && <div className="h-px bg-gray-200 dark:bg-gray-800 my-1 mx-4"></div>}
              </React.Fragment>
            ))}

            {/* Theme Toggle */}
            <button 
              onClick={onToggleTheme}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-white flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                {currentTheme === 'dark' ? <Moon size={16} className="text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"/> : <Sun size={16} className="text-yellow-600"/>}
                <span>Appearance</span>
              </div>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400 capitalize">{currentTheme}</span>
            </button>

            <div className="h-px bg-gray-200 dark:bg-gray-800 my-1 mx-4"></div>

            <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Project, Clip } from '../types';
import { FileText, Download, Upload, Play } from 'lucide-react';

interface TemplatePanelProps {
  project: Project;
  onApplyTemplate: (template: any) => void;
  onSaveAsTemplate: () => void;
}

const BUILT_IN_TEMPLATES = [
  {
    id: 'tpl_intro',
    name: 'Intro + Body + Outro',
    description: '3-part structure with title cards',
    slots: ['intro_video', 'body_video', 'outro_video', 'bg_music'],
  },
  {
    id: 'tpl_social',
    name: 'Social Media Reel',
    description: '9:16 optimized with captions',
    slots: ['main_video', 'music', 'logo_overlay'],
  },
  {
    id: 'tpl_promo',
    name: 'Product Promo',
    description: 'Quick cuts + call-to-action text',
    slots: ['product_video', 'cta_text', 'jingle'],
  },
];

export const TemplatePanel: React.FC<TemplatePanelProps> = ({ project, onApplyTemplate, onSaveAsTemplate }) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Templates</div>

      <div className="space-y-2">
        {BUILT_IN_TEMPLATES.map(tpl => (
          <div
            key={tpl.id}
            onClick={() => setSelected(tpl.id)}
            className={`p-3 rounded border cursor-pointer transition ${
              selected === tpl.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-400'
            }`}
          >
            <div className="text-xs font-bold text-gray-800 dark:text-gray-200">{tpl.name}</div>
            <div className="text-[10px] text-gray-500 mt-1">{tpl.description}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {tpl.slots.map(slot => (
                <span key={slot} className="text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                  {slot}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <button
          onClick={() => onApplyTemplate(BUILT_IN_TEMPLATES.find(t => t.id === selected))}
          className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          <Play size={14} /> Apply Template
        </button>
      )}

      <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
        <button onClick={onSaveAsTemplate} className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2">
          <FileText size={14} /> Save Current Project as Template
        </button>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Clip, TrackType, Transition, Effect, AdvancedEffect } from '../types';
import {
  Sliders, Sparkles, FileText, ChevronDown, ChevronRight, RotateCw, RotateCcw,
  FlipHorizontal, FlipVertical, Lock, Unlock, Volume2, VolumeX, Mic,
  RefreshCw, Clock, Tag, Star, Eye, EyeOff, Hash, Layers, Move, Scissors,
  Cpu, Box, Activity, Aperture, Wand2, Copy, Trash2, Plus, Zap,
  Image as ImageIcon, Eraser, MessageSquare, Mic2, Palette, ScanFace, Maximize, Clapperboard,
  Brain, Diamond, Smile, Languages, Shield
} from 'lucide-react';
import { KeyframeEditor } from '../components/KeyframeEditor';
import { CaptionPanel } from '../components/CaptionPanel';
import { WaveformRenderer } from '../components/WaveformRenderer';
import { ChromaKeyPanel } from '../components/ChromaKeyPanel';
import { MaskPanel } from '../components/MaskPanel';
import { StickerOverlay } from '../components/StickerOverlay';
import { MotionTracker } from '../components/MotionTracker';
import { AutoReframePanel } from '../components/AutoReframePanel';
import { BackgroundRemoverPanel } from '../components/BackgroundRemoverPanel';
import { AutoCutPanel } from '../components/AutoCutPanel';
import { AIEnhancePanel } from '../components/AIEnhancePanel';
import { AvatarPanel } from '../components/AvatarPanel';
import { TranslationPanel } from '../components/TranslationPanel';
import { AccountModal } from '../components/AccountModal';
import { VersionHistoryPanel } from '../components/VersionHistoryPanel';
import { BatchExportPanel } from '../components/BatchExportPanel';
import { PluginPanel } from '../components/PluginPanel';
import { ProxyMediaPanel } from '../components/ProxyMediaPanel';
import { AccessibilityPanel } from '../components/AccessibilityPanel';
import { geminiService } from '../services/geminiService';

interface PropertiesPanelProps {
  selectedClip: Clip | null;
  project: Project;
  currentTime: number;
  onUpdateClip: (updates: Partial<Clip>) => void;
  onAutoEdit: () => void;
}

// --- REUSABLE UI COMPONENTS ---

const SectionHeader: React.FC<{
  title: string;
  expanded: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
  colorClass?: string;
}> = ({ title, expanded, onToggle, icon, colorClass }) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center justify-between p-4 hover:bg-opacity-80 transition border-y border-gray-200 dark:border-gray-800 group
      ${expanded && colorClass ? colorClass : 'bg-gray-50 dark:bg-[#1f1f1f] hover:bg-gray-100 dark:hover:bg-[#252525]'}
    `}
  >
    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
      {icon}
      {title}
    </div>
    {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
  </button>
);

const ControlRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  onReset?: () => void;
  defaultValue?: number;
}> = ({ label, value, min, max, step = 1, unit = '', onChange, onReset, defaultValue }) => {
  const isChanged = defaultValue !== undefined && Math.abs(value - defaultValue) > 0.001;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{label}</label>
        <div className="flex items-center gap-2">
          {isChanged && onReset && (
            <button
              onClick={onReset}
              className="text-gray-400 hover:text-indigo-500 transition"
              title="Reset"
            >
              <RefreshCw size={10} />
            </button>
          )}
          <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-black/30 px-1.5 rounded">
            {Math.round(value * (step < 1 ? 100 : 1)) / (step < 1 ? 100 : 1)}{unit}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500 hover:accent-indigo-500"
        />
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedClip, project, currentTime, onUpdateClip, onAutoEdit }) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'effects' | 'properties' | 'advanced' | 'ai_tools'>('controls');
  const [processingState, setProcessingState] = useState<Record<string, { processing: boolean; progress: number }>>({});

  // Section Collapse State
  const [sections, setSections] = useState({
    transform: true,
    keyframes: false,
    audio: true,
    captions: false,
    // Controls
    crop: false,
    timing: false,
    advAudio: false,
    masking: false,
    // Effects
    color: true,
    filters: false,
    blur: false,
    stylize: false,
    distortion: false,
    keying: false,
    // Advanced
    stabilization: true,
    tracking: false,
    transform3d: false,
    timeEffects: false,
    // AI Tools (Phase 3)
    autoEnhance: true,
    bgRemoval: false,
    smartCrop: false,
    aiStabilize: false,
    objRemoval: false,
    autoSubtitles: false,
    aiAudio: false,
    colorMatch: false,
    aiTracking: false,
    upscaling: false,
    sceneDetect: false,
    smartBlur: false,
    // Info
    metadata: false,
    transitions: true
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- PROCESSING SIMULATION ---
  const simulateAIProcess = (key: string, duration: number, callback?: () => void) => {
    setProcessingState(prev => ({ ...prev, [key]: { processing: true, progress: 0 } }));

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setProcessingState(prev => ({ ...prev, [key]: { processing: true, progress: Math.min(progress, 99) } }));

      if (progress >= 100) {
        clearInterval(interval);
        setProcessingState(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        if (callback) callback();
      }
    }, duration / 20);
  };

  // Helper to update specific property
  const updateProp = (key: string, value: any) => {
    if (!selectedClip) return;
    onUpdateClip({
      properties: {
        ...selectedClip.properties,
        [key]: value
      }
    });
  };

  // Helper to update AI property
  const updateAI = (key: string, value: any) => {
    if (!selectedClip) return;
    onUpdateClip({
      ai: {
        ...selectedClip.ai,
        [key]: { ...(selectedClip.ai as any)?.[key], ...value }
      }
    });
  };

  // Helper to update effects (Phase 1)
  const updateEffect = (type: Effect['type'], value: number) => {
    if (!selectedClip) return;
    const currentEffects = selectedClip.effects || [];
    const existingIndex = currentEffects.findIndex(e => e.type === type);

    let newEffects = [...currentEffects];
    if (existingIndex >= 0) {
      newEffects[existingIndex] = { ...newEffects[existingIndex], value };
    } else {
      newEffects.push({ id: `${type}-${Date.now()}`, type, value });
    }

    if ((type === 'brightness' || type === 'contrast' || type === 'saturate') && value === 100) {
      newEffects = newEffects.filter(e => e.type !== type);
    }
    if ((type === 'hue-rotate' || type === 'blur') && value === 0) {
      newEffects = newEffects.filter(e => e.type !== type);
    }

    onUpdateClip({ effects: newEffects });
  };

  // Helper for Advanced Effects (Phase 2)
  const addAdvancedEffect = (type: AdvancedEffect['type'], name: string) => {
    const newEffect: AdvancedEffect = {
      id: `${type}_${Date.now()}`,
      type,
      name,
      isActive: true,
      params: { intensity: 50 } // Default param
    };
    onUpdateClip({ advancedEffects: [...(selectedClip?.advancedEffects || []), newEffect] });
  };

  const removeAdvancedEffect = (id: string) => {
    onUpdateClip({ advancedEffects: selectedClip?.advancedEffects?.filter(e => e.id !== id) });
  };

  const getEffectValue = (type: Effect['type'], defaultValue: number) => {
    return selectedClip?.effects?.find(e => e.type === type)?.value ?? defaultValue;
  };

  if (!selectedClip) {
    return (
      <div className="w-full bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-gray-800 flex flex-col h-full items-center justify-center text-center p-6 transition-colors">
        <div className="w-16 h-16 bg-gray-100 dark:bg-[#222] rounded-full flex items-center justify-center mb-4">
          <Sliders size={24} className="text-gray-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">No Clip Selected</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Select a clip on the timeline to edit its properties.</p>
      </div>
    );
  }

  // --- TABS CONFIGURATION ---
  const TABS = [
    { id: 'controls', label: 'Controls', icon: Sliders },
    { id: 'effects', label: 'Effects', icon: Sparkles },
    { id: 'keyframes', label: 'Keyframes', icon: Diamond },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'captions', label: 'Captions', icon: MessageSquare },
    { id: 'advanced', label: 'Advanced', icon: Cpu },
    { id: 'ai_tools', label: 'AI', icon: Brain },
    { id: 'platform', label: 'Platform', icon: Shield },
    { id: 'properties', label: 'Info', icon: FileText },
  ] as const;

  return (
    <div className="w-full bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-gray-800 flex flex-col h-full transition-colors duration-300">

      {/* NEW MODERN TABS (Grid Layout - No Scroll) */}
      <div className="p-3 bg-gray-50 dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 z-10 sticky top-0">
        <div className="grid grid-cols-4 gap-1 bg-gray-200 dark:bg-[#1f1f1f] p-1 rounded-lg">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex flex-col items-center justify-center py-2 rounded-md transition-all duration-200 group
                  ${isActive
                    ? 'bg-white dark:bg-[#2a2a2a] text-indigo-600 dark:text-indigo-400 shadow-sm scale-[1.02]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-[#252525] hover:text-gray-700 dark:hover:text-gray-200'
                  }
                `}
              >
                <tab.icon
                  size={16}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                />
                <span className="text-[9px] font-semibold tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 pb-20">

        {/* --- TAB 1: CONTROLS --- */}
        {activeTab === 'controls' && (
          <div className="animate-in fade-in duration-200">
            {/* TRANSFORM */}
            <SectionHeader title="Transform" expanded={sections.transform} onToggle={() => toggleSection('transform')} icon={<Move size={14} />} />
            {sections.transform && (
              <div className="p-5 space-y-4">
                <ControlRow label="Scale" value={selectedClip.properties?.scale ?? 1} min={0} max={5} step={0.01} unit="x" onChange={(v) => updateProp('scale', v)} onReset={() => updateProp('scale', 1)} defaultValue={1} />
                <ControlRow label="Position X" value={selectedClip.properties?.x ?? 0} min={-1000} max={1000} step={1} onChange={(v) => updateProp('x', v)} onReset={() => updateProp('x', 0)} defaultValue={0} />
                <ControlRow label="Position Y" value={selectedClip.properties?.y ?? 0} min={-1000} max={1000} step={1} onChange={(v) => updateProp('y', v)} onReset={() => updateProp('y', 0)} defaultValue={0} />
                <ControlRow label="Rotation" value={selectedClip.properties?.rotation ?? 0} min={-180} max={180} step={1} unit="°" onChange={(v) => updateProp('rotation', v)} onReset={() => updateProp('rotation', 0)} defaultValue={0} />
                <ControlRow label="Opacity" value={selectedClip.properties?.opacity ?? 1} min={0} max={1} step={0.01} onChange={(v) => updateProp('opacity', v)} onReset={() => updateProp('opacity', 1)} defaultValue={1} />
              </div>
            )}

            {/* INLINE TEXT EDIT */}
            {selectedClip.type === TrackType.TEXT && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <label className="text-[10px] text-gray-500 block mb-1.5">Text Content</label>
                <textarea
                  className="w-full bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs h-24 resize-none focus:border-indigo-500 outline-none"
                  value={selectedClip.properties?.text || ''}
                  onChange={(e) => updateProp('text', e.target.value)}
                  placeholder="Enter text..."
                />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Font</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-1.5 text-xs outline-none focus:border-indigo-500"
                      value={selectedClip.properties?.fontFamily || 'sans-serif'}
                      onChange={(e) => updateProp('fontFamily', e.target.value)}
                    >
                      <option value="sans-serif">Sans Serif</option>
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Impact">Impact</option>
                      <option value="Courier New">Monospace</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Size</label>
                    <input
                      type="number"
                      min={8}
                      max={200}
                      className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-1.5 text-xs outline-none focus:border-indigo-500"
                      value={selectedClip.properties?.fontSize || 60}
                      onChange={(e) => updateProp('fontSize', parseInt(e.target.value) || 60)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => updateProp('bold', !selectedClip.properties?.bold)} className={`flex-1 py-1.5 rounded border text-[10px] font-bold ${selectedClip.properties?.bold ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>B</button>
                  <button onClick={() => updateProp('italic', !selectedClip.properties?.italic)} className={`flex-1 py-1.5 rounded border text-[10px] italic ${selectedClip.properties?.italic ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}>I</button>
                  <input type="color" value={selectedClip.properties?.color || '#ffffff'} onChange={(e) => updateProp('color', e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700" title="Text color" />
                </div>
              </div>
            )}

            {/* MASKING */}
            <SectionHeader title="Masking" expanded={sections.masking} onToggle={() => toggleSection('masking')} icon={<Aperture size={14} />} />
            {sections.masking && (
              <div className="p-4 space-y-3">
                <select className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-2 text-xs" value={selectedClip.properties?.mask?.shape || 'none'} onChange={(e) => updateProp('mask', { ...selectedClip.properties?.mask, shape: e.target.value })}>
                  <option value="none">None</option><option value="rectangle">Rectangle</option><option value="circle">Circle</option>
                </select>
                {selectedClip.properties?.mask?.shape && selectedClip.properties.mask.shape !== 'none' && (
                  <>
                    <ControlRow label="Feather" value={selectedClip.properties?.mask?.feather || 0} min={0} max={100} unit="px" onChange={(v) => updateProp('mask', { ...selectedClip.properties?.mask, feather: v })} />
                    <div className="flex items-center gap-2"><input type="checkbox" checked={selectedClip.properties?.mask?.inverted || false} onChange={(e) => updateProp('mask', { ...selectedClip.properties?.mask, inverted: e.target.checked })} /><label className="text-xs">Invert Mask</label></div>
                  </>
                )}
              </div>
            )}

            {/* TIMING */}
            <SectionHeader title="Timing" expanded={sections.timing} onToggle={() => toggleSection('timing')} icon={<Clock size={14} />} />
            {sections.timing && (
              <div className="p-4 space-y-4">
                <div className="flex justify-between"><label className="text-xs">Speed</label><span className="text-xs bg-gray-100 dark:bg-white/10 px-1 rounded">{selectedClip.speed ?? 1}x</span></div>
                <input type="range" min={0.25} max={4} step={0.25} value={selectedClip.speed ?? 1} onChange={(e) => onUpdateClip({ speed: parseFloat(e.target.value) })} className="w-full h-1.5 accent-indigo-600 rounded-lg cursor-pointer" />
              </div>
            )}

            {/* AUDIO */}
            {(selectedClip.type === TrackType.AUDIO || selectedClip.type === TrackType.VIDEO) && (
              <>
                <SectionHeader title="Audio" expanded={sections.audio} onToggle={() => toggleSection('audio')} icon={<Volume2 size={14} />} />
                {sections.audio && (
                  <div className="p-4 space-y-4">
                    <ControlRow label="Volume" value={selectedClip.properties?.volume ?? 1} min={0} max={2} step={0.01} onChange={(v) => updateProp('volume', v)} />
                    <div className="grid grid-cols-2 gap-3"><ControlRow label="Fade In" value={0} min={0} max={5} onChange={() => { }} /><ControlRow label="Fade Out" value={0} min={0} max={5} onChange={() => { }} /></div>
                  </div>
                )}
                <SectionHeader title="Advanced Audio" expanded={sections.advAudio} onToggle={() => toggleSection('advAudio')} icon={<Activity size={14} />} />
                {sections.advAudio && (
                  <div className="p-4 space-y-4">
                    <ControlRow label="Noise Reduction" value={0} min={0} max={100} unit="%" onChange={() => { }} />
                    <select className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-2 text-xs"><option>None</option><option>Small Room</option><option>Large Hall</option></select>
                  </div>
                )}
              </>
            )}

            {/* P2.6 AUTO CUT */}
            <AutoCutPanel project={project} selectedClip={selectedClip} onUpdateProject={handleUpdateClip} onDeleteClip={handleDeleteClip} />
          </div>
        )}

        {/* --- TAB: KEYFRAMES --- */}
        {activeTab === 'keyframes' && (
          <div className="animate-in fade-in duration-200">
            <KeyframeEditor
              clip={selectedClip}
              currentTime={currentTime || 0}
              onAddKeyframe={(property, value) => {
                const kf: Keyframe = {
                  id: `kf_${Date.now()}`,
                  time: (currentTime || 0) - selectedClip.startTime,
                  property,
                  value,
                  easing: 'linear',
                };
                onUpdateClip({ keyframes: [...(selectedClip.keyframes || []), kf] });
              }}
              onUpdateKeyframe={(id, updates) => {
                onUpdateClip({ keyframes: (selectedClip.keyframes || []).map(k => k.id === id ? { ...k, ...updates } : k) });
              }}
              onRemoveKeyframe={(id) => {
                onUpdateClip({ keyframes: (selectedClip.keyframes || []).filter(k => k.id !== id) });
              }}
            />
          </div>
        )}

        {/* --- TAB: AUDIO --- */}
        {activeTab === 'audio' && (
          <div className="animate-in fade-in duration-200">
            {(selectedClip.type === TrackType.AUDIO || selectedClip.type === TrackType.VIDEO) && (
              <>
                <SectionHeader title="Waveform" expanded={true} onToggle={() => {}} icon={<Activity size={14} />} />
                <div className="p-4">
                  <WaveformRenderer clip={selectedClip} width={320} height={64} />
                </div>
                <SectionHeader title="Volume & Fades" expanded={sections.audio} onToggle={() => toggleSection('audio')} icon={<Volume2 size={14} />} />
                {sections.audio && (
                  <div className="p-4 space-y-4">
                    <ControlRow label="Volume" value={selectedClip.properties?.volume ?? 1} min={0} max={2} step={0.01} onChange={(v) => updateProp('volume', v)} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Fade In (s)</label>
                        <input type="number" min={0} max={10} step={0.1} className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-1.5 text-xs outline-none focus:border-indigo-500" value={selectedClip.properties?.fadeIn || 0} onChange={(e) => updateProp('fadeIn', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Fade Out (s)</label>
                        <input type="number" min={0} max={10} step={0.1} className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-1.5 text-xs outline-none focus:border-indigo-500" value={selectedClip.properties?.fadeOut || 0} onChange={(e) => updateProp('fadeOut', parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>
                )}
                <SectionHeader title="Audio Ducking" expanded={sections.advAudio} onToggle={() => toggleSection('advAudio')} icon={<VolumeX size={14} />} />
                {sections.advAudio && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Auto Duck Music</span>
                      <button onClick={() => updateProp('ducking', !selectedClip.properties?.ducking)} className={`text-[10px] px-2 py-1 rounded ${selectedClip.properties?.ducking ? 'bg-indigo-500 text-white' : 'border border-gray-200 dark:border-gray-700'}`}>{selectedClip.properties?.ducking ? 'ON' : 'OFF'}</button>
                    </div>
                    {selectedClip.properties?.ducking && (
                      <ControlRow label="Duck Amount" value={selectedClip.properties?.duckAmount || 0.3} min={0} max={1} step={0.05} onChange={(v) => updateProp('duckAmount', v)} />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* --- TAB: CAPTIONS --- */}
        {activeTab === 'captions' && (
          <div className="animate-in fade-in duration-200">
            <CaptionPanel
              captions={selectedClip.captions || []}
              currentTime={currentTime || 0}
              onSeek={(time) => {}}
              onUpdateCaption={(id, text) => onUpdateClip({ captions: (selectedClip.captions || []).map(c => c.id === id ? { ...c, text } : c) })}
              onGenerateCaptions={async () => {
                simulateAIProcess('captions', 2000);
                const text = await geminiService.generateSubtitles("Demo transcript for: " + selectedClip.name);
                const words = text.split(' ');
                const caps = words.map((w, i) => ({
                  id: `cap_${Date.now()}_${i}`,
                  start: i * 0.5,
                  end: (i + 1) * 0.5,
                  text: w,
                }));
                onUpdateClip({ captions: caps });
              }}
              isGenerating={!!processingState['captions']?.processing}
            />
          </div>
        )}

        {/* --- TAB 2: EFFECTS --- */}
        {activeTab === 'effects' && (
          <div className="animate-in fade-in duration-200">
            <SectionHeader title="Color Correction" expanded={sections.color} onToggle={() => toggleSection('color')} icon={<RefreshCw size={14} />} />
            {sections.color && (
              <div className="p-4 space-y-2">
                <ControlRow label="Brightness" value={getEffectValue('brightness', 100)} min={0} max={200} onChange={(v) => updateEffect('brightness', v)} onReset={() => updateEffect('brightness', 100)} defaultValue={100} />
                <ControlRow label="Contrast" value={getEffectValue('contrast', 100)} min={0} max={200} onChange={(v) => updateEffect('contrast', v)} onReset={() => updateEffect('contrast', 100)} defaultValue={100} />
                <ControlRow label="Saturation" value={getEffectValue('saturate', 100)} min={0} max={200} onChange={(v) => updateEffect('saturate', v)} onReset={() => updateEffect('saturate', 100)} defaultValue={100} />
                <ControlRow label="Hue Shift" value={getEffectValue('hue-rotate', 0)} min={-180} max={180} unit="°" onChange={(v) => updateEffect('hue-rotate', v)} onReset={() => updateEffect('hue-rotate', 0)} defaultValue={0} />
              </div>
            )}

            <SectionHeader title="Stylize" expanded={sections.stylize} onToggle={() => toggleSection('stylize')} icon={<Wand2 size={14} />} />
            {sections.stylize && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'Mono', type: 'grayscale', value: 100 },
                    { name: 'Vintage', type: 'sepia', value: 80 },
                    { name: 'Dramatic', type: 'contrast', value: 150 },
                    { name: 'Viking', type: 'saturate', value: 30 },
                    { name: 'Negative', type: 'invert', value: 100 },
                    { name: 'B&W Blur', type: 'blur', value: 5 },
                  ].map(f => (
                    <button
                      key={f.name}
                      onClick={() => {
                        if (f.type === 'blur') updateEffect('blur', f.value);
                        else if (f.type === 'grayscale') updateEffect('grayscale', f.value);
                        else if (f.type === 'sepia') updateEffect('sepia', f.value);
                        else if (f.type === 'contrast') updateEffect('contrast', f.value);
                        else if (f.type === 'saturate') updateEffect('saturate', f.value);
                        // Handle invert separately if needed or add to Effect type
                      }}
                      className="flex flex-col items-center p-2 rounded bg-gray-100 dark:bg-white/5 border border-transparent hover:border-indigo-500 transition"
                    >
                      <div className={`w-10 h-10 rounded-full mb-1 flex items-center justify-center bg-gray-200 dark:bg-gray-800`}>
                        <ImageIcon size={16} className="text-gray-500" />
                      </div>
                      <span className="text-[10px] font-medium">{f.name}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Overlay FX</h4>
                  <div className="space-y-2">
                    {['Posterize', 'Pixelate', 'Edge Detection'].map(e => (
                      <div key={e} className="flex items-center justify-between">
                        <span className="text-xs">{e}</span>
                        <button onClick={() => addAdvancedEffect(e.toLowerCase().replace(' ', '-') as any, e)} className="text-[10px] px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded">Apply</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <SectionHeader title="Distortion" expanded={sections.distortion} onToggle={() => toggleSection('distortion')} icon={<Activity size={14} />} />
            {sections.distortion && <div className="p-4 space-y-3"><ControlRow label="Lens Distortion" value={0} min={-100} max={100} onChange={() => { }} /><ControlRow label="Glitch" value={0} min={0} max={100} onChange={() => { }} /></div>}
          </div>
        )}

        {/* --- TAB 3: ADVANCED --- */}
        {activeTab === 'advanced' && (
          <div className="animate-in fade-in duration-200">
            <SectionHeader title="Stabilization" expanded={sections.stabilization} onToggle={() => toggleSection('stabilization')} icon={<Activity size={14} />} />
            {sections.stabilization && (
              <div className="p-4 space-y-3">
                <div className="flex justify-between"><label className="text-xs">Stabilize Video</label><input type="checkbox" checked={selectedClip.properties?.stabilization?.enabled || false} onChange={(e) => updateProp('stabilization', { enabled: e.target.checked, smoothness: 50 })} /></div>
                {selectedClip.properties?.stabilization?.enabled && <ControlRow label="Smoothness" value={selectedClip.properties.stabilization.smoothness} min={0} max={100} onChange={() => { }} />}
              </div>
            )}
            <SectionHeader title="3D Transform" expanded={sections.transform3d} onToggle={() => toggleSection('transform3d')} icon={<Box size={14} />} />
            {sections.transform3d && (
              <div className="p-4 space-y-2">
                <ControlRow label="Rotate X" value={selectedClip.properties?.transform3d?.rotateX || 0} min={-180} max={180} unit="°" onChange={(v) => updateProp('transform3d', { ...selectedClip.properties?.transform3d, rotateX: v })} />
                <ControlRow label="Rotate Y" value={selectedClip.properties?.transform3d?.rotateY || 0} min={-180} max={180} unit="°" onChange={(v) => updateProp('transform3d', { ...selectedClip.properties?.transform3d, rotateY: v })} />
              </div>
            )}
          </div>
        )}

        {/* --- TAB 5: AI TOOLS (Phase 3) --- */}
        {activeTab === 'ai_tools' && (
          <div className="animate-in fade-in duration-200">

            {/* 1. AUTO ENHANCE */}
            <SectionHeader title="Auto Enhance" expanded={sections.autoEnhance} onToggle={() => toggleSection('autoEnhance')} icon={<Wand2 size={14} />} colorClass="bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20" />
            {sections.autoEnhance && (
              <AIEnhancePanel clip={selectedClip} onUpdateClip={onUpdateClip} />
            )}

            {/* 2. AUTO REFRAME */}
            <AutoReframePanel
              project={project}
              selectedClip={selectedClip}
              onUpdateProject={(updates) => onUpdateClip({ ...selectedClip, ...updates } as any)}
              onUpdateClip={onUpdateClip}
              onAddClip={onAddClip}
            />

            {/* 3. BACKGROUND REMOVER */}
            <BackgroundRemoverPanel clip={selectedClip} onUpdateClip={onUpdateClip} />

            {/* P2.8 AI AVATARS */}
            <SectionHeader title="AI Avatar" expanded={sections.aiTracking} onToggle={() => toggleSection('aiTracking')} icon={<Smile size={14} />} colorClass="bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20" />
            {sections.aiTracking && (
              <AvatarPanel clip={selectedClip} onUpdateClip={onUpdateClip} />
            )}

            {/* P2.9 TRANSLATION & DUBBING */}
            <SectionHeader title="Translation & Dubbing" expanded={sections.colorMatch} onToggle={() => toggleSection('colorMatch')} icon={<Languages size={14} />} colorClass="bg-teal-50 dark:bg-teal-900/10 hover:bg-teal-100 dark:hover:bg-teal-900/20" />
            {sections.colorMatch && (
              <TranslationPanel clip={selectedClip} onUpdateClip={onUpdateClip} />
            )}

            {/* 4. AUTO SUBTITLES */}
            <SectionHeader title="Auto Subtitles" expanded={sections.autoSubtitles} onToggle={() => toggleSection('autoSubtitles')} icon={<MessageSquare size={14} />} colorClass="bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20" />
            {sections.autoSubtitles && (
              <div className="p-4 space-y-3">
                <button
                  className="w-full py-2 bg-emerald-600 text-white rounded text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition"
                  onClick={async () => {
                    simulateAIProcess('subtitles', 1500);
                    if (selectedClip.type === TrackType.TEXT) {
                      // Mock calling service
                      const subs = await geminiService.generateSubtitles("Sample text for demo");
                      console.log(subs);
                    }
                  }}
                >
                  <MessageSquare size={14} /> Generate Captions
                </button>
                {processingState['subtitles']?.processing && <p className="text-[10px] text-emerald-600 text-center animate-pulse">Transcribing audio...</p>}

                <div className="grid grid-cols-2 gap-2">
                  <select className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded p-1.5 text-xs"><option>English</option><option>Spanish</option><option>Hindi</option></select>
                  <select className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-700 rounded p-1.5 text-xs"><option>Karaoke Style</option><option>Netflix Style</option><option>Minimal</option></select>
                </div>
              </div>
            )}

            {/* 5. AUDIO ENHANCEMENT */}
            <SectionHeader title="Audio Enhancement" expanded={sections.aiAudio} onToggle={() => toggleSection('aiAudio')} icon={<Mic2 size={14} />} />
            {sections.aiAudio && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-white/5 rounded border border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium">Voice Isolation</span>
                  <button className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full">Active</button>
                </div>
                <ControlRow label="Denoise Strength" value={75} min={0} max={100} unit="%" onChange={() => { }} />
                <ControlRow label="De-Reverb" value={40} min={0} max={100} unit="%" onChange={() => { }} />
              </div>
            )}

            {/* 6. COLOR MATCHING */}
            <SectionHeader title="Color Matching" expanded={sections.colorMatch} onToggle={() => toggleSection('colorMatch')} icon={<Palette size={14} />} />
            {sections.colorMatch && (
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-gray-500 mb-2">Select a reference clip to match its look.</p>
                <div className="h-12 bg-gray-100 dark:bg-black/30 rounded border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs text-gray-400 cursor-pointer hover:border-indigo-500 transition">
                  Select Reference Clip
                </div>
                <button className="w-full py-1.5 bg-gray-800 text-white rounded text-xs hover:bg-black transition">Match Color</button>
              </div>
            )}

            {/* 7. MOTION TRACKING */}
            <SectionHeader title="Motion Tracking" expanded={sections.aiTracking} onToggle={() => toggleSection('aiTracking')} icon={<ScanFace size={14} />} />
            {sections.aiTracking && (
              <div className="p-4 space-y-3">
                <button className="w-full py-2 border border-indigo-500 text-indigo-500 rounded text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition">
                  + Add Tracking Point
                </button>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked /> Position</label>
                  <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" /> Scale</label>
                  <label className="flex items-center gap-1 text-[10px]"><input type="checkbox" /> Rotation</label>
                </div>
              </div>
            )}

            {/* 8. UPSCALING */}
            <SectionHeader title="Upscaling" expanded={sections.upscaling} onToggle={() => toggleSection('upscaling')} icon={<Maximize size={14} />} />
            {sections.upscaling && (
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Current: 1080p</span>
                  <span>Target: 4K</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 border border-gray-200 dark:border-gray-700 rounded text-xs hover:border-indigo-500">2x</button>
                  <button className="flex-1 py-1.5 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold">4x</button>
                </div>
                <button className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition">Upscale Video</button>
              </div>
            )}

            {/* 9. SCENE DETECTION */}
            <SectionHeader title="Scene Detection" expanded={sections.sceneDetect} onToggle={() => toggleSection('sceneDetect')} icon={<Clapperboard size={14} />} />
            {sections.sceneDetect && (
              <div className="p-4 space-y-3">
                <button
                  className="w-full py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition"
                  onClick={() => simulateAIProcess('scene', 3000)}
                >
                  {processingState['scene']?.processing ? 'Detecting...' : 'Analyze Scenes'}
                </button>
                {processingState['scene']?.processing && <div className="h-1 bg-indigo-500 rounded animate-pulse w-2/3"></div>}
                <ControlRow label="Sensitivity" value={50} min={0} max={100} onChange={() => { }} />
              </div>
            )}

            {/* 10. SMART BLUR */}
            <SectionHeader title="Smart Blur" expanded={sections.smartBlur} onToggle={() => toggleSection('smartBlur')} icon={<EyeOff size={14} />} />
            {sections.smartBlur && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 border border-gray-200 dark:border-gray-700 rounded text-xs hover:bg-gray-50 dark:hover:bg-white/5">Blur Faces</button>
                  <button className="py-2 border border-gray-200 dark:border-gray-700 rounded text-xs hover:bg-gray-50 dark:hover:bg-white/5">Blur Objects</button>
                </div>
                <ControlRow label="Blur Strength" value={20} min={0} max={50} onChange={() => { }} />
              </div>
            )}

            {/* 11. OBJECT REMOVAL (Extra) */}
            <SectionHeader title="Object Removal" expanded={sections.objRemoval} onToggle={() => toggleSection('objRemoval')} icon={<Eraser size={14} />} />
            {sections.objRemoval && (
              <div className="p-4 space-y-3 text-center">
                <p className="text-[10px] text-gray-500">Paint over object to remove</p>
                <ControlRow label="Brush Size" value={20} min={5} max={100} onChange={() => { }} />
                <button className="w-full py-2 bg-gray-800 text-white rounded text-xs hover:bg-black transition">Erase Object</button>
              </div>
            )}

            {/* 12. STABILIZATION (AI) */}
            <SectionHeader title="AI Stabilization" expanded={sections.aiStabilize} onToggle={() => toggleSection('aiStabilize')} icon={<Activity size={14} />} />
            {sections.aiStabilize && (
              <div className="p-4 space-y-3">
                <button className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition">
                  Apply AI Stabilization
                </button>
                <ControlRow label="Smoothness" value={50} min={0} max={100} onChange={() => { }} />
              </div>
            )}

            {/* P1.6 CHROMA KEY */}
            {(selectedClip.type === TrackType.VIDEO) && (
              <>
                <SectionHeader title="Chroma Key" expanded={sections.keying} onToggle={() => toggleSection('keying')} icon={<EyeDropper size={14} />} />
                {sections.keying && (
                  <ChromaKeyPanel clip={selectedClip} onUpdateClip={onUpdateClip} />
                )}
              </>
            )}

            {/* P1.8 MASKS */}
            <SectionHeader title="Masks" expanded={sections.masking} onToggle={() => toggleSection('masking')} icon={<Aperture size={14} />} />
            {sections.masking && (
              <MaskPanel clip={selectedClip} onUpdateClip={onUpdateClip} />
            )}

            {/* P1.7 STICKERS */}
            <SectionHeader title="Stickers & Overlays" expanded={sections.stylize} onToggle={() => toggleSection('stylize')} icon={<Smile size={14} />} />
            {sections.stylize && (
              <StickerOverlay clip={selectedClip} onUpdateClip={onUpdateClip} />
            )}

            {/* P1.10 MOTION TRACKING */}
            <SectionHeader title="Motion Tracking" expanded={sections.aiTracking} onToggle={() => toggleSection('aiTracking')} icon={<ScanFace size={14} />} />
            {sections.aiTracking && (
              <MotionTracker clip={selectedClip} onUpdateClip={onUpdateClip} />
            )}

          </div>
        )}

        {/* --- TAB 4: PROPERTIES (Info) --- */}
        {activeTab === 'properties' && (
          <div className="animate-in fade-in duration-200">

            {/* CLIP INFO */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">Clip Info</h4>

              <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 bg-gray-200 dark:bg-black/30 rounded-lg flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-700">
                  {selectedClip.type === TrackType.VIDEO && <video src={selectedClip.src} className="w-full h-full object-cover" />}
                  {selectedClip.type === TrackType.IMAGE && <img src={selectedClip.src} className="w-full h-full object-cover" />}
                  {selectedClip.type === TrackType.AUDIO && <Volume2 className="text-gray-400" />}
                  {selectedClip.type === TrackType.TEXT && <FileText className="text-gray-400" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block">Name</label>
                    <input
                      type="text"
                      value={selectedClip.name}
                      onChange={(e) => onUpdateClip({ name: e.target.value })}
                      className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 text-xs py-1 focus:border-indigo-500 outline-none transition"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>1920x1080</span>
                    <span>30fps</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>{new Date(selectedClip.duration * 1000).toISOString().substr(14, 5)}</span>
                    <span>MP4</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-gray-50 dark:bg-[#1f1f1f] p-2 rounded">
                  <span className="text-gray-500 block">Start</span>
                  <span className="font-mono">{new Date(selectedClip.startTime * 1000).toISOString().substr(14, 8)}</span>
                </div>
                <div className="bg-gray-50 dark:bg-[#1f1f1f] p-2 rounded">
                  <span className="text-gray-500 block">End</span>
                  <span className="font-mono">{new Date((selectedClip.startTime + selectedClip.duration) * 1000).toISOString().substr(14, 8)}</span>
                </div>
              </div>
            </div>

            {/* METADATA */}
            <SectionHeader
              title="Metadata"
              expanded={sections.metadata}
              onToggle={() => toggleSection('metadata')}
              icon={<Hash size={14} />}
            />
            {sections.metadata && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-[#1f1f1f] rounded min-h-[40px] border border-gray-200 dark:border-gray-800">
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded flex items-center gap-1">
                      vlog <button className="hover:text-indigo-900">&times;</button>
                    </span>
                    <button className="text-[10px] text-gray-400 hover:text-indigo-500 flex items-center gap-1">
                      <Tag size={10} /> Add Tag
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Notes</label>
                  <textarea
                    className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-2 text-xs h-20 resize-none focus:border-indigo-500 outline-none"
                    placeholder="Add notes about this clip..."
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="text-gray-300 hover:text-yellow-400 cursor-pointer transition" />)}
                  </div>
                </div>
              </div>
            )}

            {/* TRANSITIONS */}
            <SectionHeader
              title="Transitions"
              expanded={sections.transitions}
              onToggle={() => toggleSection('transitions')}
              icon={<Layers size={14} />}
            />
            {sections.transitions && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">In Animation</label>
                  <select
                    value={selectedClip.transitionIn?.type || ''}
                    onChange={(e) => onUpdateClip({ transitionIn: { type: e.target.value as any, duration: 0.5 } })}
                    className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-2 text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="">None</option>
                    <option value="fade">Fade</option>
                    <option value="zoom">Zoom</option>
                    <option value="wipe">Wipe</option>
                    <option value="slide-left">Slide Left</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">Out Animation</label>
                  <select
                    value={selectedClip.transitionOut?.type || ''}
                    onChange={(e) => onUpdateClip({ transitionOut: { type: e.target.value as any, duration: 0.5 } })}
                    className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-2 text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="">None</option>
                    <option value="fade">Fade</option>
                    <option value="zoom">Zoom</option>
                    <option value="wipe">Wipe</option>
                    <option value="slide-right">Slide Right</option>
                  </select>
                </div>
              </div>
            )}

          </div>
        )}

        {/* --- TAB: PLATFORM --- */}
        {activeTab === 'platform' && (
          <div className="animate-in fade-in duration-200 space-y-6">
            <AccountModal isOpen={false} onClose={() => {}} />
            <VersionHistoryPanel project={project} selectedClip={selectedClip} onRestoreVersion={(v) => { alert(`Restored: ${v.label}`); }} onAddComment={(clipId, comment) => {}} />
            <BatchExportPanel project={project} onExport={async () => new Blob([])} />
            <PluginPanel />
            <ProxyMediaPanel project={project} onUpdateProject={(updates) => {}} />
            <AccessibilityPanel />
          </div>
        )}

      </div>

      {/* --- EFFECTS STACK MANAGER (Bottom Fixed) --- */}
      {selectedClip.advancedEffects && selectedClip.advancedEffects.length > 0 && (
        <div className="absolute bottom-0 w-full bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-800 max-h-[150px] overflow-y-auto z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="p-2 text-[10px] font-bold text-gray-500 uppercase bg-gray-50 dark:bg-[#1f1f1f] sticky top-0 flex justify-between items-center">
            <span>Applied Effects</span>
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 rounded">{selectedClip.advancedEffects.length}</span>
          </div>
          <div className="p-2 space-y-1">
            {selectedClip.advancedEffects.map((effect) => (
              <div key={effect.id} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-gray-700 group">
                <div className="flex items-center gap-2">
                  <button
                    className={`p-1 rounded ${effect.isActive ? 'text-indigo-600' : 'text-gray-400'}`}
                    onClick={() => onUpdateClip({ advancedEffects: selectedClip.advancedEffects?.map(e => e.id === effect.id ? { ...e, isActive: !e.isActive } : e) })}
                  >
                    {effect.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{effect.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => addAdvancedEffect(effect.type, effect.name + ' Copy')} className="p-1 text-gray-500 hover:text-indigo-500"><Copy size={10} /></button>
                  <button onClick={() => removeAdvancedEffect(effect.id)} className="p-1 text-gray-500 hover:text-red-500"><Trash2 size={10} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Clip, TrackType, Transition } from '../types';
import { Wand2, Sliders, Type as TypeIcon, Scissors, Languages, Sparkles, Volume2, Mic, Film, ChevronDown, ChevronUp, RotateCw, Mic2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface PropertiesPanelProps {
  selectedClip: Clip | null;
  onUpdateClip: (updates: Partial<Clip>) => void;
  onAutoEdit: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedClip, onUpdateClip, onAutoEdit }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'ai'>('basic');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState("Hello, this is my cloned voice.");
  
  // Collapse states for sections
  const [sections, setSections] = useState({
      transform: true,
      audio: true,
      transitions: true,
      text: true
  });

  const toggleSection = (key: keyof typeof sections) => {
      setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateSubtitles = async () => {
    setIsAnalyzing(true);
    const simulatedTranscript = "Welcome to Lumina AI. This demonstrates our powerful text-to-speech and subtitle generation capabilities running directly in your browser.";
    const result = await geminiService.generateSubtitles(simulatedTranscript);
    setAiResult(result);
    setIsAnalyzing(false);
    setActiveTab('ai');
  };

  const handleSmartCut = async () => {
    setIsAnalyzing(true);
    await onAutoEdit();
    setIsAnalyzing(false);
  };

  const handleVoiceClone = () => {
      setIsAnalyzing(true);
      setTimeout(() => {
          setIsAnalyzing(false);
          setAiResult(`Generated Audio: "${voiceText}" (Voice cloned successfully)`);
      }, 1500);
  };

  if (!selectedClip) {
    return (
      <div className="w-80 bg-[#1a1a1a] border-l border-gray-800 flex flex-col h-full">
         <div className="p-4 border-b border-gray-800">
             <h2 className="text-sm font-bold text-white">Properties</h2>
         </div>
         <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-50">
            <Sliders size={32} className="mb-3 text-gray-500" />
            <p className="text-xs text-gray-400">Select a clip to view properties</p>
         </div>
         <div className="p-4 border-t border-gray-800">
             <button 
                onClick={handleSmartCut}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-indigo-900/20"
            >
                {isAnalyzing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Sparkles size={16} />}
                Auto-Edit Project
            </button>
         </div>
      </div>
    );
  }

  const transitionTypes: Transition['type'][] = ['fade', 'wipe', 'zoom', 'slide-left', 'slide-right', 'dissolve', 'iris'];

  return (
    <div className="w-80 bg-[#1a1a1a] border-l border-gray-800 flex flex-col h-full">
      <div className="flex border-b border-gray-800">
        <button 
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 text-xs font-medium ${activeTab === 'basic' ? 'text-white border-b-2 border-indigo-500 bg-[#222]' : 'text-gray-500 hover:text-gray-300'}`}
        >
            Controls
        </button>
        <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1 ${activeTab === 'ai' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-[#222]' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <Wand2 size={12} /> AI Magic
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700 space-y-4">
        {activeTab === 'basic' && (
            <>
                {/* Transform Controls */}
                {(selectedClip.type === TrackType.VIDEO || selectedClip.type === TrackType.TEXT) && (
                    <div className="bg-[#121212] rounded border border-gray-800 overflow-hidden">
                        <button onClick={() => toggleSection('transform')} className="w-full flex items-center justify-between p-3 bg-[#1a1a1a] hover:bg-[#222] transition">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Sliders size={12} /> Transform</h3>
                            {sections.transform ? <ChevronUp size={12} className="text-gray-500"/> : <ChevronDown size={12} className="text-gray-500"/>}
                        </button>
                        
                        {sections.transform && <div className="p-3 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Scale</span>
                                        <span>{Math.round((selectedClip.properties?.scale || 1) * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0.1" max="2" step="0.1"
                                        value={selectedClip.properties?.scale || 1}
                                        onChange={(e) => onUpdateClip({ properties: { ...selectedClip.properties, scale: parseFloat(e.target.value) } })}
                                        className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Opacity</span>
                                        <span>{Math.round((selectedClip.properties?.opacity ?? 1) * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" min="0" max="1" step="0.1"
                                        value={selectedClip.properties?.opacity ?? 1}
                                        onChange={(e) => onUpdateClip({ properties: { ...selectedClip.properties, opacity: parseFloat(e.target.value) } })}
                                        className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Position X</span>
                                    </div>
                                    <input 
                                        type="range" min="-300" max="300" step="10"
                                        value={selectedClip.properties?.x || 0}
                                        onChange={(e) => onUpdateClip({ properties: { ...selectedClip.properties, x: parseFloat(e.target.value) } })}
                                        className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Rotation</span>
                                        <span>{selectedClip.properties?.rotation || 0}°</span>
                                    </div>
                                    <input 
                                        type="range" min="-180" max="180" step="15"
                                        value={selectedClip.properties?.rotation || 0}
                                        onChange={(e) => onUpdateClip({ properties: { ...selectedClip.properties, rotation: parseInt(e.target.value) } })}
                                        className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                                    />
                                </div>
                            </div>
                        </div>}
                    </div>
                )}

                {/* Audio Controls */}
                {(selectedClip.type === TrackType.VIDEO || selectedClip.type === TrackType.AUDIO) && (
                    <div className="bg-[#121212] rounded border border-gray-800 overflow-hidden">
                        <button onClick={() => toggleSection('audio')} className="w-full flex items-center justify-between p-3 bg-[#1a1a1a] hover:bg-[#222] transition">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Volume2 size={12} /> Audio</h3>
                            {sections.audio ? <ChevronUp size={12} className="text-gray-500"/> : <ChevronDown size={12} className="text-gray-500"/>}
                        </button>
                        
                        {sections.audio && <div className="p-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Volume</span>
                                <span>{Math.round((selectedClip.properties?.volume ?? 1) * 100)}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="2" step="0.1"
                                value={selectedClip.properties?.volume ?? 1}
                                onChange={(e) => onUpdateClip({ properties: { ...selectedClip.properties, volume: parseFloat(e.target.value) } })}
                                className="w-full accent-indigo-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                            />
                        </div>}
                    </div>
                )}

                {/* Transition Controls */}
                <div className="bg-[#121212] rounded border border-gray-800 overflow-hidden">
                    <button onClick={() => toggleSection('transitions')} className="w-full flex items-center justify-between p-3 bg-[#1a1a1a] hover:bg-[#222] transition">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><Film size={12} /> Transitions</h3>
                        {sections.transitions ? <ChevronUp size={12} className="text-gray-500"/> : <ChevronDown size={12} className="text-gray-500"/>}
                    </button>
                    
                    {sections.transitions && <div className="p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[10px] text-gray-500 block mb-1">In Animation</label>
                                <select 
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-1 text-xs text-white"
                                    value={selectedClip.transitionIn?.type || ''}
                                    onChange={(e) => onUpdateClip({ transitionIn: { type: e.target.value as any, duration: 0.5 } })}
                                >
                                    <option value="">None</option>
                                    {transitionTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Out Animation</label>
                                <select 
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-1 text-xs text-white"
                                    value={selectedClip.transitionOut?.type || ''}
                                    onChange={(e) => onUpdateClip({ transitionOut: { type: e.target.value as any, duration: 0.5 } })}
                                >
                                    <option value="">None</option>
                                    {transitionTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                </select>
                             </div>
                        </div>
                    </div>}
                </div>

                {/* Text Controls */}
                {selectedClip.type === TrackType.TEXT && (
                    <div className="bg-[#121212] p-3 rounded border border-gray-800">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1"><TypeIcon size={10} /> Text</h3>
                        <textarea 
                            value={selectedClip.properties?.text || ''}
                            onChange={(e) => onUpdateClip({ properties: { ...selectedClip.properties, text: e.target.value } })}
                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-indigo-500 mb-3"
                            rows={3}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Size</label>
                                <input 
                                    type="number" 
                                    value={selectedClip.properties?.fontSize || 40}
                                    onChange={(e) => onUpdateClip({ properties: { ...selectedClip.properties, fontSize: parseInt(e.target.value) } })}
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-1 text-xs text-white" 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 block mb-1">Font</label>
                                <select className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-1 text-xs text-white">
                                    <option>Inter</option>
                                    <option>Roboto</option>
                                    <option>Impact</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )}

        {activeTab === 'ai' && (
             <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-indigo-300 mb-1">
                        <Wand2 size={16} />
                        <span className="text-sm font-bold">Generative Actions</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-4">Powered by Google Gemini 2.5</p>
                    
                    <div className="space-y-2">
                        {selectedClip.type === TrackType.VIDEO && (
                            <button className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 text-xs py-2 px-3 rounded border border-gray-700 flex items-center justify-between transition group">
                                <span className="flex items-center gap-2"><Scissors size={14} className="text-indigo-400" /> Remove Silence</span>
                                <span className="text-[10px] bg-indigo-900/50 text-indigo-300 px-1 rounded opacity-0 group-hover:opacity-100 transition">PRO</span>
                            </button>
                        )}
                        
                        {(selectedClip.type === TrackType.VIDEO || selectedClip.type === TrackType.AUDIO) && (
                            <button 
                                onClick={handleGenerateSubtitles}
                                disabled={isAnalyzing}
                                className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 text-xs py-2 px-3 rounded border border-gray-700 flex items-center justify-between transition"
                            >
                                <span className="flex items-center gap-2">
                                    {isAnalyzing ? <div className="animate-spin h-3 w-3 border-b-2 border-indigo-400 rounded-full"></div> : <Languages size={14} className="text-pink-400" />} 
                                    Generate Subtitles
                                </span>
                            </button>
                        )}

                        <button className="w-full bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 text-xs py-2 px-3 rounded border border-gray-700 flex items-center justify-between transition group">
                                <span className="flex items-center gap-2"><Mic size={14} className="text-emerald-400" /> Enhance Audio</span>
                        </button>
                    </div>
                </div>

                {/* AI Voice Cloning Section */}
                <div className="bg-[#121212] border border-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-300 mb-2">
                        <Mic2 size={14} className="text-orange-400"/>
                        <span className="text-xs font-bold">Voice Cloning</span>
                    </div>
                    <div className="space-y-2">
                         <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded text-[10px]">
                            <span className="text-gray-400">Model:</span>
                            <span className="text-indigo-400 font-medium">Selected Clip Audio</span>
                         </div>
                         <textarea 
                            value={voiceText}
                            onChange={(e) => setVoiceText(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                            rows={3}
                            placeholder="Type text to speak..."
                         />
                         <button 
                            onClick={handleVoiceClone}
                            disabled={isAnalyzing}
                            className="w-full bg-orange-900/20 text-orange-400 border border-orange-900/50 hover:bg-orange-900/40 text-xs py-2 rounded transition flex items-center justify-center gap-2"
                         >
                            {isAnalyzing ? <div className="animate-spin h-3 w-3 border-b-2 border-orange-400 rounded-full"></div> : <Sparkles size={12} />}
                            Generate Speech
                         </button>
                    </div>
                </div>

                {aiResult && (
                    <div className="bg-[#121212] p-3 rounded border border-gray-800 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] font-bold text-gray-500 uppercase">AI Output</span>
                             <button onClick={() => setAiResult(null)} className="text-[10px] text-gray-500 hover:text-white">Clear</button>
                        </div>
                        <div className="text-xs text-gray-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {aiResult}
                        </div>
                    </div>
                )}
             </div>
        )}
      </div>
    </div>
  );
};
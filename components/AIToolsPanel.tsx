import React, { useState, useCallback } from 'react';
import { Project } from '../types';
import { geminiService } from '../services/geminiService';
import { elevenLabsService } from '../services/elevenLabsService';
import { Mic, Play, FileText, Scissors, Wand2, Loader2 } from 'lucide-react';

interface AIToolsPanelProps {
  project: Project;
  selectedClipId: string | undefined;
  onAddClip: (type: 'video' | 'audio' | 'text' | 'image', src?: string, duration?: number) => void;
  onUpdateClip: (updates: any) => void;
}

export const AIToolsPanel: React.FC<AIToolsPanelProps> = ({
  project, selectedClipId, onAddClip, onUpdateClip,
}) => {
  const [ttsText, setTtsText] = useState('Welcome to Lumina AI Video Editor.');
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM');
  const [generatingTTS, setGeneratingTTS] = useState(false);
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [generatingScript, setGeneratingScript] = useState(false);
  const [analyzingShorts, setAnalyzingShorts] = useState(false);

  const handleTTS = async () => {
    if (!ttsText) return;
    setGeneratingTTS(true);
    const audioUrl = await elevenLabsService.textToSpeech(ttsText, selectedVoice);
    if (audioUrl) {
      onAddClip('audio', audioUrl, ttsText.split(' ').length * 0.4);
    } else {
      alert('Failed to generate speech. Check API key or try again.');
    }
    setGeneratingTTS(false);
  };

  const handleScriptToVideo = async () => {
    if (!scriptPrompt) return;
    setGeneratingScript(true);
    try {
      const script = await geminiService.generateSubtitles(scriptPrompt);
      const lines = script.split('\n').filter(l => l.trim()).slice(0, 6);
      lines.forEach((line, i) => {
        setTimeout(() => {
          onAddClip('text', undefined, 3);
        }, i * 100);
      });
      alert(`Script generated! Added ${lines.length} text clips.`);
    } catch {
      alert('Failed to generate script. Check API key.');
    }
    setGeneratingScript(false);
  };

  const handleLongToShorts = async () => {
    setAnalyzingShorts(true);
    try {
      const result = await geminiService.analyzeVideoContent(project.name, project.duration);
      if (result.segments.length > 0) {
        alert(`Found ${result.segments.length} short-form segments!\nTop: ${result.segments[0].reason} (score: ${result.segments[0].score})`);
        result.segments.forEach(seg => {
          onAddClip('video', undefined, seg.end - seg.start);
        });
      } else {
        alert('No engaging segments found. Try a different video.');
      }
    } catch {
      alert('Analysis failed. Check API key.');
    }
    setAnalyzingShorts(false);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Text to Speech */}
      <div className="bg-gray-50 dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
          <Mic size={16} />
          <h3 className="text-xs font-bold uppercase tracking-wider">Text to Speech</h3>
        </div>
        <textarea
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded p-2 text-xs h-20 resize-none"
          placeholder="Enter script for voiceover..."
        />
        <div className="flex gap-2">
          <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="flex-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded p-1.5 text-xs">
            {elevenLabsService.getVoices().map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button onClick={handleTTS} disabled={generatingTTS} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition">
            {generatingTTS ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          </button>
        </div>
      </div>

      {/* Script to Video */}
      <div className="bg-gray-50 dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
          <FileText size={16} />
          <h3 className="text-xs font-bold uppercase tracking-wider">AI Script Generator</h3>
        </div>
        <input
          type="text"
          value={scriptPrompt}
          onChange={(e) => setScriptPrompt(e.target.value)}
          className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded p-2 text-xs"
          placeholder="Describe your video topic..."
        />
        <button onClick={handleScriptToVideo} disabled={generatingScript} className="w-full py-2 bg-purple-600 text-white rounded text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
          {generatingScript ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Wand2 size={14} /> Generate Script & Clips</>}
        </button>
      </div>

      {/* Long Video → Shorts */}
      <div className="bg-gray-50 dark:bg-[#121212] rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Scissors size={16} />
          <h3 className="text-xs font-bold uppercase tracking-wider">Long Video → Shorts</h3>
        </div>
        <p className="text-[10px] text-gray-500">AI scans the timeline and finds highlight-worthy segments for short-form content.</p>
        <button onClick={handleLongToShorts} disabled={analyzingShorts} className="w-full py-2 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
          {analyzingShorts ? <><Loader2 size={14} className="animate-spin" /> Analyzing...</> : <><Play size={14} /> Find Highlights</>}
        </button>
      </div>
    </div>
  );
};

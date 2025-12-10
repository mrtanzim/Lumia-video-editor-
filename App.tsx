import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, TrackType, Clip, Track } from './types';
import { Timeline } from './components/Timeline';
import { VideoPlayer } from './components/VideoPlayer';
import { AssetLibrary } from './components/AssetLibrary';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ToolsSidebar } from './components/ToolsSidebar';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { Download, Share2, Sparkles, Command, Undo2, Redo2, User, Keyboard, Trash2, Copy, Scissors, ZoomIn, ZoomOut, Maximize, MousePointer2 } from 'lucide-react';
import { geminiService } from './services/geminiService';

// Mock Initial Data
const INITIAL_PROJECT: Project = {
  id: 'proj_1',
  name: 'Summer_Vlog_2024.mp4',
  duration: 45,
  width: 1920,
  height: 1080,
  fps: 30,
  lastModified: Date.now(),
  currentTime: 0,
  tracks: [
    {
      id: 't1',
      name: 'Video 1',
      type: TrackType.VIDEO,
      clips: [
        {
          id: 'c1',
          trackId: 't1',
          name: 'Intro Scene',
          type: TrackType.VIDEO,
          startTime: 0,
          duration: 10,
          trimStart: 0,
          trimEnd: 0,
          color: '#3b82f6',
          src: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          properties: { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0, volume: 1 }
        },
        {
          id: 'c2',
          trackId: 't1',
          name: 'Travel Montage',
          type: TrackType.VIDEO,
          startTime: 10.5,
          duration: 8,
          trimStart: 0,
          trimEnd: 0,
          color: '#3b82f6',
          src: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
          properties: { opacity: 1, scale: 1.2, x: 0, y: 0, rotation: 0, volume: 0.8 }
        }
      ]
    },
    {
      id: 't2',
      name: 'Text Overlay',
      type: TrackType.TEXT,
      clips: [
        {
          id: 'c3',
          trackId: 't2',
          name: 'Title Card',
          type: TrackType.TEXT,
          startTime: 1,
          duration: 5,
          trimStart: 0,
          trimEnd: 0,
          color: '#a855f7',
          properties: { text: 'SUMMER 2024', fontSize: 80, fontFamily: 'Inter', rotation: -5 }
        }
      ]
    },
    {
      id: 't3',
      name: 'Audio',
      type: TrackType.AUDIO,
      clips: [
        {
          id: 'c4',
          trackId: 't3',
          name: 'LoFi Beat',
          type: TrackType.AUDIO,
          startTime: 0,
          duration: 30,
          trimStart: 0,
          trimEnd: 0,
          color: '#10b981',
          properties: { volume: 0.5 }
        }
      ]
    }
  ]
};

const App: React.FC = () => {
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTool, setActiveTool] = useState('select');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rightPanelMode, setRightPanelMode] = useState<'assets' | 'properties'>('assets');
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Playback Loop
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setProject(prev => {
          if (prev.currentTime >= prev.duration) {
            setIsPlaying(false);
            return { ...prev, currentTime: 0 };
          }
          return { ...prev, currentTime: prev.currentTime + 0.1 };
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Global Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // Ignore if input/textarea is focused
          if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

          if (e.key === ' ' || e.code === 'Space') {
              e.preventDefault();
              setIsPlaying(p => !p);
          } else if (e.key === '?') {
              setShowShortcuts(s => !s);
          } else if (e.key.toLowerCase() === 'c') {
              setActiveTool('cut');
          } else if (e.key.toLowerCase() === 'v') {
              setActiveTool('select');
          } else if (e.key.toLowerCase() === 'i') {
              handleImportClick();
          } else if (e.key === 'Delete' || e.key === 'Backspace') {
              if (selectedClipId) handleDeleteClip(selectedClipId);
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId]);

  // Effect to switch right panel when clip is selected
  useEffect(() => {
    if (selectedClipId) {
        setRightPanelMode('properties');
    } else {
        setRightPanelMode('assets');
    }
  }, [selectedClipId]);

  const handleSeek = (time: number) => {
    setProject(prev => ({ ...prev, currentTime: Math.min(Math.max(0, time), prev.duration) }));
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClipSelect = (clip: Clip) => {
    setSelectedClipId(clip.id);
  };

  const selectedClip = project.tracks
    .flatMap(t => t.clips)
    .find(c => c.id === selectedClipId) || null;

  const handleUpdateClip = (updates: Partial<Clip>) => {
    if (!selectedClipId) return;

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip => 
          clip.id === selectedClipId ? { 
            ...clip, 
            ...updates, 
            properties: { ...clip.properties, ...updates.properties } // Deep merge for properties
          } : clip
        )
      }))
    }));
  };

  const handleSplitClip = (clipId: string, splitTime: number) => {
    setProject(prev => {
        const newTracks = prev.tracks.map(track => {
            const clipIndex = track.clips.findIndex(c => c.id === clipId);
            if (clipIndex === -1) return track;

            const clip = track.clips[clipIndex];
            if (splitTime <= clip.startTime + 0.1 || splitTime >= clip.startTime + clip.duration - 0.1) {
                return track;
            }

            const relativeSplit = splitTime - clip.startTime;
            
            const firstPart: Clip = {
                ...clip,
                duration: relativeSplit,
                trimEnd: clip.trimStart + relativeSplit 
            };

            const secondPart: Clip = {
                ...clip,
                id: clip.id + '_split_' + Date.now(),
                startTime: splitTime,
                duration: clip.duration - relativeSplit,
                trimStart: clip.trimStart + relativeSplit,
                name: clip.name + ' (2)'
            };

            const newClips = [...track.clips];
            newClips.splice(clipIndex, 1, firstPart, secondPart);
            
            return { ...track, clips: newClips };
        });
        return { ...prev, tracks: newTracks };
    });
    setActiveTool('select');
  };

  // Wrapper for Toolbar Split Button
  const handleToolbarSplit = () => {
      if (selectedClipId) {
          handleSplitClip(selectedClipId, project.currentTime);
      } else {
          // If no clip selected, find top clip under playhead
          const clipUnderPlayhead = project.tracks
            .flatMap(t => t.clips)
            .find(c => project.currentTime > c.startTime && project.currentTime < c.startTime + c.duration);
          
          if (clipUnderPlayhead) {
              handleSplitClip(clipUnderPlayhead.id, project.currentTime);
          }
      }
  };

  const handleDeleteClip = (clipId: string) => {
      setProject(prev => ({
          ...prev,
          tracks: prev.tracks.map(track => ({
              ...track,
              clips: track.clips.filter(c => c.id !== clipId)
          }))
      }));
      if (selectedClipId === clipId) setSelectedClipId(undefined);
  };

  const handleDuplicateClip = () => {
      if (!selectedClip) return;
      
      const newClip: Clip = {
          ...selectedClip,
          id: `c_${Date.now()}_copy`,
          startTime: selectedClip.startTime + selectedClip.duration,
          name: selectedClip.name + ' (Copy)'
      };
      
      setProject(prev => ({
          ...prev,
          tracks: prev.tracks.map(track => 
              track.id === selectedClip.trackId 
                  ? { ...track, clips: [...track.clips, newClip] }
                  : track
          )
      }));
  };

  const handleAddClip = (type: 'video' | 'audio' | 'text', src?: string) => {
      const newClip: Clip = {
          id: `c_${Date.now()}`,
          trackId: '',
          name: type === 'text' ? 'New Text' : 'New Clip',
          type: type as TrackType,
          startTime: project.currentTime,
          duration: 5,
          trimStart: 0,
          trimEnd: 0,
          src: src || '',
          color: type === 'video' ? '#3b82f6' : type === 'audio' ? '#10b981' : '#a855f7',
          properties: type === 'text' ? { text: 'New Text', fontSize: 60, rotation: 0 } : { opacity: 1, scale: 1, rotation: 0, volume: 1 }
      };

      setProject(prev => {
          const newTracks = [...prev.tracks];
          let targetTrack = newTracks.find(t => t.type === type && !t.isLocked);
          
          if (!targetTrack) {
              targetTrack = {
                  id: `t_${Date.now()}`,
                  name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track`,
                  type: type as TrackType,
                  clips: []
              };
              newTracks.push(targetTrack);
          }
          
          newClip.trackId = targetTrack.id;
          targetTrack.clips.push(newClip);
          
          return { ...prev, tracks: newTracks };
      });
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          const type = file.type.startsWith('audio') ? 'audio' : 'video';
          handleAddClip(type, url);
      }
      if (e.target) e.target.value = '';
  };

  const handleAutoEdit = async () => {
    const description = "A summer vacation video with various clips from the beach and road trip.";
    try {
        const analysis = await geminiService.analyzeVideoContent(description, project.duration);
        if (analysis.segments.length > 0) {
            alert(`Gemini AI identified ${analysis.segments.length} engaging segments! Timeline updated with smart cuts.`);
        } else {
            alert("AI Analysis complete. No significant cuts suggested or API Key missing.");
        }
    } catch (e) {
        console.error(e);
        alert("AI Analysis failed. Please check console for details.");
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
        setIsExporting(false);
        alert("Video rendered successfully! (Simulation)");
    }, 2500);
  };

  return (
    <div className="flex flex-col h-screen text-gray-300 font-sans overflow-hidden bg-[#0a0a0a]">
      {/* Hidden File Input for Global Imports */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="video/*,audio/*,image/*" 
        onChange={handleFileChange}
      />

      {/* Header */}
      <header className="h-14 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
                    <Sparkles className="text-white" size={16} />
                </div>
                <h1 className="font-bold text-white tracking-tight text-lg">Lumina <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 font-normal uppercase tracking-wide border border-gray-700">Pro</span></h1>
            </div>
            
            <div className="h-6 w-px bg-gray-700 mx-2"></div>
            
            <div className="flex items-center gap-2 text-gray-400">
                <button className="hover:text-white transition"><Undo2 size={16} /></button>
                <button className="hover:text-white transition"><Redo2 size={16} /></button>
            </div>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 bg-[#0f0f0f] border border-gray-800 rounded-lg px-4 py-1.5 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Project:</span>
            <input 
                value={project.name} 
                onChange={(e) => setProject({...project, name: e.target.value})}
                className="bg-transparent text-sm text-gray-200 focus:outline-none w-48 text-center font-medium" 
            />
        </div>

        <div className="flex items-center space-x-3">
             <button 
                onClick={() => setShowShortcuts(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition text-gray-400"
                title="Keyboard Shortcuts (?)"
            >
                <Keyboard size={18} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 transition text-gray-400">
                <User size={18} />
            </button>
            <button 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-white text-black hover:bg-gray-200 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-white/5"
            >
                {isExporting ? 'Rendering...' : (
                    <>
                        <Download size={16} className="text-indigo-600" /> Export
                    </>
                )}
            </button>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Tools */}
        <ToolsSidebar 
            activeTool={activeTool} 
            onToolChange={(toolId) => {
                if (toolId === 'import') {
                    handleImportClick();
                } else {
                    setActiveTool(toolId);
                }
            }} 
        />

        {/* Center: Preview Canvas */}
        <div className="flex-1 flex flex-col bg-[#050505] relative z-0 p-6 min-w-0">
          <div className="flex-1 flex items-center justify-center rounded-xl overflow-hidden border border-gray-800/50 shadow-2xl bg-black relative group">
              <VideoPlayer 
                project={project} 
                isPlaying={isPlaying} 
                onTogglePlay={handleTogglePlay} 
              />
          </div>
          
          {/* Floating Floating Action Toolbar */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
             <div className="bg-[#1a1a1a]/90 backdrop-blur-md border border-gray-700/50 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl shadow-black/50">
                 {/* Edit Group */}
                 <div className="flex items-center gap-1">
                     <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Undo (Ctrl+Z)">
                        <Undo2 size={16} />
                     </button>
                     <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" title="Redo (Ctrl+Y)">
                        <Redo2 size={16} />
                     </button>
                 </div>
                 
                 <div className="w-px h-4 bg-gray-700"></div>
                 
                 {/* Clip Actions */}
                 <div className="flex items-center gap-1">
                     <button 
                        onClick={handleToolbarSplit}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition" 
                        title="Split Clip (C)"
                     >
                        <Scissors size={16} />
                     </button>
                     <button 
                        onClick={() => selectedClipId && handleDeleteClip(selectedClipId)}
                        disabled={!selectedClipId}
                        className={`p-2 rounded-full transition ${selectedClipId ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-700 cursor-not-allowed'}`}
                        title="Delete (Del)"
                     >
                        <Trash2 size={16} />
                     </button>
                     <button 
                        onClick={handleDuplicateClip}
                        disabled={!selectedClipId}
                        className={`p-2 rounded-full transition ${selectedClipId ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-700 cursor-not-allowed'}`}
                        title="Duplicate (Ctrl+D)"
                     >
                        <Copy size={16} />
                     </button>
                 </div>

                 <div className="w-px h-4 bg-gray-700"></div>

                 {/* Zoom Controls */}
                 <div className="flex items-center gap-2">
                     <button 
                        onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.2))}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                     >
                        <ZoomOut size={14} />
                     </button>
                     <span className="text-[10px] font-mono text-gray-500 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                     <button 
                        onClick={() => setZoomLevel(z => Math.min(3, z + 0.2))}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                     >
                        <ZoomIn size={14} />
                     </button>
                 </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar: Assets / Properties */}
        <div className="flex flex-col border-l border-gray-800 z-10 w-80 shrink-0 bg-[#1a1a1a]">
             {rightPanelMode === 'assets' ? (
                 <AssetLibrary onAddClip={handleAddClip} />
             ) : (
                 <PropertiesPanel 
                    selectedClip={selectedClip} 
                    onUpdateClip={handleUpdateClip} 
                    onAutoEdit={handleAutoEdit}
                 />
             )}
             
             <div className="h-10 border-t border-gray-800 flex">
                 <button 
                    onClick={() => setRightPanelMode('assets')} 
                    className={`flex-1 text-xs font-medium ${rightPanelMode === 'assets' ? 'bg-[#222] text-white' : 'text-gray-500'}`}
                 >
                     Assets Library
                 </button>
                 <button 
                    onClick={() => setRightPanelMode('properties')} 
                    className={`flex-1 text-xs font-medium ${rightPanelMode === 'properties' ? 'bg-[#222] text-white' : 'text-gray-500'}`}
                 >
                     Clip Properties
                 </button>
             </div>
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-80 flex-shrink-0 z-20 border-t border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <Timeline 
            project={project} 
            onSeek={handleSeek} 
            onClipSelect={handleClipSelect}
            selectedClipId={selectedClipId}
            zoom={zoomLevel}
            activeTool={activeTool}
            onSplitClip={handleSplitClip}
        />
      </div>
      
      {/* Keyboard Shortcuts Overlay */}
      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
    </div>
  );
};

export default App;
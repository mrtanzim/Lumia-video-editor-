import React, { useRef, useState, useEffect } from 'react';
import { Project, Track, Clip, TrackType } from '../types';
import { Film, Music, Type, Eye, EyeOff, Volume2, VolumeX, Lock, Unlock, Scissors } from 'lucide-react';

interface TimelineProps {
  project: Project;
  onSeek: (time: number) => void;
  onClipSelect: (clip: Clip) => void;
  selectedClipId?: string;
  zoom?: number;
  activeTool: string;
  onSplitClip: (clipId: string, splitTime: number) => void;
}

const HEADER_HEIGHT = 32;

export const Timeline: React.FC<TimelineProps> = ({ 
  project, 
  onSeek, 
  onClipSelect, 
  selectedClipId, 
  zoom = 1,
  activeTool,
  onSplitClip
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const PIXELS_PER_SECOND = 20 * zoom;

  // Handle Scrubbing
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scrollLeft = containerRef.current.scrollLeft;
    const newTime = Math.max(0, (x + scrollLeft) / PIXELS_PER_SECOND);
    onSeek(newTime);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Allow dragging from anywhere in the container
    setIsDragging(true);
    const x = e.clientX - rect.left;
    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const newTime = Math.max(0, (x + scrollLeft) / PIXELS_PER_SECOND);
    onSeek(newTime);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const renderRuler = () => {
    const marks = [];
    const totalSeconds = Math.max(project.duration, 60); 
    const step = zoom < 0.5 ? 10 : zoom > 2 ? 1 : 5;
    
    for (let i = 0; i < totalSeconds; i += step) {
      marks.push(
        <div 
          key={i} 
          className="absolute top-0 h-full border-l border-gray-700 text-[10px] text-gray-500 pl-1 select-none flex items-end pb-1"
          style={{ left: i * PIXELS_PER_SECOND }}
        >
          {new Date(i * 1000).toISOString().substr(14, 5)}
        </div>
      );
    }
    return marks;
  };

  const getIcon = (type: TrackType) => {
    switch(type) {
      case TrackType.VIDEO: return <Film size={14} />;
      case TrackType.AUDIO: return <Music size={14} />;
      case TrackType.TEXT: return <Type size={14} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] border-t border-gray-800 select-none">
      {/* Time Display & Toolbar */}
      <div className="h-9 bg-[#1a1a1a] flex items-center px-4 border-b border-gray-800 justify-between shrink-0">
        <div className="flex items-center space-x-4">
           <span className="font-mono text-indigo-400 text-sm font-medium">
            {new Date(project.currentTime * 1000).toISOString().substr(11, 8)} 
            <span className="text-gray-600 mx-1">/</span>
            <span className="text-gray-500">{new Date(project.duration * 1000).toISOString().substr(11, 8)}</span>
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs text-gray-400">
           <span>{project.fps} FPS</span>
           {activeTool === 'cut' && <span className="text-red-400 flex items-center gap-1 bg-red-900/20 px-2 py-0.5 rounded"><Scissors size={10}/> Cutting Mode</span>}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Track Headers */}
        <div className="w-56 bg-[#1a1a1a] border-r border-gray-800 flex-shrink-0 z-10 overflow-y-auto scrollbar-hide pt-[33px]">
          {project.tracks.map((track) => (
            <div 
              key={track.id} 
              className="h-20 border-b border-gray-800 flex flex-col justify-center px-4 group hover:bg-[#222] transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-gray-300">
                  <span className={`p-1 rounded ${track.type === TrackType.AUDIO ? 'bg-emerald-500/10 text-emerald-500' : track.type === TrackType.TEXT ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {getIcon(track.type)}
                  </span>
                  <span className="text-xs font-medium truncate w-24">{track.name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button className={`p-1.5 rounded hover:bg-gray-700 ${track.isHidden ? 'text-indigo-400' : 'text-gray-500'}`}>
                  {track.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button className={`p-1.5 rounded hover:bg-gray-700 ${track.isMuted ? 'text-red-400' : 'text-gray-500'}`}>
                  {track.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <button className={`p-1.5 rounded hover:bg-gray-700 ${track.isLocked ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {track.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Area */}
        <div 
          ref={containerRef}
          className={`flex-1 overflow-x-auto overflow-y-auto relative bg-[#121212] scrollbar-thin scrollbar-thumb-gray-700 ${activeTool === 'cut' ? 'cursor-crosshair' : 'cursor-default'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        >
          {/* Ruler */}
          <div className="h-8 border-b border-gray-800 bg-[#1a1a1a] sticky top-0 z-20 min-w-full" style={{ width: `${Math.max(project.duration, 60) * PIXELS_PER_SECOND}px` }}>
             {renderRuler()}
          </div>

          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(90deg,#1f1f1f_1px,transparent_1px)]" 
               style={{ backgroundSize: `${PIXELS_PER_SECOND}px 100%`, width: `${Math.max(project.duration, 60) * PIXELS_PER_SECOND}px` }}>
          </div>

          {/* Playhead */}
          <div 
            className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-50 pointer-events-none"
            style={{ 
              left: project.currentTime * PIXELS_PER_SECOND,
              height: '100%',
            }}
          >
             <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500 -ml-[5.5px]"></div>
             <div className="absolute top-0 bottom-0 w-[1px] bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div>
          </div>

          {/* Tracks Container */}
          <div className="relative min-w-full pb-8" style={{ width: `${Math.max(project.duration, 60) * PIXELS_PER_SECOND}px` }}>
            {project.tracks.map((track) => (
              <div key={track.id} className="h-20 border-b border-gray-800/50 relative">
                {track.clips.map((clip) => (
                  <div
                    key={clip.id}
                    onClick={(e) => { 
                        e.stopPropagation();
                        if (activeTool === 'cut') {
                            const rect = containerRef.current!.getBoundingClientRect();
                            const scrollLeft = containerRef.current!.scrollLeft;
                            const clickX = e.clientX - rect.left + scrollLeft;
                            const time = clickX / PIXELS_PER_SECOND;
                            onSplitClip(clip.id, time);
                        } else {
                            onClipSelect(clip); 
                        }
                    }}
                    className={`absolute h-16 top-2 rounded-md border overflow-hidden flex flex-col justify-center px-2 transition-all group
                      ${selectedClipId === clip.id ? 'border-yellow-400 ring-2 ring-yellow-400/30 z-10' : 'border-gray-700/50 hover:border-gray-500'}
                      ${activeTool === 'cut' ? 'cursor-crosshair hover:bg-red-500/10 hover:border-red-500' : 'cursor-pointer'}
                    `}
                    style={{
                      left: clip.startTime * PIXELS_PER_SECOND,
                      width: clip.duration * PIXELS_PER_SECOND,
                      backgroundColor: clip.color,
                      opacity: track.isHidden ? 0.3 : 1
                    }}
                  >
                    <div className="flex items-center justify-between text-xs text-white font-medium drop-shadow-md z-10 pointer-events-none">
                        <span className="truncate mr-2">{clip.name}</span>
                    </div>
                    
                    {/* Visual cues for trimmed clips */}
                    {(clip.trimStart > 0 || clip.trimEnd > 0) && (
                        <div className="absolute bottom-1 right-2 text-[9px] bg-black/40 px-1 rounded text-white/80 pointer-events-none">
                            Trimmed
                        </div>
                    )}

                    {/* Waveform Simulation */}
                    {track.type === TrackType.AUDIO && (
                        <div className="absolute inset-0 opacity-40 flex items-center justify-center pointer-events-none">
                             <div className="w-full h-2/3 bg-[url('https://upload.wikimedia.org/wikipedia/commons/c/c2/Breakers-waveform.png')] bg-repeat-x bg-contain opacity-70 grayscale contrast-200"></div>
                        </div>
                    )}
                    
                    {/* Video Thumbnails Simulation */}
                    {track.type === TrackType.VIDEO && (
                        <div className="absolute inset-0 opacity-20 pointer-events-none flex overflow-hidden">
                             {[...Array(Math.ceil(clip.duration / 5))].map((_, i) => (
                                 <div key={i} className="flex-1 h-full border-r border-white/10 bg-black/20"></div>
                             ))}
                        </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
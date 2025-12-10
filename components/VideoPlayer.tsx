import React, { useEffect, useRef } from 'react';
import { Project, TrackType } from '../types';
import { Play, Pause, SkipBack, SkipForward, Maximize, Settings, MonitorPlay } from 'lucide-react';

interface VideoPlayerProps {
  project: Project;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ project, isPlaying, onTogglePlay }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Find the active video clip at the current time
  const activeVideoClip = project.tracks
    .filter(t => t.type === TrackType.VIDEO && !t.isHidden)
    .reverse() // Top tracks cover bottom tracks
    .flatMap(t => t.clips)
    .find(c => project.currentTime >= c.startTime && project.currentTime < c.startTime + c.duration);

  const activeTextClips = project.tracks
    .filter(t => t.type === TrackType.TEXT && !t.isHidden)
    .flatMap(t => t.clips)
    .filter(c => project.currentTime >= c.startTime && project.currentTime < c.startTime + c.duration);

  // Active audio clip for handling volume if it's the video audio
  const activeAudioClip = project.tracks
    .filter(t => t.type === TrackType.AUDIO && !t.isHidden)
    .flatMap(t => t.clips)
    .find(c => project.currentTime >= c.startTime && project.currentTime < c.startTime + c.duration);

  useEffect(() => {
    if (videoRef.current) {
      if (activeVideoClip?.src) {
        if (!videoRef.current.src.includes(activeVideoClip.src)) {
            videoRef.current.src = activeVideoClip.src;
        }
        
        const clipTime = (project.currentTime - activeVideoClip.startTime) + activeVideoClip.trimStart;
        
        if (Math.abs(videoRef.current.currentTime - clipTime) > 0.3) {
            videoRef.current.currentTime = clipTime;
        }
        
        // Volume Control
        const volume = activeVideoClip.properties?.volume !== undefined ? activeVideoClip.properties.volume : 1;
        videoRef.current.volume = Math.min(Math.max(volume, 0), 1);

        if (isPlaying) {
             videoRef.current.play().catch(() => {});
        } else {
             videoRef.current.pause();
        }

      } else {
        videoRef.current.pause();
      }
    }
  }, [project.currentTime, isPlaying, activeVideoClip]);


  return (
    <div className="flex flex-col h-full bg-black shadow-2xl">
      {/* Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#050505]">
        
        {!activeVideoClip && (
            <div className="absolute text-gray-700 flex flex-col items-center">
                <MonitorPlay size={48} className="mb-4 opacity-50" />
                <p className="font-mono text-sm tracking-widest uppercase">No Signal</p>
            </div>
        )}

        <div 
            className="relative bg-black shadow-lg overflow-hidden"
            style={{ 
                aspectRatio: `${project.width}/${project.height}`,
                height: '80%',
                maxHeight: '100%'
            }}
        >
            {/* Main Video Layer */}
            {activeVideoClip && (
                <div style={{
                    width: '100%',
                    height: '100%',
                    transform: `rotate(${activeVideoClip.properties?.rotation || 0}deg) scale(${activeVideoClip.properties?.scale ?? 1}) translate(${activeVideoClip.properties?.x || 0}px, ${activeVideoClip.properties?.y || 0}px)`,
                    opacity: activeVideoClip.properties?.opacity ?? 1,
                    transition: 'transform 0.1s linear' // Smooth rotation
                }}>
                    <video 
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        style={{ 
                            filter: activeVideoClip.effects?.map(e => `${e.type}(${e.value})`).join(' ') || 'none'
                        }}
                    />
                </div>
            )}

            {/* Overlay Layer (Text) */}
            <div className="absolute inset-0 pointer-events-none">
                {activeTextClips.map(clip => (
                    <div 
                        key={clip.id}
                        className="absolute w-full text-center flex items-center justify-center"
                        style={{
                            top: '50%',
                            transform: `translateY(-50%) rotate(${clip.properties?.rotation || 0}deg)`,
                        }}
                    >
                         <h2 
                            style={{
                                fontSize: `${clip.properties?.fontSize || 60}px`,
                                color: clip.properties?.volume ? `rgba(255,255,255,${clip.properties.volume})` : 'white', // abusing volume for text opacity if needed or use opacity property
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                fontFamily: clip.properties?.fontFamily || 'sans-serif',
                                opacity: clip.properties?.opacity ?? 1,
                                transform: `scale(${clip.properties?.scale || 1}) translate(${clip.properties?.x || 0}px, ${clip.properties?.y || 0}px)`,
                            }}
                         >
                            {clip.properties?.text || clip.name}
                         </h2>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="h-14 bg-[#1a1a1a] flex items-center justify-center space-x-6 border-t border-gray-800 relative select-none">
        <div className="absolute left-4 text-xs font-mono text-gray-500">
            {activeVideoClip ? `${project.width}x${project.height} • ${project.fps}FPS` : 'Ready'}
        </div>

        <button className="text-gray-400 hover:text-white transition active:scale-90"><SkipBack size={20} /></button>
        <button 
            onClick={onTogglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition shadow-lg ${isPlaying ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-white text-black hover:bg-gray-200'}`}
        >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
        </button>
        <button className="text-gray-400 hover:text-white transition active:scale-90"><SkipForward size={20} /></button>
        
        <div className="absolute right-4 flex space-x-3">
             <button className="text-gray-400 hover:text-white"><Settings size={18} /></button>
             <button className="text-gray-400 hover:text-white"><Maximize size={18} /></button>
        </div>
      </div>
    </div>
  );
};
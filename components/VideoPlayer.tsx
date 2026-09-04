
import React, { useEffect, useRef, useState } from 'react';
import { Project, TrackType } from '../types';
import {
    Play, Pause, SkipBack, SkipForward, Maximize, Minimize,
    Settings, Volume2, VolumeX, Gauge, MonitorPlay, Cast, Activity, Layers
} from 'lucide-react';

interface VideoPlayerProps {
    project: Project;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onSeek: (time: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ project, isPlaying, onTogglePlay, onSeek }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Local State
    const [showControls, setShowControls] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Derived State
    // Search both VIDEO and IMAGE tracks for all active visual clips
    const activeVisualClips = project.tracks
        .filter(t => (t.type === TrackType.VIDEO || t.type === TrackType.IMAGE) && !t.isHidden)
        .flatMap(t => t.clips.map(c => ({ ...c, trackId: t.id })))
        .filter(c => project.currentTime >= c.startTime && project.currentTime < c.startTime + c.duration)
        .sort((a, b) => {
            const trackAIndex = project.tracks.findIndex(t => t.id === a.trackId);
            const trackBIndex = project.tracks.findIndex(t => t.id === b.trackId);
            return trackAIndex - trackBIndex; // Lower index = back, Higher index = front
        });

    const activeTextClips = project.tracks
        .filter(t => t.type === TrackType.TEXT && !t.isHidden)
        .flatMap(t => t.clips)
        .filter(c => project.currentTime >= c.startTime && project.currentTime < c.startTime + c.duration);

    // Helper for transitions
    const getClipOpacity = (clip: any, currentTime: number) => {
        let baseOpacity = clip.properties?.opacity ?? 1;
        const clipTime = currentTime - clip.startTime;

        // Transition In
        if (clip.transitionIn && clipTime < clip.transitionIn.duration) {
            const factor = clipTime / clip.transitionIn.duration;
            if (clip.transitionIn.type === 'fade') baseOpacity *= factor;
            if (clip.transitionIn.type === 'zoom') { /* handled via transform */ }
        }

        // Transition Out
        if (clip.transitionOut && clipTime > clip.duration - clip.transitionOut.duration) {
            const factor = (clip.duration - clipTime) / clip.transitionOut.duration;
            if (clip.transitionOut.type === 'fade') baseOpacity *= factor;
        }

        return baseOpacity;
    };

    const getClipTransform = (clip: any, currentTime: number) => {
        let scale = clip.properties?.scale ?? 1;
        let x = clip.properties?.x || 0;
        let y = clip.properties?.y || 0;
        const clipTime = currentTime - clip.startTime;

        // Transition In
        if (clip.transitionIn && clipTime < clip.transitionIn.duration) {
            const factor = clipTime / clip.transitionIn.duration;
            if (clip.transitionIn.type === 'zoom') scale *= factor;
            if (clip.transitionIn.type === 'slide-left') x += (1 - factor) * -1000;
            if (clip.transitionIn.type === 'slide-right') x += (1 - factor) * 1000;
        }

        // Transition Out
        if (clip.transitionOut && clipTime > clip.duration - clip.transitionOut.duration) {
            const factor = (clip.duration - clipTime) / clip.transitionOut.duration;
            if (clip.transitionOut.type === 'zoom') scale *= factor;
            if (clip.transitionOut.type === 'slide-left') x += (1 - factor) * -1000;
            if (clip.transitionOut.type === 'slide-right') x += (1 - factor) * 1000;
        }

        return `rotate(${clip.properties?.rotation || 0}deg) scale(${scale}) translate(${x}px, ${y}px)`;
    };

    const aspectRatio = project.width / project.height;

    // --- Handlers ---

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            wrapperRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleFrameStep = (direction: 'prev' | 'next') => {
        const frameTime = 1 / project.fps;
        const newTime = direction === 'next'
            ? Math.min(project.duration, project.currentTime + frameTime)
            : Math.max(0, project.currentTime - frameTime);
        onSeek(newTime);
    };

    const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        onSeek(Math.max(0, Math.min(project.duration, percent * project.duration)));
    };

    // --- Sync Effects (simplified) ---
    useEffect(() => {
        // We handle video sync in the ref callback now for better multi-clip support
    }, [project.currentTime, isPlaying, playbackSpeed, volume, isMuted]);
    return (
        <div
            className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] relative overflow-hidden transition-colors duration-500"
        >
            {/* --- BACKGROUND ENVIRONMENT --- */}
            <div className="absolute inset-0 bg-gray-100 dark:bg-gradient-to-b dark:from-[#0a0a0a] dark:via-[#0c0c0e] dark:to-[#0a0a0a] z-0 transition-colors duration-500"></div>

            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-[0.02] z-0 pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Stage Light Effect */}
            <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            {/* --- PLAYER CONTAINER (STATIC - NO HOVER) --- */}
            <div
                className="relative z-10 group"
                style={{
                    aspectRatio: '16 / 9',
                    width: isFullscreen ? '100%' : '83%',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: isFullscreen ? '100%' : '95%',
                }}
            >
                {/* Ambient Dynamic Backlight (Ambilight) */}
                <div className="absolute -inset-12 bg-indigo-600/10 blur-[80px] rounded-full opacity-50 transition-opacity duration-700 pointer-events-none"></div>

                {/* Depth Shadow */}
                <div className="absolute inset-8 rounded-xl bg-black/40 blur-2xl pointer-events-none"></div>
                <div className="absolute inset-0 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-shadow duration-500"></div>

                {/* --- SLIM BEZEL --- */}
                <div className="absolute -inset-[1px] rounded-[10px] bg-gradient-to-br from-white/10 via-white/5 to-white/10 opacity-50 z-0 ring-1 ring-white/10"></div>

                {/* Bezel Interior (Black) */}
                <div className="absolute inset-[1px] rounded-[9px] bg-black z-0 overflow-hidden shadow-inner">

                    {/* --- SCREEN CONTENT AREA --- */}
                    <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">

                        {/* No Signal / Placeholder */}
                        {activeVisualClips.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 opacity-30 pointer-events-none">
                                <MonitorPlay size={48} className="mb-4 text-gray-400" strokeWidth={1} />
                                <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-gray-500">No Signal</p>
                            </div>
                        )}

                        {/* Video/Image Content Layer ... (Clip mapping remains same) */}
                        {activeVisualClips.map((clip) => (
                            <div key={clip.id} style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: getClipTransform(clip, project.currentTime), opacity: getClipOpacity(clip, project.currentTime), transition: 'transform 0.1s linear', zIndex: 10 }}>
                                {clip.type === TrackType.VIDEO ? (
                                    <video
                                        ref={(el) => {
                                            if (el) {
                                                const clipTime = (project.currentTime - clip.startTime) + (clip.trimStart || 0);
                                                if (Math.abs(el.currentTime - clipTime) > 0.3) el.currentTime = clipTime;
                                                if (isPlaying) el.play().catch(() => { }); else el.pause();
                                                el.volume = isMuted ? 0 : volume;
                                                el.playbackRate = playbackSpeed;
                                                if (!el.src.includes(clip.src) && clip.src) el.src = clip.src;
                                            }
                                        }}
                                        className="max-w-full max-h-full object-contain"
                                        style={{ filter: clip.effects?.map(e => `${e.type}(${e.value}${e.type === 'blur' ? 'px' : e.type === 'hue-rotate' ? 'deg' : '%'})`).join(' ') || 'none', aspectRatio: `${project.width} / ${project.height}` }}
                                        playsInline muted={isMuted}
                                    />
                                ) : (
                                    <img src={clip.src} className="max-w-full max-h-full object-contain" style={{ filter: clip.effects?.map(e => `${e.type}(${e.value}${e.type === 'blur' ? 'px' : e.type === 'hue-rotate' ? 'deg' : '%'})`).join(' ') || 'none' }} alt={clip.name} />
                                )}
                            </div>
                        ))}

                        {/* Text Overlay Layer */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                            {activeTextClips.map(clip => (
                                <div key={clip.id} className="absolute w-full h-full flex items-center justify-center">
                                    <h2 style={{ fontSize: `${clip.properties?.fontSize || 60}px`, color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', fontFamily: clip.properties?.fontFamily || 'sans-serif', opacity: clip.properties?.opacity ?? 1, transform: `rotate(${clip.properties?.rotation || 0}deg) scale(${clip.properties?.scale || 1}) translate(${clip.properties?.x || 0}px, ${clip.properties?.y || 0}px)`, transition: 'transform 0.1s linear' }}>
                                        {clip.properties?.text || clip.name}
                                    </h2>
                                </div>
                            ))}
                        </div>

                        {/* Glass Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-30 opacity-50"></div>

                        {/* --- CONTROLS OVERLAY (Always Visible) --- */}
                        <div
                            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-40 opacity-100"
                        >
                            {/* Progress Bar */}
                            <div className="relative w-full h-1 bg-white/20 cursor-pointer group/scrubber rounded-full mb-4 hover:h-1.5 transition-all" onClick={handleScrub}>
                                <div className="h-full bg-indigo-500 rounded-full relative" style={{ width: `${(project.currentTime / project.duration) * 100}%` }}>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/scrubber:opacity-100 transition-opacity scale-125"></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <button onClick={onTogglePlay} className="text-white hover:text-indigo-400 transition hover:scale-110 active:scale-95">
                                        {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleFrameStep('prev')} className="text-gray-400 hover:text-white p-1.5 rounded-full transition"><SkipBack size={18} /></button>
                                        <button onClick={() => handleFrameStep('next')} className="text-gray-400 hover:text-white p-1.5 rounded-full transition"><SkipForward size={18} /></button>
                                    </div>
                                    <div className="font-mono text-xs text-gray-300">
                                        <span className="text-white font-bold">{new Date(project.currentTime * 1000).toISOString().substr(14, 5)}</span>
                                        <span className="mx-1 opacity-40">/</span>
                                        <span className="opacity-60">{new Date(project.duration * 1000).toISOString().substr(14, 5)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 group/volume">
                                        <button onClick={() => setIsMuted(!isMuted)} className="text-gray-300 hover:text-white transition">
                                            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                        </button>
                                        <div className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-300 opacity-0 group-hover/volume:opacity-100 h-1 bg-white/20 rounded-full">
                                            <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={(e) => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }} className="w-full h-full accent-indigo-500 cursor-pointer" />
                                        </div>
                                    </div>
                                    <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="text-[10px] font-bold text-gray-300 hover:text-white transition">
                                        {playbackSpeed}x
                                    </button>
                                    <button onClick={toggleFullscreen} className="text-gray-300 hover:text-white transition"><Maximize size={18} /></button>
                                </div>
                            </div>
                        </div>

                        {/* Speed Menu Overlay */}
                        {showSpeedMenu && (
                            <div className="absolute bottom-20 right-6 bg-[#1a1a1a]/95 backdrop-blur border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[80px] z-50 animate-in slide-in-from-bottom-2">
                                {[0.5, 1, 1.5, 2].map(speed => (
                                    <button key={speed} onClick={() => { setPlaybackSpeed(speed); setShowSpeedMenu(false); }} className={`block w-full px-3 py-2 text-[10px] text-left hover:bg-white/10 ${playbackSpeed === speed ? 'text-indigo-400 font-bold' : 'text-gray-300'}`}>
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CORNER ACCENTS --- */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 transition-opacity duration-500 z-50">
                    <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t-2 border-l-2 border-indigo-500/30 rounded-tl-lg"></div>
                    <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t-2 border-r-2 border-purple-500/30 rounded-tr-lg"></div>
                    <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b-2 border-l-2 border-indigo-500/30 rounded-bl-lg"></div>
                    <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b-2 border-r-2 border-blue-500/30 rounded-br-lg"></div>
                </div>
            </div>
        </div>
    );
};

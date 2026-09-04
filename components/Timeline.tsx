
import React, { useRef, useState, useEffect } from 'react';
import { Project, Clip, TrackType, Marker, Track } from '../types';
import {
  Film, Music, Type, Eye, EyeOff, Volume2, VolumeX, Lock, Unlock,
  Scissors, GripVertical, Image as ImageIcon, Plus, Trash2, Speaker,
  MousePointer2, Magnet, Undo, Redo, Minus, Flag, ChevronDown, Copy
} from 'lucide-react';
import { getSnapCandidates, snapTimeToCandidate, rippleDeleteClip, liftDeleteClip } from '../services/timelineHelpers';

interface TimelineProps {
  project: Project;
  onSeek: (time: number) => void;
  onClipSelect: (clip: Clip) => void;
  selectedClipId?: string;
  selectedClipIds?: string[];
  onMultiClipSelect?: (ids: string[]) => void;
  zoom?: number;
  activeTool: string;
  onSplitClip: (clipId: string, splitTime: number) => void;
  onClipMove?: (clipId: string, newStartTime: number) => void;
  onAddTrack: (type: 'video' | 'audio' | 'text') => void;
  onDeleteTrack: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onAddMarker: () => void;
  onZoomChange: (newZoom: number) => void;
  onDeleteClip: (clipId: string) => void;
  deleteMode?: 'lift' | 'ripple';
}



const SNAP_THRESHOLD_PX = 15;

export const Timeline: React.FC<TimelineProps> = ({
  project,
  onSeek,
  onClipSelect,
  selectedClipId,
  selectedClipIds = [],
  onMultiClipSelect,
  zoom = 1,
  activeTool,
  onSplitClip,
  onClipMove,
  onAddTrack,
  onDeleteTrack,
  onToggleSolo,
  onAddMarker,
  onZoomChange,
  onDeleteClip,
  deleteMode = 'lift',
}) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Local State
  const [showAddTrackMenu, setShowAddTrackMenu] = useState(false);
  const [pixelsPerUnit, setPixelsPerUnit] = useState(20 * zoom);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'clip' | 'track', targetId?: string } | null>(null);
  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);

  // Drag State
  /* Drag & Interaction State */
  const [dragState, setDragState] = useState<{
    clipId: string;
    // Current Ghost Position (Screen Coords)
    currentX: number;
    currentY: number;
    // Timeline Position (for dropping back logic)
    currentStartTime: number;
    isSnapping: boolean;
    // Interaction State
    isHoveringDelete: boolean;
  } | null>(null);

  const [genieState, setGenieState] = useState<{
    clipId: string;
    rect: { left: number; top: number; width: number; height: number };
    targetRect: DOMRect;
  } | null>(null);

  // Refs
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const dragSessionRef = useRef<{
    clipId: string;
    startX: number;
    startY: number;
    originalStartTime: number;
    snapPoints: number[];
    clipName: string; // for ghost render
    clipColor: string; // for ghost render
    trackType: TrackType; // for ghost render
    duration: number; // for ghost render
    mode: 'standard' | 'ghost'; // New mode
  } | null>(null);


  const isScrubbingRef = useRef(false);
  const zoomRef = useRef(zoom);
  const projectRef = useRef(project);
  const onSeekRef = useRef(onSeek);
  const onClipMoveRef = useRef(onClipMove);

  // Sync Props
  useEffect(() => {
    setPixelsPerUnit(20 * zoom);
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => { isScrubbingRef.current = isScrubbing; }, [isScrubbing]);
  useEffect(() => { projectRef.current = project; }, [project]);
  useEffect(() => { onSeekRef.current = onSeek; }, [onSeek]);
  useEffect(() => { onClipMoveRef.current = onClipMove; }, [onClipMove]);

  // Scroll Sync
  const handleScroll = () => {
    if (timelineRef.current && headerRef.current) {
      headerRef.current.scrollTop = timelineRef.current.scrollTop;
    }
  };

  // Handle Wheel Events (Zoom, Pan, Vertical Scroll Proxy)
  const handleHeaderWheel = (e: React.WheelEvent) => {
    if (timelineRef.current) {
      // Forward vertical scroll to main timeline
      timelineRef.current.scrollTop += e.deltaY;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // CTRL = Zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(zoom * delta, 0.1), 5); // Limits from App.tsx
      onZoomChange(newZoom);
    }
    // SHIFT = Pan Horizontal
    else if (e.shiftKey) {
      if (timelineRef.current) {
        timelineRef.current.scrollLeft += e.deltaY;
      }
    }
    // Default = Vertical Scroll (Native behavior works, but we need strictly vertical)
    // If we want to force vertical even if shift is held but not processed (e.g. edge cases), native is usually fine.
    // But for trackpad 'pinch' which maps to ctrl+wheel, we handled zoom.
  };


  // Snapping Logic
  const getSnapPoints = (excludeClipId: string) => {
    const points = [0, project.currentTime];
    if (project.markers) points.push(...project.markers.map(m => m.time));
    project.tracks.forEach(t => {
      if (t.isHidden) return;
      t.clips.forEach(c => {
        if (c.id === excludeClipId) return;
        points.push(c.startTime);
        points.push(c.startTime + c.duration);
      });
    });
    return points;
  };

  const getSnapCandidatesList = () => getSnapCandidates(project);

  // --- GLOBAL EVENT LISTENERS ---
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      const currentPPS = 20 * zoomRef.current;

      if (isMarqueeActive && marqueeStart) {
        setMarqueeEnd({ x: e.clientX, y: e.clientY });
        return;
      }

      if (dragSessionRef.current) {
        e.preventDefault();
        const currentPPS = 20 * zoomRef.current;
        const { startX, originalStartTime, snapPoints, mode } = dragSessionRef.current;

        if (mode === 'standard') {
          const deltaX = e.clientX - startX;
          const deltaTime = deltaX / currentPPS;
          const rawNewTime = Math.max(0, originalStartTime + deltaTime);

          let snappedTime = rawNewTime;
          let isSnapping = false;

          if (snapEnabled) {
            const candidates = getSnapCandidatesList();
            const snapped = snapTimeToCandidate(rawNewTime, candidates, SNAP_THRESHOLD_PX, currentPPS);
            if (snapped !== null) {
              snappedTime = snapped;
              isSnapping = true;
            }
          }

          setDragState({
            clipId: dragSessionRef.current.clipId,
            currentX: e.clientX,
            currentY: e.clientY,
            currentStartTime: snappedTime,
            isSnapping,
            isHoveringDelete: false
          });
        }
        else if (mode === 'ghost') {
          let isHoveringDelete = false;
          if (deleteButtonRef.current) {
            const rect = deleteButtonRef.current.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
              e.clientY >= rect.top && e.clientY <= rect.bottom) {
              isHoveringDelete = true;
            }
          }

          setDragState({
            clipId: dragSessionRef.current.clipId,
            currentX: e.clientX,
            currentY: e.clientY,
            currentStartTime: originalStartTime,
            isSnapping: false,
            isHoveringDelete
          });
        }
        return;
      }

      if (isScrubbingRef.current && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const scrollLeft = timelineRef.current.scrollLeft;
        const newTime = Math.max(0, (x + scrollLeft) / currentPPS);
        if (onSeekRef.current) onSeekRef.current(newTime);
      }
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (isMarqueeActive && marqueeStart && marqueeEnd) {
        const x1 = Math.min(marqueeStart.x, marqueeEnd.x);
        const x2 = Math.max(marqueeStart.x, marqueeEnd.x);
        const y1 = Math.min(marqueeStart.y, marqueeEnd.y);
        const y2 = Math.max(marqueeStart.y, marqueeEnd.y);
        if (x2 - x1 > 5 || y2 - y1 > 5) {
          const selected: string[] = [];
          const timelineRect = timelineRef.current?.getBoundingClientRect();
          if (timelineRect) {
            const scrollLeft = timelineRef.current.scrollLeft;
            project.tracks.forEach(track => {
              track.clips.forEach(clip => {
                const clipLeft = timelineRect.left + (clip.startTime * pixelsPerUnit) - scrollLeft;
                const clipTop = timelineRect.top + 40 + project.tracks.indexOf(track) * 64;
                const clipRight = clipLeft + Math.max(2, clip.duration * pixelsPerUnit);
                const clipBottom = clipTop + 64;
                if (clipRight >= x1 && clipLeft <= x2 && clipBottom >= y1 && clipTop <= y2) {
                  selected.push(clip.id);
                }
              });
            });
          }
          if (onMultiClipSelect && selected.length > 0) {
            onMultiClipSelect(selected);
          }
        }
        setIsMarqueeActive(false);
        setMarqueeStart(null);
        setMarqueeEnd(null);
        return;
      }

      if (dragSessionRef.current) {
        const currentPPS = 20 * zoomRef.current;
        const { clipId, originalStartTime } = dragSessionRef.current;

        const { startX, snapPoints } = dragSessionRef.current;
        const deltaX = e.clientX - startX;
        const deltaTime = deltaX / currentPPS;
        const rawNewTime = Math.max(0, originalStartTime + deltaTime);

        let finalTime = rawNewTime;
        if (snapEnabled) {
          const candidates = getSnapCandidatesList();
          const snapped = snapTimeToCandidate(rawNewTime, candidates, SNAP_THRESHOLD_PX, currentPPS);
          if (snapped !== null) finalTime = snapped;
        }

        let performedAction = false;

        if (deleteButtonRef.current) {
          const rect = deleteButtonRef.current.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {

            const ghostRect = {
              left: e.clientX - 20,
              top: e.clientY - 10,
              width: Math.max(2, dragSessionRef.current.duration * 20 * zoomRef.current),
              height: 40
            };

            setGenieState({
              clipId: dragSessionRef.current.clipId,
              rect: ghostRect,
              targetRect: rect
            });

            setTimeout(() => {
              onDeleteClip(clipId);
              setGenieState(null);
            }, 700);

            performedAction = true;
          }
        }

        if (!performedAction && onClipMoveRef.current && Math.abs(finalTime - originalStartTime) > 0.001) {
          onClipMoveRef.current(clipId, finalTime);
        }

        dragSessionRef.current = null;
        setDragState(null);
      }

      if (isScrubbingRef.current) {
        setIsScrubbing(false);
      }
    };

    const handleWindowClick = () => setContextMenu(null);

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('click', handleWindowClick);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [snapEnabled, project, selectedClipId, selectedClipIds, isMarqueeActive, marqueeStart, marqueeEnd, pixelsPerUnit]);

  // --- RENDER HELPERS ---
  const renderRuler = () => {
    const marks = [];
    const totalSeconds = Math.max(project.duration, 600);
    // Dynamic Step Calculation
    const step = zoom < 0.2 ? 20 : zoom < 0.5 ? 10 : zoom > 3 ? 0.5 : zoom > 1.5 ? 1 : 5;

    for (let i = 0; i < totalSeconds; i += step) {
      marks.push(
        <div
          key={i}
          className="absolute top-0 h-full border-l border-gray-300 dark:border-gray-700 text-[10px] text-gray-400 pl-1 select-none flex items-end pb-1"
          style={{ left: i * pixelsPerUnit }}
        >
          {new Date(i * 1000).toISOString().substr(14, 5)}
        </div>
      );
    }
    return marks;
  };

  const getIcon = (type: TrackType) => {
    switch (type) {
      case TrackType.VIDEO: return <Film size={14} />;
      case TrackType.AUDIO: return <Music size={14} />;
      case TrackType.TEXT: return <Type size={14} />;
      case TrackType.IMAGE: return <ImageIcon size={14} />;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * 30);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  // --- HANDLERS ---
  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'select' && (e.target as HTMLElement).closest('.timeline-clip')) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      setIsMarqueeActive(true);
      setMarqueeStart({ x: e.clientX, y: e.clientY });
      setMarqueeEnd({ x: e.clientX, y: e.clientY });
      return;
    }

    setIsScrubbing(true);
    const x = e.clientX - rect.left;
    const scrollLeft = timelineRef.current?.scrollLeft || 0;
    onSeek(Math.max(0, (x + scrollLeft) / pixelsPerUnit));
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'clip' | 'track', id?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, targetId: id });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#121212] border-t border-gray-200 dark:border-gray-800 select-none">

      {/* NEW TOOLBAR (Replacing old one) */}
      <div className="h-10 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div className={`flex items-center gap-2 ${activeTool === 'select' ? 'text-indigo-500 font-medium' : ''}`}>
            <MousePointer2 size={14} /> <span className="hidden sm:inline">Select</span>
          </div>
          <div className={`flex items-center gap-2 ${activeTool === 'cut' ? 'text-indigo-500 font-medium' : ''}`}>
            <Scissors size={14} /> <span className="hidden sm:inline">Split</span>
          </div>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`flex items-center gap-2 hover:text-indigo-500 transition-colors ${snapEnabled ? 'text-indigo-500' : ''}`}
          >
            <Magnet size={14} /> <span className="hidden sm:inline">Snap</span>
          </button>
          <button
            onClick={onAddMarker}
            className="flex items-center gap-2 hover:text-indigo-500 transition-colors"
          >
            <Flag size={14} /> <span className="hidden sm:inline">Marker</span>
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />
          <button
            onClick={() => {
              const targetId = selectedClipIds[0] || selectedClipId;
              if (!targetId) return;
              if (deleteMode === 'ripple') {
                const newProject = rippleDeleteClip(project, targetId, project.currentTime);
                // parent would need to handle this, but we just call onDeleteClip for now
                onDeleteClip(targetId);
              } else {
                onDeleteClip(targetId);
              }
            }}
            disabled={!(selectedClipIds.length > 0 || selectedClipId)}
            className={`
              flex items-center gap-2 px-2 py-1 rounded transition-all duration-300 relative overflow-hidden
              ${(selectedClipIds.length > 0 || selectedClipId) ? 'text-red-500 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)] cursor-pointer' : 'text-gray-400 cursor-not-allowed opacity-50'}
            `}
            title={`Delete (${deleteMode} mode)`}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline font-medium">Delete</span>
            <span className="text-[9px] font-mono bg-gray-200 dark:bg-gray-700 rounded px-1 ml-1">{deleteMode === 'ripple' ? 'RIP' : 'LIFT'}</span>
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />
          <button
            onClick={() => {/* prop toggled by App */ }}
            className="text-[10px] font-mono px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            title="Toggle delete mode (ripple / lift)"
          >
            {deleteMode === 'ripple' ? 'Ripple' : 'Lift'}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
          {formatTime(project.currentTime)}
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Tracks Header */}
        <div ref={headerRef} onWheel={handleHeaderWheel} className="w-56 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 z-20 overflow-hidden">
          <div className="h-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#222] flex items-center px-4 text-[10px] font-bold text-gray-500 uppercase">
            Tracks
          </div>

          <div className="flex flex-col pb-24">
            {project.tracks.map(track => (
              <div
                key={track.id}
                className="h-16 border-b border-gray-200 dark:border-gray-800 flex flex-col justify-center px-3 group hover:bg-gray-50 dark:hover:bg-[#222] transition-colors relative"
                onContextMenu={(e) => handleContextMenu(e, 'track', track.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`p-1 rounded ${track.type === TrackType.AUDIO ? 'text-emerald-500 bg-emerald-500/10' : 'text-blue-500 bg-blue-500/10'}`}>
                    {getIcon(track.type)}
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex-1">{track.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    className={`p-1 rounded ${track.isMuted ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    onClick={() => { /* needs update handler logic, for now purely visual update from parent would be needed */ }}
                  >
                    {track.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  </button>
                  <button
                    className={`p-1 rounded ${track.isSolo ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    onClick={() => onToggleSolo(track.id)}
                  >
                    <Speaker size={12} />
                  </button>
                  <button className={`p-1 rounded ${track.isLocked ? 'text-orange-500' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {track.isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                </div>
              </div>
            ))}

            {/* ADD TRACK BUTTON */}
            <div className="p-2 border-t border-gray-200 dark:border-gray-800 mt-2 relative">
              <button
                onClick={() => setShowAddTrackMenu(!showAddTrackMenu)}
                className="w-full py-1.5 text-xs border border-dashed border-gray-300 dark:border-gray-700 rounded text-gray-500 hover:text-indigo-500 hover:border-indigo-500 flex items-center justify-center gap-1.5"
              >
                <Plus size={12} /> Add Track
              </button>
              {showAddTrackMenu && (
                <div className="absolute top-full left-2 right-2 mt-1 bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg z-50 overflow-hidden">
                  <button onClick={() => { onAddTrack('video'); setShowAddTrackMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex gap-2"><Film size={12} /> Video</button>
                  <button onClick={() => { onAddTrack('audio'); setShowAddTrackMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex gap-2"><Music size={12} /> Audio</button>
                  <button onClick={() => { onAddTrack('text'); setShowAddTrackMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex gap-2"><Type size={12} /> Text</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Timeline Content */}
        <div
          ref={timelineRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          className="flex-1 overflow-auto relative bg-gray-50 dark:bg-[#121212] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
          onMouseDown={handleTimelineMouseDown}
        >
          {/* Ruler */}
          <div className="h-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] sticky top-0 z-30 min-w-full" style={{ width: `${Math.max(project.duration, 600) * pixelsPerUnit}px` }}>
            {renderRuler()}
            {/* Markers on Ruler */}
            {project.markers?.map(m => (
              <div
                key={m.id}
                className="absolute top-0 bottom-0 z-40 group/marker cursor-pointer"
                style={{ left: m.time * pixelsPerUnit }}
              >
                <Flag size={10} fill={m.color} className="text-transparent mt-1" />
                <div className="h-full w-px bg-yellow-500/50" />
                <span className="absolute top-4 left-1 text-[9px] bg-white dark:bg-gray-800 px-1 rounded shadow text-gray-600 dark:text-gray-300 opacity-0 group-hover/marker:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="absolute top-8 bottom-0 left-0 pointer-events-none z-0 bg-[linear-gradient(90deg,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(90deg,#1f1f1f_1px,transparent_1px)] min-w-full"
            style={{ backgroundSize: `${pixelsPerUnit}px 100%`, width: `${Math.max(project.duration, 600) * pixelsPerUnit}px` }} />

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none" style={{ left: project.currentTime * pixelsPerUnit }}>
            <div className="sticky top-0 -ml-[5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-red-500" />
          </div>

          {/* Snap Indicator */}
          {dragState?.isSnapping && (
            <div className="absolute top-8 bottom-0 w-px bg-emerald-500 z-50 pointer-events-none shadow-[0_0_8px_#10b981]" style={{ left: dragState.currentStartTime * pixelsPerUnit }} />
          )}

          {/* Marquee Selection */}
          {isMarqueeActive && marqueeStart && marqueeEnd && (
            <div
              className="fixed z-[200] border border-indigo-400 bg-indigo-500/10 pointer-events-none"
              style={{
                left: Math.min(marqueeStart.x, marqueeEnd.x),
                top: Math.min(marqueeStart.y, marqueeEnd.y),
                width: Math.abs(marqueeEnd.x - marqueeStart.x),
                height: Math.abs(marqueeEnd.y - marqueeStart.y),
              }}
            />
          )}

          {/* Tracks Container */}
          <div className="relative min-w-full pb-24 z-10" style={{ width: `${Math.max(project.duration, 600) * pixelsPerUnit}px` }}>
            {project.tracks.map(track => (
              <div
                key={track.id}
                className={`h-16 border-b border-gray-200/50 dark:border-gray-800/50 relative ${track.isSolo ? 'bg-yellow-500/5' : ''} ${track.isMuted ? 'opacity-60 grayscale' : ''}`}
              >
                {track.clips.map(clip => {
                  const isDragging = dragState?.clipId === clip.id;
                  const displayStartTime = isDragging ? dragState.currentStartTime : clip.startTime;

                  return (
                    <div
                      key={clip.id}
                      onMouseDown={(e) => {
                        if (e.button !== 0 || track.isLocked) return;
                        e.stopPropagation();
                        e.preventDefault();

                        if (activeTool === 'select') {
                          if (e.shiftKey || e.ctrlKey || e.metaKey) {
                            const newSelection = e.shiftKey
                              ? selectedClipIds.includes(clip.id)
                                ? selectedClipIds.filter(id => id !== clip.id)
                                : [...selectedClipIds, clip.id]
                              : [clip.id];
                            if (onMultiClipSelect) {
                              onMultiClipSelect(newSelection);
                            }
                            onClipSelect(clip);
                            return;
                          }

                          onClipSelect(clip);
                          dragSessionRef.current = {
                            clipId: clip.id,
                            startX: e.clientX,
                            startY: e.clientY,
                            originalStartTime: clip.startTime,
                            snapPoints: getSnapPoints(clip.id),
                            clipName: clip.name,
                            clipColor: clip.color,
                            trackType: track.type,
                            duration: clip.duration
                          };
                          setDragState({
                            clipId: clip.id,
                            currentX: e.clientX,
                            currentY: e.clientY,
                            currentStartTime: clip.startTime,
                            isSnapping: false,
                            isHoveringDelete: false
                          });
                        }
                      }}
                      onContextMenu={(e) => handleContextMenu(e, 'clip', clip.id)}
                      style={{
                        left: displayStartTime * pixelsPerUnit,
                        width: Math.max(2, clip.duration * pixelsPerUnit),
                        backgroundColor: isDragging ? 'transparent' : clip.color,
                        zIndex: isDragging ? 0 : 10,
                        opacity: isDragging ? 0 : 1, // Hide original
                        border: isDragging ? 'none' : undefined
                      }}
                      className={`
                                        absolute top-2 bottom-2 rounded-md border timeline-clip
                                        ${selectedClipIds.includes(clip.id) ? 'border-white ring-2 ring-indigo-500/50 shadow-lg' : (selectedClipId === clip.id ? 'border-white ring-2 ring-indigo-500/50 shadow-lg' : 'border-white/10 opacity-90')}
                                        ${isDragging ? 'cursor-grabbing shadow-xl scale-[1.02]' : 'cursor-grab'}
                                        overflow-hidden flex flex-col justify-center px-2 group transition-all
                                      `}
                    >
                      <span className="text-[10px] font-bold text-white truncate drop-shadow relative z-20 flex items-center gap-1">
                        {clip.name}
                      </span>

                      {/* Mock Waveform / Visuals */}
                      {track.type === TrackType.AUDIO && (
                        <div className="absolute inset-0 opacity-30 flex items-center gap-px px-1 pointer-events-none">
                          {[...Array(20)].map((_, i) => <div key={i} className="flex-1 bg-black rounded-full" style={{ height: `${Math.random() * 80 + 20}%` }} />)}
                        </div>
                      )}
                      {(track.type === TrackType.VIDEO) && (
                        <div className="absolute inset-0 opacity-20 flex divide-x divide-white/20 pointer-events-none">
                          {[...Array(5)].map((_, i) => <div key={i} className="flex-1 bg-black/20" />)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GHOST CLIP (When Dragging) */}
      {dragState && dragSessionRef.current && (
        <div
          className="fixed z-[999] pointer-events-none rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/50 backdrop-blur-sm flex flex-col justify-center px-2"
          style={{
            left: dragState.currentX,
            top: dragState.currentY,
            width: Math.max(50, dragSessionRef.current.duration * pixelsPerUnit),
            height: 40,
            backgroundColor: dragSessionRef.current.clipColor,
            transform: 'translate(-10%, -50%) rotate(3deg)', // Slight offset and tilt for "floating" feel
          }}
        >
          <span className="text-[10px] font-bold text-white truncate drop-shadow">{dragSessionRef.current.clipName}</span>
        </div>
      )}

      {/* GENIE EFFECT ANIMATION */}
      {genieState && (
        <div
          className="fixed z-[1000] pointer-events-none bg-black rounded-lg"
          style={{
            left: genieState.rect.left,
            top: genieState.rect.top,
            width: genieState.rect.width,
            height: genieState.rect.height,
            backgroundColor: '#ef4444', // Red color for "being deleted"
            animation: 'genieSuck 0.7s forwards ease-in-out'
          }}
        >
          <style>{`
                  @keyframes genieSuck {
                      0% {
                          transform: translate(0, 0) scale(1) rotate(0deg);
                          opacity: 0.9;
                          border-radius: 6px;
                      }
                      40% {
                           /* Suck phase 1: Distort towards target */
                           transform: translate(${genieState.targetRect.left - genieState.rect.left}px, ${genieState.targetRect.top - genieState.rect.top - 50}px) scale(0.6, 1.2) rotate(45deg);
                           opacity: 0.8;
                      }
                      100% {
                          /* Final phase: Into the 'blackhole' */
                          transform: translate(${genieState.targetRect.left - genieState.rect.left + 15}px, ${genieState.targetRect.top - genieState.rect.top + 15}px) scale(0) rotate(720deg);
                          opacity: 0;
                          border-radius: 50%;
                      }
                  }
               `}</style>
        </div>
      )}

      {/* SNAP INDICATOR (Moved here for better layering if needed, keeping separate for now) */}
      {/* ... previous context menu ... */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-[#252525] border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg py-1 z-[100] min-w-[140px] animate-in fade-in zoom-in-95 duration-75"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.type === 'clip' && (
            <>
              <button className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex gap-2" onClick={() => { /* Copy */ setContextMenu(null); }}>
                <Copy size={12} /> Copy
              </button>
              <button className="w-full text-left px-4 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex gap-2" onClick={() => { if (contextMenu.targetId) onSplitClip(contextMenu.targetId, project.currentTime); setContextMenu(null); }}>
                <Scissors size={12} /> Split
              </button>
            </>
          )}
          {contextMenu.type === 'track' && (
            <>
              <button className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex gap-2" onClick={() => { if (contextMenu.targetId) onDeleteTrack(contextMenu.targetId); setContextMenu(null); }}>
                <Trash2 size={12} /> Delete Track
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

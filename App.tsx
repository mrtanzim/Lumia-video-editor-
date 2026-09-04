
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, TrackType, Clip, Track, UserSettings, ExportRecord } from './types';
import { Timeline } from './components/Timeline';
import { VideoPlayer } from './components/VideoPlayer';
import { CanvasCompositor } from './components/CanvasCompositor';
import { TransformOverlay } from './components/TransformOverlay';
import { AssetLibrary } from './components/AssetLibrary';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ToolsSidebar } from './components/ToolsSidebar';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { AIAssistant } from './components/AIAssistant';
import { ProfileMenu } from './components/ProfileMenu';
import { SettingsModal } from './components/SettingsModal';
import { ExportHistoryModal } from './components/ExportHistoryModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { storageService, DEFAULT_SETTINGS } from './services/storageService';
import { projectStore } from './services/projectStore';
import { autosaveProject, loadAutosavedProject } from './services/autosaveService';
import { importFiles } from './services/mediaImporter';
import { exportProject } from './services/exportService';
import {
  Download, Share2, Sparkles, Command, Undo2, Redo2, User, Keyboard, Trash2, Copy, Scissors,
  ZoomIn, ZoomOut, Maximize, MousePointer2, MoreVertical, Check, Upload, Settings,
  FilePlus, FolderOpen, Save, X, ChevronRight, Clipboard, ClipboardCopy, Scissors as CutIcon,
  Grid, Trash, Lock, Eye, LogOut, RefreshCw, Monitor, Layers, Music, Activity,
  Type, Palette, Layout, HelpCircle, Film, Flag, Mic2, MoveHorizontal, MoveVertical,
  AlignLeft, PlayCircle, StopCircle, SkipForward, SkipBack, Aperture, Sun, Moon,
  BookOpen, MessageSquare, Info, Github, Youtube, Anchor, Focus, Sliders, VolumeX
} from 'lucide-react';
import { geminiService } from './services/geminiService';

// Menu Categories Definition
const MENU_CATEGORIES = [
  'File', 'Edit', 'View', 'Clip', 'Effects', 'Sequence',
  'Markers', 'Text', 'Audio', 'Color', 'Window', 'Help'
];

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

  ],
  markers: []
};

// --- Recursive Menu Component ---
interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  icon?: React.ReactNode;
  divider?: boolean;
  disabled?: boolean;
  submenu?: MenuItem[];
  isHeader?: boolean;
}

const MenuList: React.FC<{ items: MenuItem[]; parentRef?: React.RefObject<HTMLDivElement> }> = ({ items }) => {
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);

  return (
    <div className="py-1 min-w-[240px] max-w-[320px] bg-[#1a1a1a]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group/menuitem"
          onMouseEnter={() => setActiveSubmenu(idx)}
          onMouseLeave={() => setActiveSubmenu(null)}
        >
          {item.divider ? (
            <div className="h-px bg-white/10 my-1 mx-0" />
          ) : item.isHeader ? (
            <div className="px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider select-none">
              {item.label}
            </div>
          ) : (
            <button
              disabled={item.disabled}
              onClick={(e) => {
                if (item.submenu) return;
                item.action?.();
              }}
              className={`w-full text-left px-4 py-1.5 text-[13px] flex items-center justify-between transition-colors
                    ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10 text-gray-200'}
                    ${activeSubmenu === idx ? 'bg-white/10' : ''}
                `}
            >
              <div className="flex items-center gap-2.5">
                {/* Placeholder for icon alignment if needed, keeping it minimal for pro look */}
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-4">
                {item.shortcut && <span className="text-[11px] text-gray-500 font-mono">{item.shortcut}</span>}
                {item.submenu && <ChevronRight size={12} className="text-gray-500" />}
              </div>
            </button>
          )}

          {/* Submenu Recursion */}
          {item.submenu && activeSubmenu === idx && (
            <div className="absolute left-full top-0 -ml-1 pl-1 z-50 animate-in fade-in zoom-in-95 duration-75">
              <MenuList items={item.submenu} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const MenuDropdown: React.FC<{
  label: string;
  items?: MenuItem[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onHover: () => void;
}> = ({ label, items, isOpen, onOpen, onClose, onHover }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div
      className="relative"
      onMouseEnter={onHover}
      ref={menuRef}
    >
      <button
        onClick={onOpen}
        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors select-none
          ${isOpen
            ? 'bg-[#1a1a1a] text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
          }`}
      >
        {label}
      </button>

      {isOpen && items && (
        <div className="absolute top-full left-0 mt-1 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          <MenuList items={items} />
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  // --- STATE ---
  const [project, setProject] = useState<Project>(INITIAL_PROJECT);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);

  // History & Clipboard
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<Clip[] | null>(null);

  // UI State
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Tools & Library State
  const [activeTool, setActiveTool] = useState('select');
  const [assetTab, setAssetTab] = useState<'media' | 'ai' | 'library' | 'transitions' | 'effects' | 'templates'>('media');

  const [zoomLevel, setZoomLevel] = useState(0.35); // Default zoomed out more (approx 1/3)
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [audioAssets, setAudioAssets] = useState<any[]>([]);
  const [librarySubTab, setLibrarySubTab] = useState<'video' | 'image' | 'graphics'>('video');
  const [mediaSubTab, setMediaSubTab] = useState<'video' | 'audio' | 'image'>('video');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]);
  const [deleteMode, setDeleteMode] = useState<'lift' | 'ripple'>('lift');
  const [useCanvasCompositor, setUseCanvasCompositor] = useState(true);
  const [importedMedia, setImportedMedia] = useState<any[]>([]);
  const [showProjectSettings, setShowProjectSettings] = useState(false);

  // Floating Toolbar State
  const [activeTools, setActiveTools] = useState<string[]>([
    'undo', 'redo', 'split', 'delete', 'duplicate', 'zoom_out', 'zoom_in'
  ]);
  const [showToolMenu, setShowToolMenu] = useState(true); // Default to true
  const [toolbarOffset, setToolbarOffset] = useState({ x: 0, y: 0 }); // Offset from initial centered position

  // Refs
  const toolbarDragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);
  const dragDropZoneRef = useRef<HTMLDivElement>(null);

  const fetchAssets = useCallback(async () => {
    try {
      const assets = await storageService.getAssets();
      console.log("Fetched assets from storage:", assets);

      const safeAssets = Array.isArray(assets) ? assets : [];

      const media = safeAssets.filter((a: any) =>
        (a.type && (a.type.startsWith('video') || a.type.startsWith('image')))
      );
      const audio = safeAssets.filter((a: any) => a.type && a.type.startsWith('audio'));

      setMediaAssets(media.map((a: any) => ({
        id: a.id,
        type: a.type && (a.type.startsWith('image') || a.type === 'image') ? 'image' : 'video',
        name: a.filename || a.name || 'Untitled',
        src: a.path || a.src,
        duration: a.duration || '00:00'
      })));

      setAudioAssets(audio.map((a: any) => ({
        id: a.id,
        type: 'audio',
        name: a.filename || a.name || 'Untitled',
        genre: 'Uploaded',
        duration: a.duration || '00:00',
        src: a.path || a.src
      })));
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      try {
        const imported = await importFiles(files);
        setImportedMedia(prev => [...prev, ...imported]);
        if (assetTab !== 'media') setAssetTab('media');
        if (files[0].type.startsWith('audio')) setMediaSubTab('audio');
        else if (files[0].type.startsWith('image')) setMediaSubTab('image');
        else if (files[0].type.startsWith('video')) setMediaSubTab('video');
      } catch (err) {
        console.error("Import failed", err);
        alert("Import failed. Please try again.");
      }
    }
  }, [assetTab, mediaSubTab]);

  // --- INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
      const loadedSettings = await storageService.getSettings();
      const loadedHistory = await storageService.getExportHistory();
      setSettings(loadedSettings);
      setExportHistory(loadedHistory);

      // Load Auto-Saved Project
      let savedProject = await projectStore.loadAutosave();
      if (!savedProject) {
        const raw = localStorage.getItem('lumina_autosave');
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.tracks) savedProject = parsed;
          } catch {
            // ignore
          }
        }
      }
      if (savedProject && savedProject.tracks) {
        setProject(savedProject);
        setHistory([savedProject]);
        setHistoryIndex(0);
      } else {
        setHistory([INITIAL_PROJECT]);
        setHistoryIndex(0);
      }

      // Apply Theme
      if (loadedSettings.appearance.theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
      setHistoryIndex(0);
      fetchAssets();
    };

    initApp();
  }, [fetchAssets]);

  // --- AUTO SAVE ---
  useEffect(() => {
    if (!settings.projectDefaults.autoSave) return;
    const interval = setInterval(() => {
      autosaveProject(project, 0);
    }, 120000);
    return () => clearInterval(interval);
  }, [project, settings.projectDefaults.autoSave]);

  // Autosave on project change (debounced)
  useEffect(() => {
    autosaveProject(project, 2000);
  }, [project]);

  // --- HISTORY MANAGEMENT ---
  const addToHistory = (newProject: Project) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newProject);

    // Limit history size
    if (newHistory.length > 50) newHistory.shift();

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setProject(newProject);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setProject(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setProject(history[historyIndex + 1]);
    }
  };

  // --- PROJECT ACTIONS ---
  const handleNewProject = () => {
    if (confirm("Create new project? Unsaved changes will be lost.")) {
      const newProj = { ...INITIAL_PROJECT, id: `proj_${Date.now()}` };
      addToHistory(newProj);
    }
  };

  const handleOpenProject = () => {
    projectInputRef.current?.click();
  };

  const handleProjectFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.id && json.tracks) {
          addToHistory(json);
        } else {
          alert("Invalid project file format");
        }
      } catch (err) {
        alert("Failed to parse project file");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveProject = () => {
    localStorage.setItem(`project_${project.id}`, JSON.stringify(project));
    localStorage.setItem('lumina_autosave', JSON.stringify(project));
    alert("Project saved locally!");
  };

  const handleSaveAs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", project.name + ".lumina");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- EDIT ACTIONS ---
  const getSelectedClip = (): { clip: Clip, trackIndex: number } | null => {
    if (!selectedClipId) return null;
    for (let i = 0; i < project.tracks.length; i++) {
      const clip = project.tracks[i].clips.find(c => c.id === selectedClipId);
      if (clip) return { clip, trackIndex: i };
    }
    return null;
  };

  const handleCut = () => {
    const selection = getSelectedClip();
    if (selection) {
      setClipboard([selection.clip]);
      handleDeleteClip(selection.clip.id);
    }
  };

  const handleCopy = () => {
    const selection = getSelectedClip();
    if (selection) {
      setClipboard([selection.clip]);
    }
  };

  const handlePaste = () => {
    if (!clipboard || clipboard.length === 0) return;

    const newClips = clipboard.map(clip => ({
      ...clip,
      id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: project.currentTime,
      trackId: clip.trackId
    }));

    const newProject = { ...project };
    newClips.forEach(clip => {
      let track = newProject.tracks.find(t => t.id === clip.trackId);
      if (!track) track = newProject.tracks[0];
      if (track) {
        track.clips.push(clip);
      }
    });

    updateProjectState(newProject);
  };

  const handleSelectAll = () => {
    const firstClip = project.tracks.flatMap(t => t.clips)[0];
    if (firstClip) setSelectedClipId(firstClip.id);
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // File
      if (ctrl && e.key === 'n') { e.preventDefault(); handleNewProject(); }
      if (ctrl && e.key === 'o') { e.preventDefault(); handleOpenProject(); }
      if (ctrl && e.key === 's') { e.preventDefault(); shift ? handleSaveAs() : handleSaveProject(); }
      if (ctrl && e.key === 'e') { e.preventDefault(); handleExport(); }
      if (ctrl && e.key === 'i') { e.preventDefault(); handleImportClick(); }

      // Edit
      if (ctrl && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if (ctrl && (e.key === 'y' || (shift && e.key === 'z'))) { e.preventDefault(); handleRedo(); }
      if (ctrl && e.key === 'x') { e.preventDefault(); handleCut(); }
      if (ctrl && e.key === 'c') { e.preventDefault(); handleCopy(); }
      if (ctrl && e.key === 'v') { e.preventDefault(); handlePaste(); }
      if (ctrl && e.key === 'd') { e.preventDefault(); handleDuplicateClip(); }
      if (ctrl && e.key === 'a') { e.preventDefault(); handleSelectAll(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipIds.length > 0) {
          e.preventDefault();
          const toDelete = [...selectedClipIds];
          setSelectedClipIds([]);
          toDelete.forEach(id => handleDeleteClip(id));
        } else if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip(selectedClipId);
          setSelectedClipId(undefined);
        }
      }

      // Playback
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, history, historyIndex, clipboard, selectedClipId]);


  // --- HELPERS ---
  const calculateProjectDuration = (tracks: Track[]): number => {
    let maxDuration = 0;
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        const end = clip.startTime + clip.duration;
        if (end > maxDuration) maxDuration = end;
      });
    });
    // Ensure minimum duration (e.g. 30s or previous duration if meaningful)
    return Math.max(maxDuration + 5, 30); // Add 5s buffer
  };

  const updateProjectState = (newProject: Project) => {
    // Auto-recalculate duration
    const newDuration = calculateProjectDuration(newProject.tracks);
    const finalProject = { ...newProject, duration: newDuration };

    addToHistory(finalProject);
  };

  // ... (Existing Playback Loop, Toolbar Drag Logic ...)
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (toolbarDragRef.current) {
        const dx = e.clientX - toolbarDragRef.current.startX;
        const dy = e.clientY - toolbarDragRef.current.startY;
        setToolbarOffset({
          x: toolbarDragRef.current.initialX + dx,
          y: toolbarDragRef.current.initialY + dy
        });
      }
    };
    const handleMouseUp = () => { toolbarDragRef.current = null; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    toolbarDragRef.current = {
      startX: e.clientX, startY: e.clientY,
      initialX: toolbarOffset.x, initialY: toolbarOffset.y
    };
  };

  const handleSeek = (time: number) => {
    setProject(prev => ({ ...prev, currentTime: Math.min(Math.max(0, time), prev.duration) }));
  };

  const handleTogglePlay = () => setIsPlaying(!isPlaying);
  const handleClipSelect = (clip: Clip) => setSelectedClipId(clip.id);

  // --- CLIP OPERATIONS (Updated to use History) ---
  const handleClipMove = (clipId: string, newStartTime: number) => {
    const newProject = {
      ...project,
      tracks: project.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId ? { ...clip, startTime: newStartTime } : clip
        )
      }))
    };
    updateProjectState(newProject);
  };

  const selectedClip = project.tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId) || null;

  const handleUpdateClip = (updates: Partial<Clip>) => {
    if (!selectedClipId) return;
    const newProject = {
      ...project,
      tracks: project.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === selectedClipId ? {
            ...clip, ...updates,
            properties: { ...clip.properties, ...updates.properties }
          } : clip
        )
      }))
    };
    updateProjectState(newProject);
  };

  const handleSplitClip = (clipId: string, splitTime: number) => {
    const prev = project;
    const newTracks = prev.tracks.map(track => {
      const clipIndex = track.clips.findIndex(c => c.id === clipId);
      if (clipIndex === -1) return track;
      const clip = track.clips[clipIndex];
      if (splitTime <= clip.startTime + 0.1 || splitTime >= clip.startTime + clip.duration - 0.1) return track;
      const relativeSplit = splitTime - clip.startTime;
      const firstPart: Clip = { ...clip, duration: relativeSplit, trimEnd: clip.trimStart + relativeSplit };
      const secondPart: Clip = { ...clip, id: clip.id + '_split_' + Date.now(), startTime: splitTime, duration: clip.duration - relativeSplit, trimStart: clip.trimStart + relativeSplit, name: clip.name + ' (2)' };
      const newClips = [...track.clips];
      newClips.splice(clipIndex, 1, firstPart, secondPart);
      return { ...track, clips: newClips };
    });
    updateProjectState({ ...prev, tracks: newTracks });
    setActiveTool('select');
  };

  const handleToolbarSplit = () => {
    if (selectedClipId) handleSplitClip(selectedClipId, project.currentTime);
    else {
      const clipUnderPlayhead = project.tracks.flatMap(t => t.clips).find(c => project.currentTime > c.startTime && project.currentTime < c.startTime + c.duration);
      if (clipUnderPlayhead) handleSplitClip(clipUnderPlayhead.id, project.currentTime);
    }
  };

  const handleDeleteClip = (clipId: string) => {
    const newProject = {
      ...project,
      tracks: project.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(c => c.id !== clipId)
      }))
    };
    updateProjectState(newProject);
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
    const newProject = {
      ...project,
      tracks: project.tracks.map(track =>
        track.id === selectedClip.trackId ? { ...track, clips: [...track.clips, newClip] } : track
      )
    };
    updateProjectState(newProject);
  };

  const handleAddClip = (type: 'video' | 'audio' | 'text' | 'image', src?: string, duration?: number) => {
    const newClip: Clip = {
      id: `c_${Date.now()}`,
      trackId: '',
      name: type === 'text' ? 'New Text' : type === 'audio' ? 'New Audio' : type === 'image' ? 'New Graphic' : 'New Clip',
      type: type as TrackType,
      startTime: project.currentTime,
      duration: duration || 5,
      trimStart: 0,
      trimEnd: 0,
      src: src || '',
      color: type === 'video' ? '#3b82f6' : type === 'audio' ? '#10b981' : type === 'image' ? '#f59e0b' : '#a855f7',
      properties: type === 'text' ? { text: 'New Text', fontSize: 60, rotation: 0 } : { opacity: 1, scale: 1, rotation: 0, volume: type === 'audio' || type === 'video' ? 1 : undefined }
    };

    const newTracks = [...project.tracks];
    let targetTrack = newTracks.find(t => t.type === type && !t.isLocked);
    if (!targetTrack) {
      targetTrack = { id: `t_${Date.now()}`, name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track`, type: type as TrackType, clips: [] };
      newTracks.push(targetTrack);
    }
    newClip.trackId = targetTrack.id;
    targetTrack.clips.push(newClip);

    updateProjectState({ ...project, tracks: newTracks });
  };

  const handleAddTrack = (type: 'video' | 'audio' | 'text') => {
    const typeCount = project.tracks.filter(t => t.type === type).length;
    const newTrack: Track = {
      id: `t_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${typeCount + 1}`,
      type: type as TrackType,
      clips: [],
      isMuted: false,
      isLocked: false,
      isSolo: false
    };
    updateProjectState({ ...project, tracks: [...project.tracks, newTrack] });
  };

  const handleToggleSolo = (trackId: string) => {
    const newTracks = project.tracks.map(t => {
      if (t.id === trackId) return { ...t, isSolo: !t.isSolo };
      return t;
    });
    updateProjectState({ ...project, tracks: newTracks });
  };

  const handleDeleteTrack = (trackId: string) => {
    if (confirm('Are you sure you want to delete this track?')) {
      const newTracks = project.tracks.filter(t => t.id !== trackId);
      updateProjectState({ ...project, tracks: newTracks });
    }
  };

  const handleMarkerAdd = () => {
    const newMarker = {
      id: `m_${Date.now()}`,
      time: project.currentTime,
      label: 'Mark',
      color: '#f59e0b'
    };
    const newMarkers = [...(project.markers || []), newMarker];
    updateProjectState({ ...project, markers: newMarkers });
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploadProgress(0);
        // Ensure panel is open so they see context, but global indicator handles background awareness
        if (assetTab !== 'media') setAssetTab('media');

        const result = await storageService.uploadAsset(file, (percent) => {
          setUploadProgress(percent);
        });

        if (result) {
          // Force fetch to ensure UI updates with new asset
          await fetchAssets();

          // Switch to correct sub-tab so user sees the new asset in the hub
          if (file.type.startsWith('audio')) setMediaSubTab('audio');
          else if (file.type.startsWith('image')) setMediaSubTab('image');
          else if (file.type.startsWith('video')) setMediaSubTab('video');
        }
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload file. Please try again.");
      } finally {
        // Keep progress at 100 for a moment for visual feedback
        setTimeout(() => setUploadProgress(null), 1500);
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleAutoEdit = async () => { /* ... Existing AI Logic ... */ };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) {
        alert('No preview canvas found. Switch to Canvas Compositor mode to export.');
        setIsExporting(false);
        return;
      }
      const blob = await exportProject(project, canvas, {
        format: settings.exportDefaults.format === 'mov' ? 'webm' : settings.exportDefaults.format,
        resolution: { width: project.width, height: project.height },
        fps: project.fps,
        quality: settings.exportDefaults.quality,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\.[^.]+$/, '')}_final.${settings.exportDefaults.format}`;
      a.click();
      URL.revokeObjectURL(url);
      const record: ExportRecord = {
        id: `exp_${Date.now()}`,
        filename: `${project.name.replace('.mp4', '')}_final.${settings.exportDefaults.format}`,
        format: settings.exportDefaults.format,
        resolution: `${project.width}x${project.height}`,
        size: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
        date: Date.now(),
        duration: new Date(project.duration * 1000).toISOString().substr(11, 8),
        status: 'success',
      };
      storageService.addExportRecord(record);
      setExportHistory(prev => [record, ...prev]);
      setShowHistory(true);
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed. Try again or use a different browser.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearHistory = () => { storageService.clearHistory(); setExportHistory([]); };
  const handleUpdateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    if (newSettings.appearance.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else if (newSettings.appearance.theme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };
  const toggleTheme = () => {
    const newTheme = settings.appearance.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ ...settings, appearance: { ...settings.appearance, theme: newTheme } });
  };

  // --- TOOLBAR HANDLER ---
  const handleToolChange = (toolId: string) => {
    if (toolId === 'import') {
      setAssetTab('media'); // Switch to uploads panel
      handleImportClick();
      return;
    }

    if (toolId === 'library') {
      setActiveTool(toolId);
      setAssetTab('library');
      return;
    }

    if (toolId === 'ai') {
      setActiveTool(toolId);
      setAssetTab('ai');
      return;
    }

    if (toolId === 'transitions') {
      setActiveTool(toolId);
      setAssetTab('transitions');
      return;
    }

    if (toolId === 'effects') {
      setActiveTool(toolId);
      setAssetTab('effects');
    } else {
      setActiveTool(toolId);
      if (toolId === 'select') {
        setAssetTab('media');
      }
    }
  };

  // Handle Asset Tab Change
  const handleAssetTabChange = (tab: 'media' | 'ai' | 'library' | 'transitions' | 'effects' | 'templates') => {
    setAssetTab(tab);
    // Sync sidebar if user manually changes tabs
    if (tab === 'library' && activeTool !== 'library') setActiveTool('library');
    if (tab === 'ai' && activeTool !== 'ai') setActiveTool('ai');
    if (tab === 'transitions' && activeTool !== 'transitions') setActiveTool('transitions');
    if (tab === 'effects' && activeTool !== 'effects') setActiveTool('effects');
    if (tab === 'templates' && activeTool !== 'templates') setActiveTool('templates');
    if (tab === 'media' && (activeTool === 'library' || activeTool === 'transitions' || activeTool === 'effects' || activeTool === 'templates')) setActiveTool('select');
  };

  // --- MENU DATA DEFINITIONS ---

  const p = (name: string) => () => { console.log(`Action: ${name}`); alert(`Feature: ${name} - Coming soon!`); };

  const fileMenu: MenuItem[] = [
    { label: 'Project Management', isHeader: true },
    { label: 'New Project', icon: <FilePlus size={14} />, shortcut: 'Ctrl+N', action: handleNewProject },
    { label: 'Open Project', icon: <FolderOpen size={14} />, shortcut: 'Ctrl+O', action: handleOpenProject },
    { label: 'Save Project', icon: <Save size={14} />, shortcut: 'Ctrl+S', action: handleSaveProject },
    { label: 'Save As...', icon: <Save size={14} />, shortcut: 'Shift+Ctrl+S', action: handleSaveAs },
    { divider: true, label: '' },
    { label: 'Import/Export', isHeader: true },
    { label: 'Import Media', icon: <Upload size={14} />, shortcut: 'Ctrl+I', action: handleImportClick },
    { label: 'Export Video', icon: <Download size={14} />, shortcut: 'Ctrl+E', action: handleExport },
    { divider: true, label: '' },
    { label: 'App Actions', isHeader: true },
    { label: 'Settings', icon: <Settings size={14} />, action: () => setShowSettings(true) },
    { label: 'Exit', icon: <LogOut size={14} />, shortcut: 'Ctrl+Q', action: () => window.close() },
  ];

  const editMenu: MenuItem[] = [
    { label: 'Undo/Redo', isHeader: true },
    { label: 'Undo', icon: <Undo2 size={14} />, shortcut: 'Ctrl+Z', action: handleUndo, disabled: historyIndex <= 0 },
    { label: 'Redo', icon: <Redo2 size={14} />, shortcut: 'Ctrl+Y', action: handleRedo, disabled: historyIndex >= history.length - 1 },
    { divider: true, label: '' },
    { label: 'Clipboard', isHeader: true },
    { label: 'Cut', icon: <CutIcon size={14} />, shortcut: 'Ctrl+X', action: handleCut, disabled: !selectedClipId },
    { label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', action: handleCopy, disabled: !selectedClipId },
    { label: 'Paste', icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', action: handlePaste, disabled: !clipboard },
    { label: 'Duplicate', icon: <ClipboardCopy size={14} />, shortcut: 'Ctrl+D', action: handleDuplicateClip, disabled: !selectedClipId },
    { divider: true, label: '' },
    { label: 'Timeline', isHeader: true },
    { label: 'Delete', icon: <Trash size={14} />, shortcut: 'Del', action: () => selectedClipId && handleDeleteClip(selectedClipId), disabled: !selectedClipId },
    { label: 'Select All', icon: <Grid size={14} />, shortcut: 'Ctrl+A', action: handleSelectAll },
  ];

  const viewMenu: MenuItem[] = [
    { label: 'Timeline Display', isHeader: true },
    { label: 'Zoom In', shortcut: 'Ctrl++', action: () => setZoomLevel(z => Math.min(5, z + 0.2)), icon: <ZoomIn size={14} /> },
    { label: 'Zoom Out', shortcut: 'Ctrl+-', action: () => setZoomLevel(z => Math.max(0.1, z - 0.2)), icon: <ZoomOut size={14} /> },
    { label: 'Fit to Timeline', shortcut: 'Ctrl+0', action: () => setZoomLevel(1), icon: <Maximize size={14} /> },
    { label: 'Zoom to Selection', shortcut: 'Alt+Z', action: p('Zoom to Selection'), icon: <Focus size={14} /> },
    { divider: true, label: '' },
    { label: 'Snap to Grid', shortcut: 'S', action: p('Snap to Grid'), icon: <Anchor size={14} /> },
    { label: 'Show Grid Lines', action: p('Show Grid Lines'), icon: <Grid size={14} /> },
    { divider: true, label: '' },
    { label: 'Preview Window', isHeader: true },
    { label: 'Fullscreen Preview', shortcut: 'F11', action: p('Fullscreen'), icon: <Monitor size={14} /> },
    {
      label: 'Aspect Ratio Guides', submenu: [
        { label: '16:9 (Widescreen)', action: p('16:9') },
        { label: '4:3 (Standard)', action: p('4:3') },
        { label: '1:1 (Square)', action: p('1:1') },
        { label: '9:16 (Vertical)', action: p('9:16') },
      ]
    },
    { label: 'Show Resolution', action: p('Show Resolution') },
    { divider: true, label: '' },
    { label: 'Panels', isHeader: true },
    { label: 'Minimize All Panels', action: p('Minimize All'), icon: <Layout size={14} /> },
    { divider: true, label: '' },
    { label: 'Quality', isHeader: true },
    {
      label: 'Preview Quality', submenu: [
        { label: 'Full', action: p('Quality Full') },
        { label: 'Half', action: p('Quality Half') },
        { label: 'Quarter', action: p('Quality Quarter') },
      ]
    },
  ];

  const clipMenu: MenuItem[] = [
    { label: 'Speed & Duration', isHeader: true },
    { label: 'Speed/Duration...', shortcut: 'Ctrl+R', action: p('Speed Duration'), icon: <Activity size={14} /> },
    { label: 'Reverse Clip', action: p('Reverse Clip'), icon: <RefreshCw size={14} /> },
    { label: 'Freeze Frame', action: p('Freeze Frame') },
    { divider: true, label: '' },
    { label: 'Transform', isHeader: true },
    { label: 'Rotate 90° CW', action: p('Rotate CW') },
    { label: 'Rotate 90° CCW', action: p('Rotate CCW') },
    { label: 'Flip Horizontal', action: p('Flip H') },
    { label: 'Flip Vertical', action: p('Flip V') },
    { divider: true, label: '' },
    { label: 'Audio', isHeader: true },
    { label: 'Detach Audio', action: p('Detach Audio') },
    { label: 'Audio Gain', action: p('Audio Gain') },
    { divider: true, label: '' },
    { label: 'Properties', isHeader: true },
    { label: 'Clip Properties', shortcut: 'Ctrl+Shift+P', action: p('Clip Properties') },
    { label: 'Rename Clip', shortcut: 'F2', action: p('Rename Clip') },
  ];

  const effectsMenu: MenuItem[] = [
    {
      label: 'Video Effects', submenu: [
        { label: 'Color Correction', action: p('Color Correction') },
        { label: 'Blur & Sharpen', action: p('Blur & Sharpen') },
        { label: 'Distortion', action: p('Distortion') },
        { label: 'Stylize', action: p('Stylize') },
      ]
    },
    {
      label: 'Audio Effects', submenu: [
        { label: 'Noise Reduction', action: p('Noise Reduction') },
        { label: 'Equalizer', action: p('Equalizer') },
        { label: 'Reverb', action: p('Reverb') },
      ]
    },
    { divider: true, label: '' },
    {
      label: 'Transitions', submenu: [
        { label: 'Fade', action: p('Fade') },
        { label: 'Dissolve', action: p('Dissolve') },
        { label: 'Wipe', action: p('Wipe') },
        { label: 'Zoom', action: p('Zoom') },
      ]
    },
    { divider: true, label: '' },
    {
      label: 'Presets', submenu: [
        { label: 'Cinematic Look', action: p('Cinematic') },
        { label: 'Vintage Film', action: p('Vintage') },
        { label: 'Black & White', action: p('B&W') },
      ]
    },
    { divider: true, label: '' },
    { label: 'Remove All Effects', action: p('Remove All Effects') },
  ];

  const sequenceMenu: MenuItem[] = [
    { label: 'Sequence Operations', isHeader: true },
    { label: 'New Sequence', shortcut: 'Ctrl+N', action: handleNewProject, icon: <Film size={14} /> },
    { label: 'Duplicate Sequence', action: p('Duplicate Sequence') },
    { divider: true, label: '' },
    { label: 'Settings', isHeader: true },
    { label: 'Sequence Settings', action: () => setShowProjectSettings(true), icon: <Settings size={14} /> },
    { label: 'Match Sequence to Clip', action: p('Match Sequence') },
    { divider: true, label: '' },
    { label: 'Render', isHeader: true },
    { label: 'Render Entire Sequence', action: handleExport },
    { label: 'Delete Render Files', action: p('Delete Renders') },
  ];

  const markersMenu: MenuItem[] = [
    { label: 'Add/Edit', isHeader: true },
    { label: 'Add Marker', shortcut: 'M', action: p('Add Marker'), icon: <Flag size={14} /> },
    { label: 'Edit Marker', action: p('Edit Marker') },
    { label: 'Delete Marker', action: p('Delete Marker') },
    { divider: true, label: '' },
    { label: 'Navigation', isHeader: true },
    { label: 'Go to Next Marker', shortcut: 'Shift+M', action: p('Next Marker') },
    { label: 'Go to Previous Marker', shortcut: 'Shift+Alt+M', action: p('Prev Marker') },
    { divider: true, label: '' },
    { label: 'Management', isHeader: true },
    { label: 'Clear All Markers', action: p('Clear Markers') },
  ];

  const textMenu: MenuItem[] = [
    { label: 'Text Types', isHeader: true },
    { label: 'Add Text Layer', shortcut: 'Ctrl+T', action: p('Add Text'), icon: <Type size={14} /> },
    { label: 'Add Title', action: p('Add Title') },
    { label: 'Add Lower Third', action: p('Lower Third') },
    { label: 'Add Subtitle', action: p('Add Subtitle') },
    { divider: true, label: '' },
    {
      label: 'Templates', submenu: [
        { label: 'Modern Minimal', action: p('Modern') },
        { label: 'Bold & Colorful', action: p('Bold') },
        { label: 'Elegant Serif', action: p('Elegant') },
      ]
    },
    { divider: true, label: '' },
    {
      label: 'Animation', submenu: [
        { label: 'Fade In', action: p('Fade In') },
        { label: 'Typewriter', action: p('Typewriter') },
        { label: 'Scroll/Crawl', action: p('Scroll') },
      ]
    },
  ];

  const audioMenu: MenuItem[] = [
    { label: 'Mixer', isHeader: true },
    { label: 'Audio Mixer', shortcut: 'Ctrl+Shift+M', action: p('Mixer'), icon: <Sliders size={14} /> },
    { label: 'Master Volume', action: p('Master Vol') },
    { divider: true, label: '' },
    { label: 'Track Operations', isHeader: true },
    { label: 'Add Audio Track', action: p('Add Audio Track') },
    { label: 'Mute Track', shortcut: 'M', action: p('Mute Track'), icon: <VolumeX size={14} /> },
    { divider: true, label: '' },
    { label: 'Processing', isHeader: true },
    { label: 'Normalize Audio', action: p('Normalize') },
    { label: 'Remove Background Noise', action: p('Remove Noise') },
    { label: 'Fade In/Out', action: p('Audio Fade') },
  ];

  const colorMenu: MenuItem[] = [
    { label: 'Basic Correction', isHeader: true },
    { label: 'White Balance', action: p('White Balance') },
    { label: 'Exposure', action: p('Exposure') },
    { label: 'Contrast', action: p('Contrast') },
    { divider: true, label: '' },
    { label: 'Grading', isHeader: true },
    { label: 'Color Wheels', action: p('Color Wheels'), icon: <Aperture size={14} /> },
    { label: 'Curves', action: p('Curves') },
    { divider: true, label: '' },
    {
      label: 'Presets', submenu: [
        { label: 'Teal & Orange', action: p('Teal Orange') },
        { label: 'Film Noir', action: p('Film Noir') },
        { label: 'Warm Vintage', action: p('Warm Vintage') },
      ]
    },
  ];

  const windowMenu: MenuItem[] = [
    { label: 'Layout Management', isHeader: true },
    { label: 'Save Current Layout', action: p('Save Layout') },
    { label: 'Reset to Default', action: p('Reset Layout') },
    {
      label: 'Layout Presets', submenu: [
        { label: 'Editing', action: p('Editing Layout') },
        { label: 'Color Grading', action: p('Color Layout') },
        { label: 'Audio Mixing', action: p('Audio Layout') },
      ]
    },
    { divider: true, label: '' },
    { label: 'Display', isHeader: true },
    {
      label: 'Theme', submenu: [
        { label: 'Dark Mode', action: p('Dark Mode'), icon: <Moon size={12} /> },
        { label: 'Light Mode', action: p('Light Mode'), icon: <Sun size={12} /> },
        { label: 'Auto', action: p('Auto Theme') },
      ]
    },
  ];

  const helpMenu: MenuItem[] = [
    { label: 'Getting Started', isHeader: true },
    { label: 'Welcome Tour', action: p('Welcome Tour'), icon: <Flag size={14} /> },
    { label: 'Quick Start Guide', action: p('Quick Start'), icon: <BookOpen size={14} /> },
    { divider: true, label: '' },
    { label: 'Documentation', isHeader: true },
    { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+/', action: () => setShowShortcuts(true), icon: <Keyboard size={14} /> },
    { label: 'Video Tutorials', action: p('Tutorials'), icon: <Youtube size={14} /> },
    { divider: true, label: '' },
    { label: 'Support', isHeader: true },
    { label: 'Report Bug', action: p('Report Bug') },
    { label: 'Contact Support', action: p('Contact Support') },
    { divider: true, label: '' },
    { label: 'About Lumina', action: p('About'), icon: <Info size={14} /> },
  ];

  const getMenuForCategory = (cat: string) => {
    switch (cat) {
      case 'File': return fileMenu;
      case 'Edit': return editMenu;
      case 'View': return viewMenu;
      case 'Clip': return clipMenu;
      case 'Effects': return effectsMenu;
      case 'Sequence': return sequenceMenu;
      case 'Markers': return markersMenu;
      case 'Text': return textMenu;
      case 'Audio': return audioMenu;
      case 'Color': return colorMenu;
      case 'Window': return windowMenu;
      case 'Help': return helpMenu;
      default: return undefined;
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-[#0f0f0f] transition-colors duration-300 font-sans`}>

      {/* --- HEADER --- */}
      <header className="h-14 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0 z-30">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            <Sparkles className="text-indigo-600" fill="currentColor" size={20} />
            Lumina
          </div>

          {/* Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-6">
            {MENU_CATEGORIES.map((category) => (
              <MenuDropdown
                key={category}
                label={category}
                items={getMenuForCategory(category)}
                isOpen={activeMenu === category}
                onOpen={() => setActiveMenu(activeMenu === category ? null : category)}
                onClose={() => setActiveMenu(null)}
                onHover={() => activeMenu && setActiveMenu(category)}
              />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-lg p-1 flex items-center text-xs font-medium border border-gray-200 dark:border-gray-800">
            <span className="px-2 text-gray-500">Project:</span>
            <span className="text-gray-800 dark:text-gray-200 truncate max-w-[150px]">{project.name}</span>
          </div>

          {/* WHITE EXPORT BUTTON IN LIGHT MODE */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 dark:bg-indigo-600 dark:text-white dark:border-transparent dark:hover:bg-indigo-700 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm disabled:opacity-70"
          >
            {isExporting ? <div className="animate-spin h-3 w-3 border-b-2 border-current rounded-full"></div> : <Share2 size={14} />}
            Export
          </button>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>

          {/* Global Upload Progress Indicator */}
          {uploadProgress !== null && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">Uploading {uploadProgress}%</span>
            </div>
          )}

          <ProfileMenu
            onOpenSettings={() => setShowSettings(true)}
            onOpenHistory={() => setShowHistory(true)}
            onOpenShortcuts={() => setShowShortcuts(true)}
            onToggleTheme={toggleTheme}
            currentTheme={settings.appearance.theme}
          />
        </div>
      </header>

      {/* --- MAIN WORKSPACE --- */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT BAR: Tools */}
        <ToolsSidebar activeTool={activeTool} onToolChange={handleToolChange} />

        {/* LEFT PANEL: Asset Library */}
        <div className="w-[310px] md:w-[370px] shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] z-10 flex flex-col transition-colors duration-300">
          <AssetLibrary
            activeTab={assetTab}
            onTabChange={handleAssetTabChange}
            onAddClip={handleAddClip}
            onUpdateClip={handleUpdateClip}
            selectedClip={selectedClip || null}
            onAutoEdit={handleAutoEdit}
            mediaAssets={mediaAssets}
            audioAssets={audioAssets}
            onImportRequested={handleImportClick}
            librarySubTab={librarySubTab}
            setLibrarySubTab={setLibrarySubTab}
            mediaSubTab={mediaSubTab}
            setMediaSubTab={setMediaSubTab}
            uploadProgress={uploadProgress}
            project={project}
            onApplyTemplate={(template) => {
              if (!template) return;
              alert(`Template "${template.name}" applied! Slots: ${template.slots.join(', ')}. (Demo)`);
            }}
            onSaveAsTemplate={() => {
              alert('Project saved as template! (Demo)');
            }}
          />
        </div>

        {/* CENTER: Player */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-100 dark:bg-[#050505] relative z-0">
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            {useCanvasCompositor ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <CanvasCompositor
                  project={project}
                  isPlaying={isPlaying}
                  playbackSpeed={1}
                  volume={volume}
                  isMuted={isMuted}
                  selectedClipId={selectedClipId}
                />
                {selectedClip && (
                  <TransformOverlay
                    clip={selectedClip}
                    containerWidth={800}
                    containerHeight={450}
                    projectWidth={project.width}
                    projectHeight={project.height}
                    onTransformChange={(updates) => handleUpdateClip({ properties: { ...selectedClip.properties, ...updates } })}
                  />
                )}
              </div>
            ) : (
              <VideoPlayer
                project={project}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onSeek={handleSeek}
              />
            )}

            {/* Compositor Mode Toggle */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
              <button
                onClick={() => setUseCanvasCompositor(!useCanvasCompositor)}
                className={`text-[10px] font-mono px-2 py-1 rounded border ${useCanvasCompositor ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700'}`}
              >
                {useCanvasCompositor ? 'CANVAS COMPOSITOR' : 'DOM PREVIEW'}
              </button>
            </div>

            {/* Toolbar Toggle */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={() => setShowToolMenu(!showToolMenu)}
                className="bg-black/50 hover:bg-black/70 backdrop-blur text-white p-1.5 rounded-full transition"
              >
                {showToolMenu ? <Check size={14} /> : <MoreVertical size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Properties */}
        <div className="w-[310px] md:w-[370px] shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] z-10 flex flex-col transition-colors duration-300">
          <PropertiesPanel
            selectedClip={selectedClip}
            project={project}
            currentTime={project.currentTime}
            onUpdateClip={handleUpdateClip}
            onAutoEdit={handleAutoEdit}
          />
        </div>
      </div>

      {showProjectSettings && (
        <ProjectSettingsModal
          project={project}
          onClose={() => setShowProjectSettings(false)}
          onUpdateProject={handleUpdateClip}
          rippleEdit={deleteMode === 'ripple'}
          onToggleRipple={() => setDeleteMode(prev => prev === 'ripple' ? 'lift' : 'ripple')}
          snapEnabled={true}
          onToggleSnap={() => {}}
        />
      )}

      {/* --- BOTTOM: TIMELINE --- */}
      <div className="h-64 shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] z-20 relative shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors duration-300">
        <Timeline
          project={project}
          onSeek={handleSeek}
          onClipSelect={handleClipSelect}
          selectedClipId={selectedClipId}
          selectedClipIds={selectedClipIds}
          onMultiClipSelect={setSelectedClipIds}
          zoom={zoomLevel}
          activeTool={activeTool}
          onSplitClip={handleSplitClip}
          onClipMove={handleClipMove}
          onAddTrack={handleAddTrack}
          onDeleteTrack={handleDeleteTrack}
          onToggleSolo={handleToggleSolo}
          onAddMarker={handleMarkerAdd}
          onZoomChange={setZoomLevel}
          onDeleteClip={handleDeleteClip}
          deleteMode={deleteMode}
        />

        {/* Timeline Floating Controls */}
        <div className="absolute top-2 right-4 flex items-center gap-2 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-700 p-1 shadow-sm z-30">
          <button onClick={() => setZoomLevel(z => Math.max(0.2, z - 0.2))} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><ZoomOut size={14} /></button>
          <span className="text-[10px] font-mono w-8 text-center text-gray-700 dark:text-gray-300">{Math.round(zoomLevel * 100)}%</span>
          <button onClick={() => setZoomLevel(z => Math.min(3, z + 0.2))} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><ZoomIn size={14} /></button>
        </div>
      </div>

      {/* Floating Toolbar (Draggable - Fixed Position) */}
      {showToolMenu && (
        <div
          className="fixed bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-2 flex gap-1 z-[9999] cursor-move select-none"
          style={{
            left: '50%',
            top: '15%',
            transform: `translate(-50%, 0) translate(${toolbarOffset.x}px, ${toolbarOffset.y}px)`,
            touchAction: 'none'
          }}
          onMouseDown={handleToolbarMouseDown}
        >
          {activeTools.map(toolId => {
            const toolDef = [
              { id: 'undo', icon: <Undo2 size={16} />, label: 'Undo' },
              { id: 'redo', icon: <Redo2 size={16} />, label: 'Redo' },
              { id: 'split', icon: <Scissors size={16} />, label: 'Split Clip' },
              { id: 'delete', icon: <Trash2 size={16} />, label: 'Delete' },
              { id: 'duplicate', icon: <Copy size={16} />, label: 'Duplicate' },
              { id: 'zoom_out', icon: <ZoomOut size={16} />, label: 'Zoom Out' },
              { id: 'zoom_in', icon: <ZoomIn size={16} />, label: 'Zoom In' },
            ].find(t => t.id === toolId);

            if (!toolDef) return null;

            const actionMap: Record<string, () => void> = {
              'undo': handleUndo,
              'redo': handleRedo,
              'split': handleToolbarSplit,
              'delete': () => selectedClipId && handleDeleteClip(selectedClipId),
              'duplicate': handleDuplicateClip,
              'zoom_in': () => setZoomLevel(z => Math.min(5, z + 0.2)),
              'zoom_out': () => setZoomLevel(z => Math.max(0.1, z - 0.2)),
            };

            return (
              <button
                key={toolDef.id}
                onClick={actionMap[toolDef.id]}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition relative group"
                title={toolDef.label}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {toolDef.icon}
              </button>
            )
          })}
        </div>
      )}

      {/* Floating AI Assistant Trigger */}
      <button
        onClick={() => setShowAIAssistant(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white hover:scale-110 transition-transform group"
      >
        <Sparkles className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* --- MODALS & HIDDEN INPUTS --- */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/*,image/*,audio/*"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={projectInputRef}
        className="hidden"
        accept=".json,.lumina"
        onChange={handleProjectFileLoad}
      />

      <AIAssistant isOpen={showAIAssistant} onClose={() => setShowAIAssistant(false)} />

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleUpdateSettings}
      />

      <ExportHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={exportHistory}
        onClearHistory={handleClearHistory}
      />

    </div>
  );
};

export default App;

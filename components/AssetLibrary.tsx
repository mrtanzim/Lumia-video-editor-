
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Image as ImageIcon, Music, Video as VideoIcon, Plus, Search, FileText, LayoutGrid, Upload, Sparkles, Mic, Wand2, Scissors, User, Library, PlayCircle, Type, Film, Zap } from 'lucide-react';
import { elevenLabsService } from '../services/elevenLabsService';
import { storageService } from '../services/storageService';
import { Clip, AdvancedEffect } from '../types';
import { TemplatePanel } from '../components/TemplatePanel';
import { AIToolsPanel } from '../components/AIToolsPanel';

// --- MOCK DATA FOR NATIVE LIBRARY ---
const STOCK_VIDEOS = [
    { id: 'sv1', name: 'Nature Background', duration: '00:10', src: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
    { id: 'sv2', name: 'City Hyperlapse', duration: '00:08', src: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
    { id: 'sv3', name: 'Abstract Tech', duration: '00:12', src: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
    { id: 'sv4', name: 'Green Screen FX', duration: '00:05', src: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
];

const STOCK_IMAGES = [
    { id: 'si1', name: 'Gradient Mesh', src: 'https://picsum.photos/id/10/300/200' },
    { id: 'si2', name: 'Dark Texture', src: 'https://picsum.photos/id/20/300/200' },
    { id: 'si3', name: 'White Studio', src: 'https://picsum.photos/id/30/300/200' },
    { id: 'si4', name: 'Neon Pattern', src: 'https://picsum.photos/id/40/300/200' },
];

const STOCK_TEXT = [
    'Cinematic Title', 'Social Media Handle', 'Breaking News', 'Quote Quote', 'Big Bold', 'Subtitle Standard'
];

const STOCK_AUDIO = [
    { id: 'sa1', name: 'Cinematic Ambient', genre: 'Electronic', duration: '02:30', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'sa2', name: 'Upbeat Corporate', genre: 'Pop', duration: '01:45', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'sa3', name: 'Lo-Fi Chill', genre: 'Lo-Fi', duration: '03:15', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { id: 'sa4', name: 'Aggressive Rock', genre: 'Rock', duration: '02:10', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

const TRANSITION_LIST = [
    { id: 't1', name: 'Cross Dissolve', category: 'Dissolve', icon: <Sparkles size={16} /> },
    { id: 't2', name: 'Dip to Black', category: 'Dissolve', icon: <Sparkles size={16} /> },
    { id: 't3', name: 'Dip to White', category: 'Dissolve', icon: <Sparkles size={16} /> },
    { id: 't4', name: 'Fade to Color', category: 'Dissolve', icon: <Sparkles size={16} /> },
    { id: 't5', name: 'Wipe Right', category: 'Wipe', icon: <LayoutGrid size={16} /> },
    { id: 't6', name: 'Wipe Left', category: 'Wipe', icon: <LayoutGrid size={16} /> },
    { id: 't7', name: 'Wipe Up', category: 'Wipe', icon: <LayoutGrid size={16} /> },
    { id: 't8', name: 'Wipe Down', category: 'Wipe', icon: <LayoutGrid size={16} /> },
    { id: 't9', name: 'Clock Wipe', category: 'Wipe', icon: <LayoutGrid size={16} /> },
    { id: 't10', name: 'Venetian Blinds', category: 'Wipe', icon: <LayoutGrid size={16} /> },
    { id: 't11', name: 'Checkerboard', category: 'Wipe', icon: <LayoutGrid size={16} /> },
    { id: 't12', name: 'Slide Left', category: 'Slide', icon: <LayoutGrid size={16} /> },
    { id: 't13', name: 'Slide Right', category: 'Slide', icon: <LayoutGrid size={16} /> },
    { id: 't14', name: 'Push Up', category: 'Slide', icon: <LayoutGrid size={16} /> },
    { id: 't15', name: 'Push Down', category: 'Slide', icon: <LayoutGrid size={16} /> },
    { id: 't16', name: 'Cube Rotate', category: '3D', icon: <Library size={16} /> },
    { id: 't17', name: 'Page Curl', category: '3D', icon: <Library size={16} /> },
    { id: 't18', name: 'Flip Overlay', category: '3D', icon: <Library size={16} /> },
    { id: 't19', name: 'Door Open', category: '3D', icon: <Library size={16} /> },
    { id: 't20', name: 'Zoom In', category: 'Zoom', icon: <Plus size={16} /> },
    { id: 't21', name: 'Zoom Out', category: 'Zoom', icon: <Plus size={16} /> },
    { id: 't22', name: 'Blur Dissolve', category: 'Blur', icon: <Sparkles size={16} /> },
    { id: 't23', name: 'Directional Blur', category: 'Blur', icon: <Sparkles size={16} /> },
    { id: 't24', name: 'Glitch Flash', category: 'Special', icon: <Zap size={16} /> },
    { id: 't25', name: 'Pixelate Dissolve', category: 'Special', icon: <Zap size={16} /> },
    { id: 't26', name: 'VHS Static', category: 'Special', icon: <Zap size={16} /> },
    { id: 't27', name: 'Film Burn', category: 'Special', icon: <Zap size={16} /> },
    { id: 't28', name: 'Light Leak', category: 'Special', icon: <Zap size={16} /> },
    ...Array.from({ length: 75 }).map((_, i) => ({
        id: `tx_${i + 29}`,
        name: `Transition ${i + 29}`,
        category: ['Dynamic', 'Geometric', 'Artistic', 'Modern'][i % 4],
        icon: <Film size={16} />
    }))
];

const EFFECTS_LIST = [
    { id: 'e1', name: 'Gaussian Blur', category: 'Blur', icon: <Sparkles size={16} /> },
    { id: 'e2', name: 'Color Balance', category: 'Color', icon: <Wand2 size={16} /> },
    { id: 'e3', name: 'Luma Curve', category: 'Color', icon: <Wand2 size={16} /> },
    { id: 'e4', name: 'Lens Flare', category: 'Stylize', icon: <Plus size={16} /> },
    { id: 'e5', name: 'Old Film', category: 'Stylize', icon: <Film size={16} /> },
    { id: 'e6', name: 'Glitch', category: 'Special', icon: <Zap size={16} /> },
    { id: 'e7', name: 'Sharpen', category: 'Fix', icon: <Scissors size={16} /> },
    { id: 'e8', name: 'De-noise', category: 'Fix', icon: <Scissors size={16} /> },
];

interface AssetLibraryProps {
    onAddClip: (type: 'video' | 'audio' | 'text' | 'image', src?: string, duration?: number) => void;
    onUpdateClip?: (updates: Partial<Clip>) => void;
    selectedClip: Clip | null;
    onAutoEdit?: () => void;
    activeTab: 'media' | 'ai' | 'library' | 'transitions' | 'effects' | 'templates';
    onTabChange: (tab: 'media' | 'ai' | 'library' | 'transitions' | 'effects' | 'templates') => void;
    mediaAssets: any[];
    audioAssets: any[];
    onImportRequested: () => void;
    librarySubTab: 'video' | 'image' | 'graphics';
    setLibrarySubTab: (tab: 'video' | 'image' | 'graphics') => void;
    mediaSubTab: 'video' | 'audio' | 'image';
    setMediaSubTab: (tab: 'video' | 'audio' | 'image') => void;
    uploadProgress: number | null;
    project: any;
    onApplyTemplate: (template: any) => void;
    onSaveAsTemplate: () => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
    onAddClip,
    onUpdateClip,
    selectedClip,
    onAutoEdit,
    activeTab,
    onTabChange,
    mediaAssets,
    audioAssets,
    onImportRequested,
    librarySubTab,
    setLibrarySubTab,
    mediaSubTab,
    setMediaSubTab,
    uploadProgress,
    project,
    onApplyTemplate,
    onSaveAsTemplate,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [ttsText, setTtsText] = useState('Welcome to Lumina AI Video Editor.');
    const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM');
    const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
    const [loadedDurations, setLoadedDurations] = useState<Record<string, number>>({});

    const handleLoadedMetadata = (id: string, e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const duration = e.currentTarget.duration;
        setLoadedDurations(prev => ({ ...prev, [id]: duration }));
    };

    const handleGenerateTTS = async () => {
        if (!ttsText) return;
        setIsGeneratingTTS(true);
        const audioUrl = await elevenLabsService.textToSpeech(ttsText, selectedVoice);
        if (audioUrl) {
            onAddClip('audio', audioUrl);
        } else {
            alert('Failed to generate speech. Please check API Key or try again.');
        }
        setIsGeneratingTTS(false);
    };

    const handleApplyTransition = (t: any) => {
        if (!selectedClip || !onUpdateClip) {
            alert('Select a clip on the timeline first to apply this transition.');
            return;
        }
        const typeMap: Record<string, 'fade' | 'wipe' | 'zoom' | 'slide-left' | 'slide-right' | 'dissolve' | 'iris'> = {
            'Cross Dissolve': 'dissolve',
            'Dip to Black': 'fade',
            'Dip to White': 'fade',
            'Fade to Color': 'fade',
            'Wipe Right': 'wipe',
            'Wipe Left': 'wipe',
            'Wipe Up': 'wipe',
            'Wipe Down': 'wipe',
            'Slide Left': 'slide-left',
            'Slide Right': 'slide-right',
            'Zoom In': 'zoom',
            'Zoom Out': 'zoom',
            'Blur Dissolve': 'dissolve',
            'Directional Blur': 'dissolve',
            'Glitch Flash': 'iris',
            'Pixelate Dissolve': 'dissolve',
            'VHS Static': 'iris',
            'Film Burn': 'iris',
            'Light Leak': 'fade',
            'Cube Rotate': 'zoom',
            'Page Curl': 'wipe',
            'Flip Overlay': 'zoom',
            'Door Open': 'slide-left',
            'Clock Wipe': 'wipe',
            'Venetian Blinds': 'wipe',
            'Checkerboard': 'iris',
            'Push Up': 'slide-right',
            'Push Down': 'slide-left',
        };
        const type = typeMap[t.name] || 'fade';
        const duration = t.category === 'Zoom' ? 0.6 : t.category === 'Blur' ? 0.4 : 0.5;
        onUpdateClip({ transitionIn: { type, duration } });
    };

    const handleApplyEffect = (e: any) => {
        if (!selectedClip || !onUpdateClip) {
            alert('Select a clip on the timeline first to apply this effect.');
            return;
        }
        // Add to advanced effects
        const newEffect: AdvancedEffect = {
            id: `${e.id}_${Date.now()}`,
            type: 'pixelate', // Simplified for now
            name: e.name,
            isActive: true,
            params: { intensity: 50 }
        };
        onUpdateClip({ advancedEffects: [...(selectedClip.advancedEffects || []), newEffect] });
    };

    // Search Logic
    const filteredMedia = useMemo(() => {
      const q = searchQuery.toLowerCase();
      return mediaAssets.filter((a: any) => {
        const nameMatch = (a.name || '').toLowerCase().includes(q);
        const tagMatch = (a.tags || []).some((t: string) => t.toLowerCase().includes(q));
        const transcriptMatch = (a.transcript || '').toLowerCase().includes(q);
        return nameMatch || tagMatch || transcriptMatch;
      });
    }, [mediaAssets, searchQuery]);
    const filteredAudio = useMemo(() => audioAssets.filter(a => (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (a.genre || '').toLowerCase().includes(searchQuery.toLowerCase())), [audioAssets, searchQuery]);

    // Library Search
    const filteredStockVideos = useMemo(() => STOCK_VIDEOS.filter(v => (v.name || '').toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery]);
    const filteredStockImages = useMemo(() => STOCK_IMAGES.filter(i => (i.name || '').toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery]);
    const filteredStockGraphics = useMemo(() => STOCK_TEXT.map((t, i) => ({ id: `g${i}`, name: t, src: `https://picsum.photos/id/${100 + i}/200/200` })), []);
    const filteredStockAudio = useMemo(() => STOCK_AUDIO.filter(a => (a.name || '').toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery]);

    return (
        <div className="w-full bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-gray-800 flex flex-col h-full transition-colors duration-300">

            {/* --- UPLOADED MEDIA HEADER --- */}
            {activeTab === 'media' && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <LayoutGrid size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Uploaded Media Hub</span>
                </div>
            )}

            {/* --- TRANSITIONS HEADER --- */}
            {activeTab === 'transitions' && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <Film size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Transitions</span>
                </div>
            )}

            {/* --- EFFECTS HEADER --- */}
            {activeTab === 'effects' && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-500/20 flex items-center justify-center gap-2 text-purple-700 dark:text-purple-400">
                    <Zap size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Visual Effects</span>
                </div>
            )}

            {/* --- AI HEADER --- */}
            {activeTab === 'ai' && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <Sparkles size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Magic Tools</span>
                </div>
            )}

            {/* --- LIBRARY HEADER --- */}
            {activeTab === 'library' && (
                <div className="flex flex-col border-b border-gray-200 dark:border-gray-800">
                    <div className="p-3 bg-gray-50 dark:bg-[#1f1f1f] flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800">
                        <Library size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Asset Library</span>
                    </div>
                    <div className="flex p-1 gap-1 bg-white dark:bg-[#1a1a1a]">
                        <button
                            onClick={() => setLibrarySubTab('video')}
                            className={`flex-1 py-1.5 text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${librarySubTab === 'video' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500'}`}
                        >
                            <VideoIcon size={12} /> Video
                        </button>
                        <button
                            onClick={() => setLibrarySubTab('image')}
                            className={`flex-1 py-1.5 text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${librarySubTab === 'image' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500'}`}
                        >
                            <ImageIcon size={12} /> Image
                        </button>
                        <button
                            onClick={() => setLibrarySubTab('graphics')}
                            className={`flex-1 py-1.5 text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${librarySubTab === 'graphics' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500'}`}
                        >
                            <Sparkles size={12} /> Graphics
                        </button>
                    </div>
                </div>
            )}

            {/* Search - Hide on AI Tab */}
            {activeTab !== 'ai' && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-2 top-2 text-gray-500" size={14} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab === 'library' ? librarySubTab : activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-[#121212] text-gray-800 dark:text-gray-300 text-xs rounded pl-8 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent dark:border-gray-800 placeholder-gray-500 dark:placeholder-gray-600 transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">

                {/* === STANDARD MEDIA HUB (Uploads) === */}
                {activeTab === 'media' && (
                    <div className="space-y-4">
                        {/* Sub-tabs for Uploaded Media (Audio, Image, Video) */}
                        <div className="flex p-1 gap-1 bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => setMediaSubTab('audio')}
                                className={`flex-1 py-1.5 text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${mediaSubTab === 'audio' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500'}`}
                            >
                                <Music size={12} /> Audio
                            </button>
                            <button
                                onClick={() => setMediaSubTab('image')}
                                className={`flex-1 py-1.5 text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${mediaSubTab === 'image' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500'}`}
                            >
                                <ImageIcon size={12} /> Image
                            </button>
                            <button
                                onClick={() => setMediaSubTab('video')}
                                className={`flex-1 py-1.5 text-[10px] font-medium rounded flex items-center justify-center gap-1 transition-colors ${mediaSubTab === 'video' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500'}`}
                            >
                                <VideoIcon size={12} /> Video
                            </button>
                        </div>

                        <button
                            onClick={onImportRequested}
                            disabled={uploadProgress !== null}
                            className={`w-full border border-dashed border-gray-400 dark:border-gray-700 rounded-lg p-3 flex flex-col items-center justify-center text-gray-600 dark:text-gray-500 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] transition group ${uploadProgress !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Upload className="mb-1 group-hover:scale-110 transition-transform text-indigo-500" size={16} />
                            <span className="text-[10px] font-medium">Upload {mediaSubTab.charAt(0).toUpperCase() + mediaSubTab.slice(1)}</span>
                        </button>

                        {/* Upload Progress Bar */}
                        {uploadProgress !== null && (
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-2 relative overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                                <div className="absolute top-4 left-0 right-0 text-center text-[8px] text-gray-500 font-medium">
                                    Uploading... {uploadProgress}%
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {mediaSubTab === 'video' && (
                                <>
                                    {filteredMedia.filter(a => a.type === 'video').length === 0 && uploadProgress === null && (
                                        <div className="col-span-2 text-center text-gray-500 text-[10px] py-4">No videos uploaded</div>
                                    )}
                                    {filteredMedia.filter(a => a.type === 'video').map((asset) => (
                                        <div
                                            key={asset.id}
                                            onClick={() => onAddClip('video', asset.src, loadedDurations[asset.id])}
                                            className="group relative bg-gray-100 dark:bg-[#121212] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-800 hover:border-indigo-500 cursor-pointer transition shadow-sm"
                                        >
                                            <div className="aspect-video bg-gray-200 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                                <video
                                                    src={asset.src}
                                                    className="w-full h-full object-cover opacity-90 dark:opacity-70 group-hover:opacity-100 transition duration-300"
                                                    muted
                                                    playsInline
                                                    onLoadedMetadata={(e) => handleLoadedMetadata(asset.id, e)}
                                                    onMouseOver={(e) => e.currentTarget.play()}
                                                    onMouseOut={(e) => e.currentTarget.pause()}
                                                />
                                                <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[9px] font-mono text-white">{asset.duration}</div>
                                            </div>
                                            <div className="p-2">
                                                <div className="text-[10px] text-gray-800 dark:text-gray-300 truncate font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{asset.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {mediaSubTab === 'image' && (
                                <>
                                    {filteredMedia.filter(a => a.type === 'image').length === 0 && uploadProgress === null && (
                                        <div className="col-span-2 text-center text-gray-500 text-[10px] py-4">No images uploaded</div>
                                    )}
                                    {filteredMedia.filter(a => a.type === 'image').map((asset) => (
                                        <div
                                            key={asset.id}
                                            onClick={() => onAddClip('image', asset.src)}
                                            className="group relative bg-gray-100 dark:bg-[#121212] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-800 hover:border-indigo-500 cursor-pointer transition shadow-sm"
                                        >
                                            <div className="aspect-square bg-gray-200 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                                <img src={asset.src} alt={asset.name} className="w-full h-full object-cover opacity-90 dark:opacity-70 group-hover:opacity-100 transition duration-300" />
                                            </div>
                                            <div className="p-2">
                                                <div className="text-[10px] text-gray-800 dark:text-gray-300 truncate font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{asset.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {mediaSubTab === 'audio' && (
                                <div className="col-span-2 space-y-2">
                                    {filteredAudio.length === 0 && uploadProgress === null && (
                                        <div className="text-center text-gray-500 text-[10px] py-4">No audio uploaded</div>
                                    )}
                                    {filteredAudio.map((asset) => (
                                        <div
                                            key={asset.id}
                                            onClick={() => onAddClip('audio', asset.src)}
                                            className="flex items-center p-2 rounded bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer group transition-colors"
                                        >
                                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded flex items-center justify-center mr-3">
                                                <Music size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-medium text-gray-800 dark:text-gray-300 truncate group-hover:text-black dark:group-hover:text-white">{asset.name}</div>
                                                <div className="text-[8px] text-gray-600 dark:text-gray-500">{asset.genre} • {asset.duration}</div>
                                            </div>
                                            <Plus size={14} className="text-gray-500 dark:text-gray-600 group-hover:text-indigo-600 dark:group-hover:text-white opacity-0 group-hover:opacity-100" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Content hubs for Transitions, Effects, and Library follow... */}

                {/* === LIBRARY ASSET TAB === */}
                {activeTab === 'library' && (
                    <div className="space-y-4">
                        {/* Stock Video Sub-tab */}
                        {librarySubTab === 'video' && (
                            <div className="grid grid-cols-2 gap-3">
                                {filteredStockVideos.length === 0 && <div className="col-span-2 text-center text-gray-500 text-xs">No videos found</div>}
                                {filteredStockVideos.map(video => (
                                    <div
                                        key={video.id}
                                        onClick={() => onAddClip('video', video.src)}
                                        className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-indigo-500 cursor-pointer transition"
                                    >
                                        <div className="aspect-video bg-gray-200 dark:bg-gray-900 relative">
                                            <img src="https://picsum.photos/300/169?blur" className="w-full h-full object-cover opacity-80" alt="thumbnail" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <PlayCircle className="text-white opacity-70 group-hover:opacity-100 group-hover:scale-110 transition" size={24} />
                                            </div>
                                            <div className="absolute bottom-1 right-1 bg-black/80 text-[9px] text-white px-1 rounded">{video.duration}</div>
                                        </div>
                                        <div className="p-2 bg-gray-50 dark:bg-[#121212]">
                                            <div className="text-[10px] font-medium truncate text-gray-700 dark:text-gray-300">{video.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Stock Image Sub-tab */}
                        {librarySubTab === 'image' && (
                            <div className="grid grid-cols-2 gap-3">
                                {filteredStockImages.length === 0 && <div className="col-span-2 text-center text-gray-500 text-xs">No images found</div>}
                                {filteredStockImages.map(img => (
                                    <div
                                        key={img.id}
                                        onClick={() => onAddClip('image', img.src)}
                                        className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-indigo-500 cursor-pointer transition"
                                    >
                                        <div className="aspect-square bg-gray-200 dark:bg-gray-900">
                                            <img src={img.src} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={img.name} />
                                        </div>
                                        <div className="p-2 bg-gray-50 dark:bg-[#121212]">
                                            <div className="text-[10px] font-medium truncate text-gray-700 dark:text-gray-300">{img.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Stock Graphics Sub-tab */}
                        {librarySubTab === 'graphics' && (
                            <div className="grid grid-cols-2 gap-3">
                                {filteredStockGraphics.length === 0 && <div className="col-span-2 text-center text-gray-500 text-[10px] py-4">No graphics found</div>}
                                {filteredStockGraphics.map((graphic) => (
                                    <div
                                        key={graphic.id}
                                        onClick={() => onAddClip('image', graphic.src)}
                                        className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-indigo-500 cursor-pointer transition"
                                    >
                                        <div className="aspect-square bg-gray-200 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                                            <img src={graphic.src} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" alt={graphic.name} />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition"></div>
                                        </div>
                                        <div className="p-2 bg-gray-50 dark:bg-[#121212]">
                                            <div className="text-[10px] font-medium truncate text-gray-700 dark:text-gray-300">{graphic.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* === AI MAGIC TAB === */}
                {activeTab === 'ai' && (
                    <AIToolsPanel
                        project={project}
                        selectedClipId={selectedClip?.id}
                        onAddClip={onAddClip}
                        onUpdateClip={onUpdateClip || (() => {})}
                    />
                )}

                {/* === TRANSITIONS TAB === */}
                {activeTab === 'transitions' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {TRANSITION_LIST.filter(t => (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.category || '').toLowerCase().includes(searchQuery.toLowerCase())).map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => handleApplyTransition(t)}
                                    className="group relative bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-lg p-3 hover:border-indigo-500 cursor-pointer transition flex flex-col items-center gap-2 overflow-hidden"
                                >
                                    <div className="w-full aspect-video bg-gray-100 dark:bg-[#1f1f1f] rounded flex items-center justify-center relative group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/10 transition-colors">
                                        <div className="text-indigo-500 group-hover:scale-110 transition-transform">
                                            {t.icon}
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-800 dark:text-gray-300 truncate w-full text-center">{t.name}</div>
                                    <div className="text-[8px] text-gray-500 uppercase tracking-widest">{t.category}</div>

                                    {/* Action Hover */}
                                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors pointer-events-none"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === TEMPLATES TAB === */}
                {activeTab === 'templates' && (
                    <TemplatePanel
                        project={project}
                        onApplyTemplate={onApplyTemplate}
                        onSaveAsTemplate={onSaveAsTemplate}
                    />
                )}

                {/* === EFFECTS TAB === */}
                {activeTab === 'effects' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {EFFECTS_LIST.filter(e => (e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (e.category || '').toLowerCase().includes(searchQuery.toLowerCase())).map((e) => (
                                <div
                                    key={e.id}
                                    onClick={() => handleApplyEffect(e)}
                                    className="group relative bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-lg p-3 hover:border-purple-500 cursor-pointer transition flex flex-col items-center gap-2"
                                >
                                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                                        {e.icon}
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-800 dark:text-gray-300 truncate w-full text-center">{e.name}</div>
                                    <div className="text-[8px] text-gray-500 uppercase tracking-widest">{e.category}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

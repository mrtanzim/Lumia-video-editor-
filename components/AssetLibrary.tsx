import React, { useState, useRef, useMemo } from 'react';
import { Image, Music, Video, Plus, Search, FileText, LayoutGrid, Upload } from 'lucide-react';

interface AssetLibraryProps {
  onAddClip: (type: 'video' | 'audio' | 'text', src?: string) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ onAddClip }) => {
  const [activeTab, setActiveTab] = useState<'media' | 'audio' | 'text'>('media');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaAssets = [
    { id: 1, type: 'video', name: 'Travel_Vlog.mp4', duration: '00:15', src: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
    { id: 2, type: 'video', name: 'Drone_Shot.mp4', duration: '00:08', src: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4' },
    { id: 3, type: 'image', name: 'Logo.png', duration: '00:05', src: 'https://picsum.photos/300/200' },
  ];

  const audioAssets = [
    { id: 4, type: 'audio', name: 'LoFi Beat.mp3', duration: '02:30', genre: 'Chill' },
    { id: 5, type: 'audio', name: 'Upbeat Corp.mp3', duration: '01:45', genre: 'Pop' },
    { id: 6, type: 'audio', name: 'Cinematic Rise.mp3', duration: '00:10', genre: 'SFX' },
  ];

  const textAssets = ['Basic Title', 'Lower Third', 'Neon', 'Glitch', 'Typewriter', 'Fade In'];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('audio') ? 'audio' : 'video';
      onAddClip(type, url);
    }
    if (e.target) e.target.value = '';
  };

  // Search Logic
  const filteredMedia = useMemo(() => mediaAssets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery]);
  const filteredAudio = useMemo(() => audioAssets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.genre.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery]);
  const filteredText = useMemo(() => textAssets.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase())), [searchQuery]);

  return (
    <div className="w-80 bg-[#1a1a1a] border-l border-gray-800 flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button 
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 ${activeTab === 'media' ? 'text-white border-b-2 border-indigo-500 bg-[#222]' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <LayoutGrid size={14} /> Media
        </button>
        <button 
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 ${activeTab === 'audio' ? 'text-white border-b-2 border-indigo-500 bg-[#222]' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <Music size={14} /> Audio
        </button>
        <button 
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 ${activeTab === 'text' ? 'text-white border-b-2 border-indigo-500 bg-[#222]' : 'text-gray-500 hover:text-gray-300'}`}
        >
            <FileText size={14} /> Text
        </button>
      </div>
      
      {/* Search */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
            <Search className="absolute left-2 top-2 text-gray-500" size={14} />
            <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121212] text-gray-300 text-xs rounded pl-8 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-800 placeholder-gray-600"
            />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-700">
        
        {activeTab === 'media' && (
            <div className="grid grid-cols-2 gap-3">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="video/*,image/*" 
                    onChange={handleFileChange}
                />
                <button 
                    onClick={handleImportClick}
                    className="col-span-2 border border-dashed border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-300 hover:bg-[#222] transition group mb-2"
                >
                    <Upload className="mb-2 group-hover:scale-110 transition-transform text-indigo-500" size={20} />
                    <span className="text-xs font-medium">Import Media</span>
                    <span className="text-[10px] text-gray-600 mt-1">Click to upload</span>
                </button>
                
                {filteredMedia.length === 0 && <div className="col-span-2 text-center text-gray-500 text-xs py-4">No media found</div>}

                {filteredMedia.map((asset) => (
                    <div 
                        key={asset.id} 
                        onClick={() => onAddClip('video', asset.src)}
                        className="group relative bg-[#121212] rounded-lg overflow-hidden border border-gray-800 hover:border-indigo-500 cursor-pointer transition shadow-sm"
                    >
                        <div className="aspect-video bg-gray-900 flex items-center justify-center relative overflow-hidden">
                            <img src={asset.src} alt={asset.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition duration-300" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition"></div>
                            <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[9px] font-mono text-white">{asset.duration}</div>
                        </div>
                        <div className="p-2">
                            <div className="text-xs text-gray-300 truncate font-medium group-hover:text-indigo-400">{asset.name}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'audio' && (
             <div className="space-y-2">
                {filteredAudio.length === 0 && <div className="text-center text-gray-500 text-xs py-4">No audio found</div>}
                {filteredAudio.map((asset) => (
                    <div 
                        key={asset.id} 
                        onClick={() => onAddClip('audio')}
                        className="flex items-center p-2 rounded bg-[#121212] border border-gray-800 hover:border-gray-600 cursor-pointer group"
                    >
                        <div className="w-8 h-8 bg-emerald-900/30 text-emerald-500 rounded flex items-center justify-center mr-3">
                            <Music size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-300 truncate group-hover:text-white">{asset.name}</div>
                            <div className="text-[10px] text-gray-500">{asset.genre} • {asset.duration}</div>
                        </div>
                        <Plus size={14} className="text-gray-600 group-hover:text-white opacity-0 group-hover:opacity-100" />
                    </div>
                ))}
             </div>
        )}

        {activeTab === 'text' && (
             <div className="grid grid-cols-2 gap-2">
                {filteredText.length === 0 && <div className="col-span-2 text-center text-gray-500 text-xs py-4">No text presets found</div>}
                {filteredText.map((preset, i) => (
                     <div 
                        key={i} 
                        onClick={() => onAddClip('text')}
                        className="aspect-[2/1] bg-[#121212] border border-gray-800 rounded hover:border-indigo-500 cursor-pointer flex items-center justify-center p-2 text-center group"
                    >
                        <span className="text-xs font-bold text-gray-400 group-hover:text-white transition">{preset}</span>
                    </div>
                ))}
             </div>
        )}
      </div>
    </div>
  );
};
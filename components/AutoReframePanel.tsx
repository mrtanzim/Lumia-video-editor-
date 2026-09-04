import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Project, Clip } from '../types';
import { Pipette, Play, RefreshCw, Scissors, Wand2 } from 'lucide-react';

interface AutoReframePanelProps {
  project: Project;
  selectedClip: Clip | null;
  onUpdateProject: (updates: Partial<Project>) => void;
  onUpdateClip: (updates: Partial<Clip>) => void;
  onAddClip: (type: 'video' | 'audio' | 'text' | 'image', src?: string, duration?: number) => void;
}

export const AutoReframePanel: React.FC<AutoReframePanelProps> = ({
  project, selectedClip, onUpdateProject, onUpdateClip, onAddClip,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [targetRatio, setTargetRatio] = useState('9:16');
  const [smoothness, setSmoothness] = useState(50);

  const analyzeFrame = useCallback((video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0.5, y: 0.5 };
    const ctx = canvas.getContext('2d');
    if (!ctx) return { x: 0.5, y: 0.5 };
    canvas.width = 64;
    canvas.height = 64;
    ctx.drawImage(video, 0, 0, 64, 64);
    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;
    let sumX = 0, sumY = 0, count = 0;
    let maxSat = 0;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max;
        const lum = (r + g + b) / 3;
        if (sat > 0.15 || lum > 120 || lum < 80) {
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }
    if (count === 0) return { x: 0.5, y: 0.5 };
    return { x: sumX / count / 64, y: sumY / count / 64 };
  }, []);

  const handleAutoReframe = async () => {
    if (!selectedClip || selectedClip.type !== 'video') return;
    setAnalyzing(true);
    const video = document.createElement('video');
    video.src = selectedClip.src || '';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
    });
    const duration = video.duration || selectedClip.duration;
    const step = 0.5;
    const keyframes: { time: number; x: number; y: number }[] = [];
    for (let t = 0; t < duration; t += step) {
      video.currentTime = t;
      await new Promise<void>(resolve => { video.onseeked = () => resolve(); });
      const point = analyzeFrame(video);
      keyframes.push({ time: t, x: point.x, y: point.y });
    }
    const smoothed = keyframes.map((kf, i) => {
      if (i === 0 || i === keyframes.length - 1) return kf;
      const prev = keyframes[i - 1];
      const next = keyframes[i + 1];
      const alpha = (smoothness / 100) * 0.5;
      return {
        time: kf.time,
        x: kf.x * (1 - alpha) + (prev.x + next.x) / 2 * alpha,
        y: kf.y * (1 - alpha) + (prev.y + next.y) / 2 * alpha,
      };
    });
    const cropKeyframes = smoothed.map(kf => ({
      id: `kf_crop_${Date.now()}_${kf.time}`,
      time: kf.time - selectedClip.startTime,
      property: 'cropX' as any,
      value: kf.x,
      easing: 'linear' as const,
    }));
    onUpdateClip({
      properties: {
        ...selectedClip.properties,
        crop: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      keyframes: [...(selectedClip.keyframes || []), ...cropKeyframes],
    });
    setAnalyzing(false);
    alert(`Auto Reframe complete! Generated ${cropKeyframes.length} crop keyframes for ${targetRatio}.`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Auto Reframe</div>
      <p className="text-[10px] text-gray-500">AI detects the subject per frame and generates crop keyframes when changing aspect ratio.</p>

      <div>
        <label className="text-[10px] text-gray-500 block mb-1">Target Aspect Ratio</label>
        <select value={targetRatio} onChange={(e) => setTargetRatio(e.target.value)} className="w-full bg-gray-50 dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded p-2 text-xs">
          <option value="9:16">9:16 (Vertical)</option>
          <option value="1:1">1:1 (Square)</option>
          <option value="4:5">4:5 (Portrait)</option>
        </select>
      </div>

      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-500">Motion Smoothness</label>
          <span className="text-[10px] font-mono text-gray-500">{smoothness}%</span>
        </div>
        <input type="range" min={0} max={100} value={smoothness} onChange={(e) => setSmoothness(parseInt(e.target.value))} className="w-full h-1.5 accent-indigo-600 rounded-lg cursor-pointer" />
      </div>

      <button
        onClick={handleAutoReframe}
        disabled={analyzing || !selectedClip}
        className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {analyzing ? <><div className="animate-spin h-3 w-3 border-b-2 border-white rounded-full"></div> Analyzing...</> : <><Wand2 size={14} /> Auto Reframe Subject</>}
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

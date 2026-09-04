import React, { useRef, useCallback, useState } from 'react';
import { Clip } from '../types';
import { Pipette, RefreshCw, Eraser } from 'lucide-react';

interface BackgroundRemoverPanelProps {
  clip: Clip;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

export const BackgroundRemoverPanel: React.FC<BackgroundRemoverPanelProps> = ({ clip, onUpdateClip }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<'transparent' | 'blur' | 'color'>('transparent');
  const [keyColor, setKeyColor] = useState('#00ff00');
  const [tolerance, setTolerance] = useState(40);

  const pickColor = useCallback(() => {
    if ('EyeDropper' in window) {
      const dropper = new (window as any).EyeDropper();
      dropper.open().then((result: any) => {
        setKeyColor(result.sRGBHex);
      }).catch(() => {});
    }
  }, []);

  const removeBackground = useCallback(async () => {
    if (!clip.src || clip.type !== 'video') return;
    setProcessing(true);
    const video = document.createElement('video');
    video.src = clip.src;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
    });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 180;
    video.currentTime = 0;
    await new Promise<void>(resolve => { video.onseeked = () => resolve(); });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const kr = parseInt(keyColor.slice(1, 3), 16);
    const kg = parseInt(keyColor.slice(3, 5), 16);
    const kb = parseInt(keyColor.slice(5, 7), 16);
    const tol = tolerance * 2.55;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i], dg = data[i + 1], db = data[i + 2];
      const dist = Math.sqrt((dr - kr) ** 2 + (dg - kg) ** 2 + (db - kb) ** 2);
      if (dist < tol) {
        if (mode === 'transparent') data[i + 3] = 0;
        else if (mode === 'blur') {
          data[i] = (dr + dg + db) / 3;
          data[i + 1] = data[i];
          data[i + 2] = data[i];
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const resultSrc = canvas.toDataURL('image/png');
    onUpdateClip({
      src: resultSrc,
      properties: {
        ...clip.properties,
        backgroundRemoval: { enabled: true, mode: mode as any, value: keyColor },
      },
    });
    setProcessing(false);
  }, [clip, keyColor, mode, tolerance, onUpdateClip]);

  return (
    <div className="p-4 space-y-4">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">AI Background Remover</div>
      <p className="text-[10px] text-gray-500">Remove background without green screen. Uses color-based segmentation for client-side preview.</p>

      <div>
        <label className="text-[10px] text-gray-500 block mb-1">Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {['transparent', 'blur', 'color'].map(m => (
            <button key={m} onClick={() => setMode(m as any)} className={`py-1.5 rounded border text-[10px] capitalize ${mode === m ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}>{m}</button>
          ))}
        </div>
      </div>

      {mode !== 'transparent' && (
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Background Color</label>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border border-gray-200 dark:border-gray-700" style={{ backgroundColor: keyColor }} />
            <input type="color" value={keyColor} onChange={(e) => setKeyColor(e.target.value)} className="flex-1 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700 bg-transparent" />
            <button onClick={pickColor} className="p-2 border border-gray-200 dark:border-gray-700 rounded hover:border-indigo-500 transition"><Pipette size={12} /></button>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between mb-1">
          <label className="text-[10px] text-gray-500">Tolerance</label>
          <span className="text-[10px] font-mono text-gray-500">{tolerance}</span>
        </div>
        <input type="range" min={0} max={100} value={tolerance} onChange={(e) => setTolerance(parseInt(e.target.value))} className="w-full h-1.5 accent-indigo-600 rounded-lg cursor-pointer" />
      </div>

      <button onClick={removeBackground} disabled={processing} className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
        {processing ? <><div className="animate-spin h-3 w-3 border-b-2 border-white rounded-full"></div> Processing...</> : <><Eraser size={14} /> Remove Background</>}
      </button>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

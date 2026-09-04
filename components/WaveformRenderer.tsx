import React, { useRef, useEffect, useMemo } from 'react';
import { Clip, TrackType, Keyframe } from '../types';

interface WaveformRendererProps {
  clip: Clip;
  width: number;
  height: number;
  color?: string;
}

export const WaveformRenderer: React.FC<WaveformRendererProps> = ({ clip, width, height, color = '#10b981' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const peaks = useMemo(() => {
    const bars = 80;
    const data: number[] = [];
    let seed = clip.id.charCodeAt(1) || 1;
    for (let i = 0; i < bars; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const val = Math.abs(Math.sin(seed / 233280 * Math.PI * 2) * 0.6 + 0.4);
      data.push(val);
    }
    return data;
  }, [clip.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / peaks.length;
    const mid = height / 2;

    for (let i = 0; i < peaks.length; i++) {
      const barH = peaks[i] * mid * 0.9;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(i * barWidth + 1, mid - barH, barWidth - 2, barH * 2);
    }
  }, [peaks, width, height, color]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ width, height }} />;
};

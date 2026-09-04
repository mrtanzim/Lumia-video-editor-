import React, { useEffect, useRef, useMemo } from 'react';
import { Project, TrackType, Clip, Transition } from '../types';

interface CanvasCompositorProps {
  project: Project;
  isPlaying: boolean;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  selectedClipId?: string;
  onCanvasClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onTransformChange?: (updates: Record<string, any>) => void;
}

interface ClipWithTrack extends Clip {
  trackId: string;
}

function applyTransitionOpacity(clip: Clip, currentTime: number, baseOpacity: number): number {
  if (!clip.transitionIn) return baseOpacity;
  const t = currentTime - clip.startTime;
  if (t < 0 || t >= clip.transitionIn.duration) return baseOpacity;
  const progress = t / clip.transitionIn.duration;
  switch (clip.transitionIn.type) {
    case 'fade':
      return baseOpacity * progress;
    case 'dissolve':
      return baseOpacity * progress;
    case 'zoom':
      return baseOpacity * progress;
    default:
      return baseOpacity;
  }
}

function getTransitionContext(project: Project, currentTime: number): { outgoing: ClipWithTrack | null; incoming: ClipWithTrack | null; transition: Transition | null } | null {
  for (const track of project.tracks) {
    if (track.type !== TrackType.VIDEO && track.type !== TrackType.IMAGE) continue;
    for (let i = 0; i < track.clips.length; i++) {
      const clip = track.clips[i];
      if (clip.transitionIn && currentTime >= clip.startTime && currentTime < clip.startTime + clip.transitionIn.duration) {
        const prev = track.clips[i - 1];
        if (prev) {
          return { outgoing: { ...prev, trackId: track.id }, incoming: { ...clip, trackId: track.id }, transition: clip.transitionIn };
        }
      }
    }
  }
  return null;
}

function buildFilterString(clip: Clip): string {
  const parts: string[] = [];
  if (clip.effects) {
    for (const e of clip.effects) {
      switch (e.type) {
        case 'brightness':
          parts.push(`brightness(${e.value}%)`);
          break;
        case 'contrast':
          parts.push(`contrast(${e.value}%)`);
          break;
        case 'saturate':
          parts.push(`saturate(${e.value}%)`);
          break;
        case 'hue-rotate':
          parts.push(`hue-rotate(${e.value}deg)`);
          break;
        case 'blur':
          parts.push(`blur(${e.value}px)`);
          break;
        case 'grayscale':
          parts.push(`grayscale(${e.value}%)`);
          break;
        case 'sepia':
          parts.push(`sepia(${e.value}%)`);
          break;
        case 'invert':
          parts.push(`invert(${e.value}%)`);
          break;
        default:
          break;
      }
    }
  }
  return parts.length > 0 ? parts.join(' ') : 'none';
}

function getKeyframedProperty(clip: Clip, property: string, fallback: number): number {
  const kfs = clip.keyframes?.filter(k => k.property === property).sort((a, b) => a.time - b.time) || [];
  if (kfs.length === 0) return fallback;
  if (kfs.length === 1) return kfs[0].value;
  const t = clip.duration > 0 ? Math.max(0, Math.min(1, (property === 'currentTimeRelative' ? 0 : 0) / clip.duration)) : 0;
  // The caller passes relative time; we handle it below
  return fallback;
}

function interpolateKeyframes(keyframes: Keyframe[], time: number, fallback: number): number {
  if (!keyframes || keyframes.length === 0) return fallback;
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (sorted.length === 1) return sorted[0].value;
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (time >= a.time && time <= b.time) {
      const t = (time - a.time) / (b.time - a.time);
      const ease = a.easing === 'ease-in' ? t * t : a.easing === 'ease-out' ? t * (2 - t) : a.easing === 'ease-in-out' ? t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t : t;
      return a.value + (b.value - a.value) * ease;
    }
  }
  return fallback;
}

function applyMask(ctx: CanvasRenderingContext2D, clip: Clip, drawW: number, drawH: number) {
  const mask = clip.properties?.mask;
  if (!mask || mask.shape === 'none') return;
  ctx.save();
  if (mask.shape === 'rectangle') {
    const inset = mask.feather || 0;
    ctx.beginPath();
    ctx.rect(inset, inset, drawW - inset * 2, drawH - inset * 2);
    ctx.clip();
  } else if (mask.shape === 'circle') {
    const radius = Math.min(drawW, drawH) / 2 - (mask.feather || 0);
    ctx.beginPath();
    ctx.arc(drawW / 2, drawH / 2, Math.max(0, radius), 0, Math.PI * 2);
    ctx.clip();
  }
  ctx.restore();
}

function applyChromaKey(source: HTMLImageElement | HTMLVideoElement, ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, keyColor: string, tolerance: number) {
  try {
    ctx.drawImage(source, x, y, w, h);
    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;
    const kr = parseInt(keyColor.slice(1, 3), 16);
    const kg = parseInt(keyColor.slice(3, 5), 16);
    const kb = parseInt(keyColor.slice(5, 7), 16);
    const tol = tolerance * 2.55;
    for (let i = 0; i < data.length; i += 4) {
      const dr = data[i];
      const dg = data[i + 1];
      const db = data[i + 2];
      const dist = Math.sqrt((dr - kr) ** 2 + (dg - kg) ** 2 + (db - kb) ** 2);
      if (dist < tol) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, x, y);
  } catch {
    // ignore CORS or other errors
  }
}

export const CanvasCompositor: React.FC<CanvasCompositorProps> = ({
  project,
  isPlaying,
  playbackSpeed,
  volume,
  isMuted,
  selectedClipId,
  onCanvasClick,
  onTransformChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const allVisualClips = useMemo(() => {
    return project.tracks
      .filter((t) => (t.type === TrackType.VIDEO || t.type === TrackType.IMAGE) && !t.isHidden)
      .flatMap((t) => t.clips.map((c) => ({ ...c, trackId: t.id } as ClipWithTrack)))
      .sort((a, b) => {
        const aIdx = project.tracks.findIndex((t) => t.id === a.trackId);
        const bIdx = project.tracks.findIndex((t) => t.id === b.trackId);
        return aIdx - bIdx;
      });
  }, [project.tracks]);

  const activeVisualClips = useMemo(() => {
    return allVisualClips.filter((c) => project.currentTime >= c.startTime && project.currentTime < c.startTime + c.duration);
  }, [allVisualClips, project.currentTime]);

  const activeTextClips = useMemo(() => {
    return project.tracks
      .filter((t) => t.type === TrackType.TEXT && !t.isHidden)
      .flatMap((t) => t.clips)
      .filter((c) => project.currentTime >= c.startTime && project.currentTime < c.startTime + c.duration);
  }, [project.tracks, project.currentTime]);

  const transitionCtx = useMemo(() => getTransitionContext(project, project.currentTime), [project, project.currentTime]);

  const getClipOpacity = (clip: Clip, currentTime: number) => {
    let base = clip.properties?.opacity ?? 1;
    const rel = currentTime - clip.startTime;
    if (clip.keyframes?.some(k => k.property === 'opacity')) {
      base = interpolateKeyframes(clip.keyframes.filter(k => k.property === 'opacity'), rel, base);
    }
    if (clip.transitionOut && rel > clip.duration - clip.transitionOut.duration) {
      const f = (clip.duration - rel) / clip.transitionOut.duration;
      if (clip.transitionOut.type === 'fade') base *= f;
      if (clip.transitionOut.type === 'dissolve') base *= f;
    }
    return base;
  };

  const getClipTransform = (clip: Clip, currentTime: number) => {
    const rel = currentTime - clip.startTime;
    let scale = clip.properties?.scale ?? 1;
    let x = clip.properties?.x || 0;
    let y = clip.properties?.y || 0;
    let rotation = clip.properties?.rotation || 0;

    if (clip.keyframes?.some(k => k.property === 'scale')) {
      scale = interpolateKeyframes(clip.keyframes.filter(k => k.property === 'scale'), rel, scale);
    }
    if (clip.keyframes?.some(k => k.property === 'x')) {
      x = interpolateKeyframes(clip.keyframes.filter(k => k.property === 'x'), rel, x);
    }
    if (clip.keyframes?.some(k => k.property === 'y')) {
      y = interpolateKeyframes(clip.keyframes.filter(k => k.property === 'y'), rel, y);
    }
    if (clip.keyframes?.some(k => k.property === 'rotation')) {
      rotation = interpolateKeyframes(clip.keyframes.filter(k => k.property === 'rotation'), rel, rotation);
    }

    if (clip.transitionIn) {
      const f = Math.min(1, rel / clip.transitionIn.duration);
      if (clip.transitionIn.type === 'zoom') scale *= f;
      if (clip.transitionIn.type === 'slide-left') x += (1 - f) * -200;
      if (clip.transitionIn.type === 'slide-right') x += (1 - f) * 200;
    }
    if (clip.transitionOut) {
      const f = Math.max(0, (clip.duration - rel) / clip.transitionOut.duration);
      if (clip.transitionOut.type === 'zoom') scale *= f;
      if (clip.transitionOut.type === 'slide-left') x += (1 - f) * -200;
      if (clip.transitionOut.type === 'slide-right') x += (1 - f) * 200;
    }

    return { scale, x, y, rotation };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;

      if (isPlaying) {
        let max = 0;
        for (const t of project.tracks) {
          for (const c of t.clips) {
            const end = c.startTime + c.duration;
            if (end > max) max = end;
          }
        }
      }

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, rect.width, rect.height);

      const cw = rect.width;
      const ch = rect.height;
      const aspect = project.width / project.height;
      let drawW = cw;
      let drawH = cw / aspect;
      if (drawH > ch) {
        drawH = ch;
        drawW = ch * aspect;
      }
      const ox = (cw - drawW) / 2;
      const oy = (ch - drawH) / 2;

      const drawClip = (clip: Clip, opacityOverride?: number) => {
        const opacity = opacityOverride ?? getClipOpacity(clip, project.currentTime);
        const { scale, x, y, rotation } = getClipTransform(clip, project.currentTime);
        const filter = buildFilterString(clip);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
        ctx.translate(ox + drawW / 2 + x * drawW / project.width, oy + drawH / 2 + y * drawH / project.height);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);

        const clipTime = (project.currentTime - clip.startTime) + (clip.trimStart || 0);

        if (clip.type === TrackType.VIDEO) {
          let video = videosRef.current.get(clip.id);
          if (!video) {
            video = document.createElement('video');
            video.preload = 'auto';
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';
            video.src = clip.src || '';
            videosRef.current.set(clip.id, video);
          }
          if (video.readyState >= 2) {
            if (Math.abs(video.currentTime - clipTime) > 0.15) {
              video.currentTime = clipTime;
            }
            ctx.filter = filter !== 'none' ? filter : 'none';
            try {
              ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
            } catch {
              ctx.fillStyle = '#111';
              ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
            }
            ctx.filter = 'none';

            const chroma = clip.advancedEffects?.find(e => e.type === 'chroma-key');
            if (chroma && chroma.isActive && chroma.params?.keyColor) {
              try {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = drawW;
                tempCanvas.height = drawH;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                  tempCtx.drawImage(video, 0, 0, drawW, drawH);
                  const imageData = tempCtx.getImageData(0, 0, drawW, drawH);
                  const data = imageData.data;
                  const kr = parseInt((chroma.params.keyColor as string).slice(1, 3), 16);
                  const kg = parseInt((chroma.params.keyColor as string).slice(3, 5), 16);
                  const kb = parseInt((chroma.params.keyColor as string).slice(5, 7), 16);
                  const tol = ((chroma.params.tolerance as number) || 40) * 2.55;
                  for (let i = 0; i < data.length; i += 4) {
                    const dist = Math.sqrt((data[i] - kr) ** 2 + (data[i + 1] - kg) ** 2 + (data[i + 2] - kb) ** 2);
                    if (dist < tol) data[i + 3] = 0;
                  }
                  tempCtx.putImageData(imageData, 0, 0);
                  ctx.drawImage(tempCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
                }
              } catch {
                // ignore chroma key errors
              }
            }
          } else {
            ctx.fillStyle = '#111';
            ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
          }
        } else if (clip.type === TrackType.IMAGE && clip.src) {
          const img = new window.Image();
          img.src = clip.src;
          ctx.filter = filter !== 'none' ? filter : 'none';
          if (img.complete) {
            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
          } else {
            ctx.fillStyle = '#222';
            ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
          }
          ctx.filter = 'none';
        }

        ctx.restore();
      };

      if (transitionCtx && transitionCtx.transition) {
        const { incoming, outgoing, transition } = transitionCtx;
        const progress = Math.max(0, Math.min(1, (project.currentTime - incoming.startTime) / transition.duration));
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        drawClip(outgoing, 1 - progress);
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        drawClip(incoming, progress);
        ctx.restore();
      } else {
        for (const clip of activeVisualClips) {
          drawClip(clip);
        }
      }

      // Adjustment layer blend
      for (const track of project.tracks) {
        if (track.type !== TrackType.VIDEO || track.isHidden) continue;
        for (const clip of track.clips) {
          if (clip.type !== TrackType.VIDEO || !clip.properties?.adjustmentLayer) continue;
          if (project.currentTime < clip.startTime || project.currentTime >= clip.startTime + clip.duration) continue;
          const filter = buildFilterString(clip);
          if (filter !== 'none') {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (rect) {
              ctx.save();
              ctx.globalCompositeOperation = 'overlay';
              ctx.filter = filter;
              ctx.globalAlpha = 0.5;
              ctx.drawImage(canvasRef.current, 0, 0, rect.width, rect.height);
              ctx.restore();
            }
          }
        }
      }

      for (const clip of activeTextClips) {
        const opacity = clip.properties?.opacity ?? 1;
        const scale = clip.properties?.scale || 1;
        const x = clip.properties?.x || 0;
        const y = clip.properties?.y || 0;
        const rotation = clip.properties?.rotation || 0;
        const text = clip.properties?.text || clip.name;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(ox + drawW / 2 + x * drawW / project.width, oy + drawH / 2 + y * drawH / project.height);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
        ctx.font = `bold ${(clip.properties?.fontSize || 60) * (drawW / project.width)}px ${clip.properties?.fontFamily || 'sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [project, isPlaying, playbackSpeed, activeVisualClips, activeTextClips, transitionCtx]);

  useEffect(() => {
    for (const [, video] of videosRef.current) {
      if (isPlaying) video.play().catch(() => {});
      else video.pause();
    }
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block cursor-crosshair"
      onClick={onCanvasClick}
      style={{ aspectRatio: `${project.width} / ${project.height}`, maxWidth: '100%', maxHeight: '100%' }}
    />
  );
};

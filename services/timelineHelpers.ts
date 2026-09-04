import { Project, Clip, Marker, TrackType, Track } from '../types';

export interface SnapCandidate {
  time: number;
  type: 'playhead' | 'clip-start' | 'clip-end' | 'marker';
  trackId?: string;
  clipId?: string;
  label?: string;
}

export function getSnapCandidates(project: Project, excludeClipId?: string): SnapCandidate[] {
  const candidates: SnapCandidate[] = [
    { time: project.currentTime, type: 'playhead', label: 'Playhead' },
  ];
  if (project.markers) {
    for (const m of project.markers) {
      candidates.push({ time: m.time, type: 'marker', label: m.label, clipId: m.id });
    }
  }
  for (const track of project.tracks) {
    for (const clip of track.clips) {
      if (excludeClipId && clip.id === excludeClipId) continue;
      candidates.push({ time: clip.startTime, type: 'clip-start', trackId: track.id, clipId: clip.id, label: clip.name });
      candidates.push({ time: clip.startTime + clip.duration, type: 'clip-end', trackId: track.id, clipId: clip.id, label: clip.name });
    }
  }
  return candidates;
}

export function snapTimeToCandidate(time: number, candidates: SnapCandidate[], thresholdPx: number, pxPerSecond: number): number | null {
  const thresholdSec = thresholdPx / Math.max(pxPerSecond, 1);
  let best = time;
  let bestDist = Infinity;
  for (const c of candidates) {
    const dist = Math.abs(c.time - time);
    if (dist < bestDist && dist <= thresholdSec) {
      bestDist = dist;
      best = c.time;
    }
  }
  return bestDist < Infinity ? best : null;
}

export interface RippleDeleteResult {
  tracks: Track[];
  shiftAmount: number;
}

export function rippleDeleteClip(project: Project, clipId: string, deleteFromTime: number): Project {
  const rippleDuration = (() => {
    for (const track of project.tracks) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) return clip.duration;
    }
    return 0;
  })();

  const newTracks = project.tracks.map((track) => ({
    ...track,
    clips: track.clips
      .filter((c) => c.id !== clipId)
      .map((c) => {
        if (c.startTime >= deleteFromTime) {
          return { ...c, startTime: c.startTime - rippleDuration };
        }
        return c;
      }),
  }));

  return { ...project, tracks: newTracks };
}

export function liftDeleteClip(project: Project, clipId: string): Project {
  const newTracks = project.tracks.map((track) => ({
    ...track,
    clips: track.clips.filter((c) => c.id !== clipId),
  }));
  return { ...project, tracks: newTracks };
}

export function isPlayheadBetween(startTime: number, duration: number, currentTime: number): boolean {
  return currentTime >= startTime && currentTime <= startTime + duration;
}

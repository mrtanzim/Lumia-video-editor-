export enum TrackType {
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
}

export interface Effect {
  id: string;
  type: 'blur' | 'brightness' | 'grayscale' | 'sepia';
  value: number;
}

export interface Transition {
  type: 'fade' | 'wipe' | 'zoom' | 'slide-left' | 'slide-right' | 'dissolve' | 'iris';
  duration: number;
}

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  type: TrackType;
  startTime: number; // Position in timeline (seconds)
  duration: number; // Duration in timeline (seconds)
  src?: string; // URL for media
  color: string;
  trimStart: number; // Source start time
  trimEnd: number; // Source end time
  properties?: {
    volume?: number;
    opacity?: number;
    rotation?: number;
    scale?: number;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    x?: number;
    y?: number;
  };
  effects?: Effect[];
  transitionIn?: Transition;
  transitionOut?: Transition;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  isMuted?: boolean;
  isHidden?: boolean;
  isLocked?: boolean;
}

export interface Project {
  id: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  tracks: Track[];
  currentTime: number;
  lastModified: number;
}

export interface AIAnalysisResult {
  segments: {
    start: number;
    end: number;
    reason: string;
    score: number;
  }[];
}
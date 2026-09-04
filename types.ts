
export enum TrackType {
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
  IMAGE = 'image',
}

export interface Effect {
  id: string;
  type: 'blur' | 'brightness' | 'grayscale' | 'sepia' | 'contrast' | 'saturate' | 'hue-rotate';
  value: number;
}

export interface AdvancedEffect {
  id: string;
  type: 'posterize' | 'pixelate' | 'vignette' | 'glitch' | 'chroma-key' | 'lens-distortion' | 'fisheye' | 'edge-detection';
  name: string;
  isActive: boolean;
  params: Record<string, number | string | boolean>;
}

export interface Keyframe {
  id: string;
  time: number; // relative to clip start
  property: string;
  value: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
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
  speed?: number;
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
    flipH?: boolean;
    flipV?: boolean;
    crop?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    // Phase 2 Properties
    transform3d?: {
      rotateX: number;
      rotateY: number;
      rotateZ: number;
      zDepth: number;
    };
    mask?: {
      shape: 'none' | 'rectangle' | 'circle';
      feather: number;
      inverted: boolean;
    };
    stabilization?: {
      enabled: boolean;
      smoothness: number;
    };
  };
  // Phase 3 AI Configuration
  ai?: {
    autoEnhance?: { enabled: boolean; intensity: number; preset: string };
    backgroundRemoval?: { enabled: boolean; mode: 'transparent' | 'blur' | 'color'; value?: string };
    smartCrop?: { enabled: boolean; aspectRatio: string; smoothness: number };
    objectRemoval?: { enabled: boolean; objects: { id: string; rect: any }[] };
    subtitles?: { enabled: boolean; language: string; style: string };
    audioEnhance?: { enabled: boolean; denoise: number; voiceIsolation: number };
    colorMatch?: { enabled: boolean; targetClipId?: string; strength: number };
    motionTracking?: { enabled: boolean; targetId?: string; type: 'position' | 'scale' | 'rotation' };
    upscaling?: { enabled: boolean; scale: 2 | 4; quality: 'fast' | 'high' };
    sceneDetection?: { enabled: boolean; sensitivity: 'low' | 'medium' | 'high' };
    smartBlur?: { enabled: boolean; target: 'face' | 'license' | 'custom'; strength: number };
  };
  metadata?: {
    tags?: string[];
    notes?: string;
    rating?: number;
    labelColor?: string;
  };
  effects?: Effect[]; // Legacy simple effects
  advancedEffects?: AdvancedEffect[]; // Phase 2 effects
  audioEffects?: {
    equalizer?: number[]; // 10 bands
    compressor?: { threshold: number; ratio: number };
    reverb?: { mix: number; preset: string };
  };
  keyframes?: Keyframe[];
  transitionIn?: Transition;
  transitionOut?: Transition;
  captions?: { id: string; start: number; end: number; text: string }[];
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  isMuted?: boolean;
  isHidden?: boolean;
  isLocked?: boolean;
  isSolo?: boolean;
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
  markers?: Marker[];
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

export interface Marker {
  id: string;
  time: number;
  label: string;
  color: string;
}


// --- NEW SETTINGS TYPES ---

export interface ExportRecord {
  id: string;
  filename: string;
  format: string;
  resolution: string;
  size: string;
  date: number;
  duration: string;
  status: 'success' | 'failed' | 'in-progress';
  thumbnail?: string;
}

export interface UserSettings {
  appearance: {
    theme: 'dark' | 'light' | 'auto';
    accentColor: string;
    uiDensity: 'compact' | 'comfortable' | 'spacious';
    enableAnimations: boolean;
    showGrid: boolean;
    showRuler: boolean;
  };
  performance: {
    hardwareAcceleration: boolean;
    previewQuality: 'low' | 'medium' | 'high';
    ramLimit: number; // GB
  };
  projectDefaults: {
    autoSave: boolean;
    autoSaveInterval: number; // minutes
    defaultDuration: number;
    defaultResolution: '720p' | '1080p' | '4K';
  };
  exportDefaults: {
    format: 'mp4' | 'webm' | 'mov';
    codec: 'h264' | 'h265' | 'vp9';
    quality: number; // 0-51
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
  };
}

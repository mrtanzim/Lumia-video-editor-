export interface ProjectSettings {
  width: number;
  height: number;
  fps: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5';
  rippleEdit: boolean;
}

export const ASPECT_RATIOS: Record<string, { width: number; height: number; label: string }> = {
  '16:9': { width: 1920, height: 1080, label: 'Widescreen 16:9' },
  '9:16': { width: 1080, height: 1920, label: 'Vertical 9:16' },
  '1:1': { width: 1080, height: 1080, label: 'Square 1:1' },
  '4:5': { width: 1080, height: 1350, label: 'Portrait 4:5' },
};

export function getAspectRatioKey(width: number, height: number): ProjectSettings['aspectRatio'] {
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.05) return '9:16';
  if (Math.abs(ratio - 1 / 1) < 0.05) return '1:1';
  if (Math.abs(ratio - 4 / 5) < 0.05) return '4:5';
  return '16:9';
}

export function autoReframeClips(project: { width: number; height: number }, newAspect: { width: number; height: number }) {
  const scaleX = newAspect.width / project.width;
  const scaleY = newAspect.height / project.height;
  const scale = Math.min(scaleX, scaleY);
  return { scale, offsetX: 0, offsetY: 0 };
}

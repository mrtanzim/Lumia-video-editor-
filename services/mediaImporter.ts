export interface ImportedMedia {
  id: string;
  file: File;
  type: 'video' | 'audio' | 'image';
  src: string;
  duration: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  tags?: string[];
  transcript?: string;
}

export function extractVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration * 0.1);
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No 2d context'));
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video for thumbnail'));
    };
  });
}

export function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (file.type.startsWith('audio') || file.type.startsWith('video')) {
      const media = document.createElement(file.type.startsWith('audio') ? 'audio' : 'video');
      media.preload = 'metadata';
      media.src = URL.createObjectURL(file);
      media.onloadedmetadata = () => {
        resolve(media.duration);
        URL.revokeObjectURL(media.src);
      };
      media.onerror = () => {
        URL.revokeObjectURL(media.src);
        resolve(0);
      };
    } else {
      resolve(0);
    }
  });
}

export async function importFiles(files: FileList | File[]): Promise<ImportedMedia[]> {
  const arr = Array.from(files);
  const results: ImportedMedia[] = await Promise.all(
    arr.map(async (file) => {
      const type = file.type.startsWith('video')
        ? 'video'
        : file.type.startsWith('audio')
          ? 'audio'
          : 'image';
      const src = URL.createObjectURL(file);
      const [duration, thumbnail] = await Promise.all([
        getMediaDuration(file),
        type === 'video' ? extractVideoThumbnail(file).catch(() => undefined) : Promise.resolve(undefined),
      ]);
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      const tags = name.split(' ').filter(w => w.length > 2).slice(0, 5);
      tags.push(type);
      return {
        id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        file,
        type,
        src,
        duration,
        thumbnail,
        tags,
        transcript: type === 'video' || type === 'audio' ? '' : undefined,
      };
    })
  );
  return results;
}

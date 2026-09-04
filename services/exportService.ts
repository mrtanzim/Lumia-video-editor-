export interface ExportOptions {
  format: 'mp4' | 'webm';
  resolution: { width: number; height: number };
  fps: number;
  quality: number;
}

export async function exportProject(project: { width: number; height: number; fps: number; tracks: any[]; duration: number }, canvas: HTMLCanvasElement, options: ExportOptions): Promise<Blob> {
  const stream = canvas.captureStream(options.fps);
  const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') ? 'video/webm; codecs=vp9' : 'video/webm';
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: options.quality * 500000 });
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
    recorder.onerror = (e) => reject(e);

    recorder.start();

    const startTime = performance.now();
    const totalDuration = project.duration * 1000;

    const renderFrame = () => {
      const elapsed = performance.now() - startTime;
      const currentTime = elapsed / 1000;
      if (currentTime >= project.duration) {
        recorder.stop();
        return;
      }
      // The canvas compositor will handle rendering per frame via rAF
      requestAnimationFrame(renderFrame);
    };

    requestAnimationFrame(renderFrame);

    setTimeout(() => {
      recorder.stop();
    }, totalDuration + 500);
  });
}

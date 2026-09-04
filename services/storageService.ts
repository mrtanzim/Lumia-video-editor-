
import { UserSettings, ExportRecord } from '../types';

const SETTINGS_KEY = 'lumina_settings_v1';
const HISTORY_KEY = 'lumina_export_history_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  appearance: {
    theme: 'dark',
    accentColor: 'indigo',
    uiDensity: 'comfortable',
    enableAnimations: true,
    showGrid: true,
    showRuler: true,
  },
  performance: {
    hardwareAcceleration: true,
    previewQuality: 'medium',
    ramLimit: 4,
  },
  projectDefaults: {
    autoSave: true,
    autoSaveInterval: 5,
    defaultDuration: 30,
    defaultResolution: '1080p',
  },
  exportDefaults: {
    format: 'mp4',
    codec: 'h264',
    quality: 23,
  },
  privacy: {
    analytics: true,
    crashReports: true,
  }
};

export const storageService = {
  getSettings: async (): Promise<UserSettings> => {
    try {
      const response = await fetch('/api/projects/settings');
      if (response.ok) {
        const data = await response.json();
        return { ...DEFAULT_SETTINGS, ...data };
      }
    } catch (e) { }
    return DEFAULT_SETTINGS;
  },

  saveSettings: async (settings: UserSettings) => {
    await fetch('/api/projects/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  },

  getExportHistory: async (): Promise<ExportRecord[]> => {
    try {
      const resp = await fetch('/api/assets/exports');
      return resp.ok ? await resp.json() : [];
    } catch (e) {
      return [];
    }
  },

  addExportRecord: async (record: ExportRecord) => {
    await fetch('/api/assets/exports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
  },

  clearHistory: async () => {
    await fetch('/api/assets/exports', { method: 'DELETE' });
  },

  // Added Project Methods
  getProjects: async () => {
    const resp = await fetch('/api/projects');
    return resp.ok ? await resp.json() : [];
  },

  getProject: async (id: string) => {
    const resp = await fetch(`/api/projects/${id}`);
    return resp.ok ? await resp.json() : null;
  },

  saveProject: async (project: any) => {
    const resp = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });
    return resp.ok ? await resp.json() : null;
  },

  deleteProject: async (id: string) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  },

  // Asset Methods
  getAssets: async () => {
    try {
      // Add cache busted timestamp to ensure we get fresh data
      const resp = await fetch(`/api/assets?t=${Date.now()}`);
      return resp.ok ? await resp.json() : [];
    } catch (e) {
      return [];
    }
  },

  uploadAsset: async (file: File, onProgress?: (percent: number) => void) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.timeout = 600000; // 10 minutes timeout
      xhr.open('POST', '/api/assets/upload', true);
      xhr.setRequestHeader('X-Original-Size', file.size.toString());

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));
      xhr.send(formData);
    });
  }
};

import { projectStore } from './projectStore';
import { Project } from '../types';

const AUTOSAVE_KEY = 'lumina_autosave';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function autosaveProject(project: Project, delayMs = 2000): Promise<void> {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      await projectStore.saveAutosave(project);
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
    } catch {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
    }
  }, delayMs);
}

export function loadAutosavedProject(): Project | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.tracks) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

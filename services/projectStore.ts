import { Project } from '../types';

const DB_NAME = 'lumina_editor';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_AUTOSAVE = 'autosave';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUTOSAVE)) {
        db.createObjectStore(STORE_AUTOSAVE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const r = fn(s);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      })
  );
}

export const projectStore = {
  async saveProject(project: Project): Promise<void> {
    const record = { ...project, lastModified: Date.now() };
    try {
      await tx(STORE_PROJECTS, 'readwrite', (s) => s.put(record));
    } catch (e) {
      console.warn('[projectStore] IndexedDB save failed, falling back to localStorage', e);
      localStorage.setItem(`project_${project.id}`, JSON.stringify(record));
    }
  },

  async loadProject(id: string): Promise<Project | null> {
    try {
      return (await tx(STORE_PROJECTS, 'readonly', (s) => s.get(id))) ?? null;
    } catch {
      const raw = localStorage.getItem(`project_${id}`);
      return raw ? JSON.parse(raw) : null;
    }
  },

  async listProjects(): Promise<Project[]> {
    try {
      return (await tx(STORE_PROJECTS, 'readonly', (s) => s.getAll())) ?? [];
    } catch {
      return [];
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      await tx(STORE_PROJECTS, 'readwrite', (s) => s.delete(id));
    } catch {
      localStorage.removeItem(`project_${id}`);
    }
  },

  async saveAutosave(project: Project): Promise<void> {
    const record = { id: 'current', ...project, lastModified: Date.now() };
    try {
      await tx(STORE_AUTOSAVE, 'readwrite', (s) => s.put(record));
    } catch {
      localStorage.setItem('lumina_autosave', JSON.stringify(record));
    }
  },

  async loadAutosave(): Promise<Project | null> {
    try {
      const r = (await tx(STORE_AUTOSAVE, 'readonly', (s) => s.get('current'))) as (Project & { id: string }) | undefined;
      if (r) {
        const { id: _omit, ...rest } = r;
        return rest as Project;
      }
    } catch {
      const raw = localStorage.getItem('lumina_autosave');
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
    }
    return null;
  },
};

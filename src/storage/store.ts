import { sanitizeProfile } from '../core/profile';
import type { Lang, Profile } from '../core/types';

/** Device-wide state that belongs to no single player. */
export interface Meta {
  activeProfileId: string | null;
  /** Language of the screens before a player is chosen (picker, parents' corner). */
  uiLang: Lang;
}

export const DEFAULT_META: Meta = { activeProfileId: null, uiLang: 'sl' };

/** Everything stays on the device (spec §11): no network, no accounts. */
export interface ProfileStore {
  load(): Promise<{ profiles: Profile[]; meta: Meta }>;
  saveProfile(profile: Profile): Promise<void>;
  deleteProfile(id: string): Promise<void>;
  saveMeta(meta: Meta): Promise<void>;
}

function sanitizeMeta(raw: unknown): Meta {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    activeProfileId: typeof r.activeProfileId === 'string' ? r.activeProfileId : null,
    uiLang: r.uiLang === 'en' ? 'en' : 'sl',
  };
}

function finish(rawProfiles: unknown[], rawMeta: unknown): { profiles: Profile[]; meta: Meta } {
  const profiles = rawProfiles
    .map(sanitizeProfile)
    .filter((p): p is Profile => p !== null)
    .sort((x, y) => x.createdAt - y.createdAt);
  const meta = sanitizeMeta(rawMeta);
  if (meta.activeProfileId && !profiles.some((p) => p.id === meta.activeProfileId)) meta.activeProfileId = null;
  return { profiles, meta };
}

/** Used when IndexedDB is unavailable (some private windows): the game works, nothing is kept. */
export class MemoryStore implements ProfileStore {
  private profiles = new Map<string, Profile>();
  private meta: Meta = { ...DEFAULT_META };

  async load() {
    return finish(structuredClone([...this.profiles.values()]), structuredClone(this.meta));
  }
  async saveProfile(profile: Profile) {
    this.profiles.set(profile.id, structuredClone(profile));
  }
  async deleteProfile(id: string) {
    this.profiles.delete(id);
  }
  async saveMeta(meta: Meta) {
    this.meta = structuredClone(meta);
  }
}

const DB_NAME = 'varuh-stevil';
const DB_VERSION = 1;
const PROFILES = 'profiles';
const META = 'meta';
const META_KEY = 'meta';

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class IdbStore implements ProfileStore {
  private constructor(private readonly db: IDBDatabase) {}

  static async open(factory: IDBFactory = indexedDB, name = DB_NAME): Promise<IdbStore> {
    const req = factory.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROFILES)) db.createObjectStore(PROFILES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    return new IdbStore(await request(req));
  }

  private tx(stores: string[], mode: IDBTransactionMode) {
    return this.db.transaction(stores, mode);
  }

  private done(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async load() {
    const tx = this.tx([PROFILES, META], 'readonly');
    const [profiles, meta] = await Promise.all([
      request(tx.objectStore(PROFILES).getAll()),
      request(tx.objectStore(META).get(META_KEY)),
    ]);
    return finish(profiles, meta);
  }

  async saveProfile(profile: Profile) {
    const tx = this.tx([PROFILES], 'readwrite');
    tx.objectStore(PROFILES).put(structuredClone(profile));
    await this.done(tx);
  }

  async deleteProfile(id: string) {
    const tx = this.tx([PROFILES], 'readwrite');
    tx.objectStore(PROFILES).delete(id);
    await this.done(tx);
  }

  async saveMeta(meta: Meta) {
    const tx = this.tx([META], 'readwrite');
    tx.objectStore(META).put(structuredClone(meta), META_KEY);
    await this.done(tx);
  }
}

/** Opens IndexedDB and asks the browser to keep it; falls back to memory when storage is blocked. */
export async function openStore(): Promise<{ store: ProfileStore; persistent: boolean }> {
  try {
    const store = await IdbStore.open();
    void navigator.storage?.persist?.().catch(() => false);
    return { store, persistent: true };
  } catch {
    return { store: new MemoryStore(), persistent: false };
  }
}

import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { createProfile, defaultProfileInput, normalizeInput } from '../src/core/profile';
import { IdbStore, MemoryStore, type ProfileStore } from '../src/storage/store';

const make = (name: string, createdAt: number) => createProfile(normalizeInput({ ...defaultProfileInput(), name }).value, createdAt);

const stores: [string, () => Promise<ProfileStore>][] = [
  ['MemoryStore', async () => new MemoryStore()],
  ['IdbStore', () => IdbStore.open(new IDBFactory())],
];

describe.each(stores)('%s', (_name, open) => {
  it('starts empty', async () => {
    const store = await open();
    expect(await store.load()).toEqual({ profiles: [], meta: { activeProfileId: null, uiLang: 'sl' } });
  });

  it('saves, updates, orders and deletes profiles', async () => {
    const store = await open();
    const b = make('Eva', 2);
    const a = make('Nika', 1);
    await store.saveProfile(b);
    await store.saveProfile(a);
    await store.saveProfile({ ...b, speed: 'fast' });
    let { profiles } = await store.load();
    expect(profiles.map((p) => p.name)).toEqual(['Nika', 'Eva']);
    expect(profiles[1].speed).toBe('fast');
    await store.deleteProfile(a.id);
    ({ profiles } = await store.load());
    expect(profiles.map((p) => p.name)).toEqual(['Eva']);
  });

  it('keeps meta and forgets an active id whose profile is gone', async () => {
    const store = await open();
    const a = make('Nika', 1);
    await store.saveProfile(a);
    await store.saveMeta({ activeProfileId: a.id, uiLang: 'en' });
    expect((await store.load()).meta).toEqual({ activeProfileId: a.id, uiLang: 'en' });
    await store.deleteProfile(a.id);
    expect((await store.load()).meta.activeProfileId).toBeNull();
  });
});

describe('IdbStore', () => {
  it('data survives reopening the database', async () => {
    const factory = new IDBFactory();
    const first = await IdbStore.open(factory, 'reopen');
    await first.saveProfile(make('Nika', 1));
    const second = await IdbStore.open(factory, 'reopen');
    expect((await second.load()).profiles.map((p) => p.name)).toEqual(['Nika']);
  });
});

import type { Profile } from './types';

/** Milestone 1 has one built-in profile; profiles and the parent area come in milestone 2. */
export const DEFAULT_PROFILE: Profile = {
  name: 'Nika',
  heroName: 'Nika',
  gender: 'girl',
  lang: 'sl',
  speed: 'normal',
  settings: {
    ops: ['add', 'sub'],
    range: 20,
    missingNumber: true,
  },
};

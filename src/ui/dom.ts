export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export type ChipType = 'radio' | 'checkbox';

/** A pressable option tile backed by a real radio or checkbox, so forms and keyboards work as usual. */
export function chip(name: string, value: string, checked: boolean, label: string, type: ChipType): string {
  return `<label class="chip"><input type="${type}" name="${name}" value="${escapeHtml(value)}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
}

export const ICONS = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z" fill="currentColor"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',
  people: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" fill="currentColor"/><circle cx="17" cy="9" r="2.8" fill="currentColor"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6zM15 20c0-2-.6-3.6-1.7-4.8 3.6-.4 7.7 1.2 8.7 4.8z" fill="currentColor"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
};

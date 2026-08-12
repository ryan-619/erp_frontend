// ====================================================================
// Tailwind Class Merge Helper (`cn`)
//
// Purpose:
// Combines conditional class lists (clsx) and resolves Tailwind utility
// conflicts (twMerge) so the last class wins — e.g. cn('p-4', 'p-2') → 'p-2'.
//
// Used by:
//   Virtually every component that accepts a `className` prop, enabling
//   callers to override or extend default styles without specificity hacks.
// ====================================================================

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

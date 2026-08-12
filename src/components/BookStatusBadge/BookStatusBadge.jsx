// ====================================================================
// Reusable Component — BookStatusBadge
//
// Used by: Library.
// Purpose: Book status — shows a book's availability state.
//          Available (green) = copies ready to borrow; Out (red) = all copies issued.
//          Displays "X / Y Available" when copies remain, "All Issued" when none do.
// ====================================================================

// BookStatusBadge — shows a book's availability state.
// Available (green) = copies ready to borrow; Out (red) = all copies issued.

import { cn } from '@/lib/utils'

export function BookStatusBadge({ available, quantity, className }) {
  const isAvailable = available > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        isAvailable
          ? 'bg-success/10 text-success border-success/20'
          : 'bg-destructive/10 text-destructive border-destructive/20',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {isAvailable ? `${available} / ${quantity} Available` : 'All Issued'}
    </span>
  )
}

export default BookStatusBadge

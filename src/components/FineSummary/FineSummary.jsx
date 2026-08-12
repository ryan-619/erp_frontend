// FineSummary — calculates and displays the fine for an overdue book.
// Fine = overdue days × rate per day. UI-only calculation; the backend
// will do the authoritative calculation when wired in.

import { differenceInCalendarDays } from 'date-fns'
import { cn } from '@/lib/utils'

// Fine rate per day in USD — configurable when backend is connected.
const FINE_PER_DAY = 2

// Calculate the fine for an issue record based on due date and return date.
// If the book is still overdue (not returned), we calculate up to today.
export function calculateFine(dueDate, returnDate) {
  if (!dueDate) return 0
  const reference = returnDate ? new Date(returnDate) : new Date()
  const due = new Date(dueDate)
  const overdueDays = differenceInCalendarDays(reference, due)
  return overdueDays > 0 ? overdueDays * FINE_PER_DAY : 0
}

export function FineSummary({ dueDate, returnDate, fine = 0, className }) {
  // If the backend already sent a fine amount, use it; otherwise calculate.
  const calculatedFine = fine > 0 ? fine : calculateFine(dueDate, returnDate)
  const isOverdue = calculatedFine > 0

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border p-3',
        isOverdue ? 'border-destructive/20 bg-destructive/5' : 'border-border bg-muted/20',
        className,
      )}
    >
      <div>
        <p className="text-xs font-medium text-muted-foreground">Fine Amount</p>
        <p className={cn('text-lg font-bold', isOverdue ? 'text-destructive' : 'text-foreground')}>
          ${calculatedFine.toFixed(2)}
        </p>
      </div>
      {isOverdue && (
        <span className="text-xs text-destructive">
          {fine > 0 ? 'Overdue fine applied' : 'Calculated from overdue days'}
        </span>
      )}
    </div>
  )
}

export default FineSummary

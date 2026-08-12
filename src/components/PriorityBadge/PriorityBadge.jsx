// PriorityBadge — a small pill that visually distinguishes complaint priority.
// Kept separate from StatusBadge because priority (high/medium/low) and
// status (open/in-progress/resolved) are conceptually different dimensions
// and use different color semantics.

import { cn } from '@/lib/utils'

// Color mapping — red for urgent, amber for medium, blue for low.
// Using /10 backgrounds keeps the pills subtle and readable on any theme.
const PRIORITY_STYLES = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-primary/10 text-primary border-primary/20',
}

export function PriorityBadge({ priority, className }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        style,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {priority}
    </span>
  )
}

export default PriorityBadge

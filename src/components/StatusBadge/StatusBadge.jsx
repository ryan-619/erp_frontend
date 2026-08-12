// ====================================================================
// Reusable Component — StatusBadge
//
// Used by: All modules.
// Purpose: Status indicator pill or dot. Maps a status string to a
//          color-coded badge via STATUS_STYLES from constants. Supports
//          a `variant` prop ('pill' | 'dot') for different display contexts.
//          Falls back to the 'inactive' style for unknown statuses.
// ====================================================================

import { cn } from '@/lib/utils'
import { STATUS_STYLES } from '@/constants/navigation'

const DOT_STYLES = {
  active: 'bg-success',
  inactive: 'bg-muted-foreground',
  pending: 'bg-warning',
  suspended: 'bg-destructive',
  disabled: 'bg-destructive',
}

export function StatusBadge({ status, className, variant = 'pill' }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.inactive
  const dot = DOT_STYLES[status] || 'bg-muted-foreground'

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-2 text-sm font-medium', className)}>
        <span className={cn('h-2 w-2 rounded-full', dot)} />
        <span className="capitalize">{status}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        style,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {status}
    </span>
  )
}

export default StatusBadge

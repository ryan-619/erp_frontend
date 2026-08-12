// AllocationStatusBadge
// Displays allocation status (active, vacated, pending) with color-coded badge.
// Used in Room Allocation and Student Hostel List pages.

import { cn } from '@/lib/utils'

const ALLOCATION_STATUS_STYLES = {
  active: 'bg-success/10 text-success border-success/20',
  vacated: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-warning/10 text-warning border-warning/20',
}

export function AllocationStatusBadge({ status, className }) {
  const style = ALLOCATION_STATUS_STYLES[status] || ALLOCATION_STATUS_STYLES.active

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        style,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

export default AllocationStatusBadge

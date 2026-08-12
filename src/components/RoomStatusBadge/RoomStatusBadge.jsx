// ====================================================================
// Reusable Component — RoomStatusBadge
//
// Used by: Hostel.
// Purpose: Room status — color-coded badge showing room availability
//          (available, occupied, partial, maintenance). Includes a colored
//          dot for quick visual scanning in room grids and lists.
// ====================================================================

// RoomStatusBadge
// Displays room availability status with color-coded badge.
// Used in Hostel Rooms, Dashboard, and Reports.

import { cn } from '@/lib/utils'

const ROOM_STATUS_STYLES = {
  available: 'bg-success/10 text-success border-success/20',
  occupied: 'bg-primary/10 text-primary border-primary/20',
  partial: 'bg-warning/10 text-warning border-warning/20',
  maintenance: 'bg-destructive/10 text-destructive border-destructive/20',
}

const ROOM_STATUS_DOT = {
  available: 'bg-success',
  occupied: 'bg-primary',
  partial: 'bg-warning',
  maintenance: 'bg-destructive',
}

export function RoomStatusBadge({ status, className }) {
  const style = ROOM_STATUS_STYLES[status] || ROOM_STATUS_STYLES.available
  const dot = ROOM_STATUS_DOT[status] || 'bg-muted-foreground'

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

export default RoomStatusBadge

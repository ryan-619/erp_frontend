// ====================================================================
// Reusable Component — OccupancyIndicator
//
// Used by: Hostel.
// Purpose: Visual occupancy — displays room occupancy percentage with a
//          progress bar. Color thresholds: green < 75%, amber 75–90%,
//          red > 90%. Gives an at-a-glance sense of how full a room is.
// ====================================================================

// OccupancyIndicator
// Displays room occupancy percentage with a visual progress bar.
// Green when under 75%, amber 75-90%, red over 90%.
// Used in Hostel Rooms, Dashboard, and Reports.

import { cn } from '@/lib/utils'

export function OccupancyIndicator({ occupied, capacity, className }) {
  const pct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0
  const isFull = pct >= 90
  const isNear = pct >= 75

  const barColor = isFull ? 'bg-destructive' : isNear ? 'bg-warning' : 'bg-success'
  const textColor = isFull ? 'text-destructive' : isNear ? 'text-warning' : 'text-success'

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{occupied} / {capacity} beds</span>
        <span className={cn('font-medium', textColor)}>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default OccupancyIndicator

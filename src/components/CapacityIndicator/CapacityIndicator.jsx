// CapacityIndicator — visual bar showing how full a vehicle is.
// Green when under 75%, amber 75-90%, red over 90%.

import { cn } from '@/lib/utils'

export function CapacityIndicator({ occupied, capacity, className }) {
  const pct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0
  const isFull = pct >= 90
  const isNear = pct >= 75

  const barColor = isFull ? 'bg-destructive' : isNear ? 'bg-warning' : 'bg-success'
  const textColor = isFull ? 'text-destructive' : isNear ? 'text-warning' : 'text-success'

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{occupied} / {capacity} seats</span>
        <span className={cn('font-medium', textColor)}>{pct}%</span>
      </div>
      {/* Progress bar — width reflects occupancy percentage */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default CapacityIndicator

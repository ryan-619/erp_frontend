import { cn } from '@/lib/utils'
import { STATUS_STYLES } from '@/constants/navigation'

// Compact status pill backed by the shared STATUS_STYLES map.
export function StatusBadge({ status, className }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.inactive
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

export default StatusBadge

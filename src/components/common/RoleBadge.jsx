import { cn } from '@/lib/utils'
import { ROLE_LABELS } from '@/constants/navigation'

const ROLE_STYLES = {
  superadmin: 'bg-primary/10 text-primary border-primary/20',
  admin: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  staff: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  student: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  parent: 'bg-muted text-muted-foreground border-border',
}

// Role pill backed by ROLE_LABELS. Pass either a role key or a label.
export function RoleBadge({ role, className }) {
  const key = Object.keys(ROLE_LABELS).find((k) => k === role)
  const label = ROLE_LABELS[role] || role
  const style = ROLE_STYLES[key] || ROLE_STYLES.parent
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        style,
        className,
      )}
    >
      {label}
    </span>
  )
}

export default RoleBadge

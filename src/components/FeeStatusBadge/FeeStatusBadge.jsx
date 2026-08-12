// ====================================================================
// Reusable Component — FeeStatusBadge
//
// Used by: Fees.
// Purpose: Fee status — shows a transport fee's payment status.
//          Paid (green), Partial (amber), Pending (red). Includes a colored
//          dot for quick visual scanning in fee tables.
// ====================================================================

// FeeStatusBadge — shows a transport fee's payment status.
// Paid (green), Partial (amber), Pending (red).

import { cn } from '@/lib/utils'

const FEE_STYLES = {
  paid: 'bg-success/10 text-success border-success/20',
  partial: 'bg-warning/10 text-warning border-warning/20',
  pending: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function FeeStatusBadge({ status, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', FEE_STYLES[status] || FEE_STYLES.pending, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}

export default FeeStatusBadge

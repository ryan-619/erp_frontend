// ====================================================================
// Reusable Component — Timeline
//
// Used by: Front Office.
// Purpose: Follow-up timeline — a vertical list of follow-up / progress notes.
//          Each entry shows a dot, the note text, the author, and a relative
//          timestamp. Used inside drawers to show the history of an enquiry
//          or complaint.
// ====================================================================

import { formatDate, formatRelativeTime } from '@/utils/format'
import { cn } from '@/lib/utils'

export function Timeline({ items = [], emptyMessage = 'No activity recorded yet.' }) {
  if (!items.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <ol className="relative space-y-5 border-l border-border pl-6">
      {items.map((item, i) => (
        <li key={item._id || i} className="relative">
          {/* Dot — positioned on the left border line */}
          <span
            className={cn(
              'absolute -left-[1.6rem] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-background bg-primary',
            )}
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">{item.note}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {item.by && <span className="font-medium">{item.by}</span>}
              <span>·</span>
              <span title={formatDate(item.date)}>{formatRelativeTime(item.date)}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default Timeline

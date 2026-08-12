// ====================================================================
// Reusable Component — Breadcrumbs
//
// Used by: All pages.
// Purpose: Navigation trail showing the path from the app root to the
//          current page. Last item renders as plain text (current page);
//          earlier items are links. Helps users understand their location
//          in the module hierarchy and jump back.
// ====================================================================

import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Breadcrumb trail. `items` is [{ label, to? }]; last item is rendered as text.
export function Breadcrumbs({ items, className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, idx) => {
          const last = idx === items.length - 1
          return (
            <li key={idx} className="flex items-center gap-1.5">
              {last || !item.to ? (
                <span className={cn('truncate', last ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs

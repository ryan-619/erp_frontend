// ====================================================================
// Reusable Component — PageHeader
//
// Used by: All pages.
// Purpose: Consistent page title, optional icon, description, and
//          right-aligned action buttons. Keeps the top of every page
//          visually uniform without repeating layout markup.
// ====================================================================

import { cn } from '@/lib/utils'

export function PageHeader({ title, description, actions, icon: Icon, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

export default PageHeader

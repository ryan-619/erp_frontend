// ====================================================================
// Reusable Component — ChartCard
//
// Used by: Dashboard, all module dashboards.
// Purpose: Consistent shell for chart blocks — optional title/description
//          header with an action slot, and a flexible content area that
//          renders any chart child. Keeps all charts visually uniform.
// ====================================================================

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Shell for chart blocks with optional title/description and action slot.
export function ChartCard({ title, description, action, children, className }) {
  return (
    <Card className={cn('flex flex-col', className)}>
      {(title || action) && (
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  )
}

export default ChartCard

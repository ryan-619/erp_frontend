import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCompact } from '@/utils/format'

// KPI metric card with trend indicator.
export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  accent = 'primary',
}) {
  const isUp = typeof trend === 'number' ? trend >= 0 : null
  const accentBg = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    chart4: 'bg-chart-4/10 text-chart-4',
    chart2: 'bg-chart-2/10 text-chart-2',
  }[accent]

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">
              {typeof value === 'number' ? formatCompact(value) : value}
            </p>
          </div>
          {Icon ? (
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl',
                accentBg,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
        {isUp !== null ? (
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold',
                isUp ? 'text-success' : 'text-destructive',
              )}
            >
              {isUp ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(trend)}%
            </span>
            {trendLabel ? (
              <span className="text-muted-foreground">{trendLabel}</span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default KpiCard

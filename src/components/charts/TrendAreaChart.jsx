// ====================================================================
// Reusable Component — TrendAreaChart
//
// Used by: Dashboard, all module dashboards.
// Purpose: Smooth area chart for time-series trends (e.g. attendance over
//          weeks, fee collection over months). `data` is [{ label, value }]
//          and `color` is a chart-1..5 key. Adapts grid/axis colors to the
//          active theme via useTheme.
// ====================================================================

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '@/context/ThemeContext'

// Smooth area chart for trend series.
// `data` is [{ label, value }] and `color` is a chart-1..5 key.
export function TrendAreaChart({ data, color = 'chart-1', height = 260 }) {
  const { isDark } = useTheme()
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axis = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={`hsl(var(--${color}))`} stopOpacity={0.35} />
            <stop offset="95%" stopColor={`hsl(var(--${color}))`} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: axis }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: axis }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--popover))',
            color: 'hsl(var(--popover-foreground))',
            fontSize: 12,
          }}
          labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={`hsl(var(--${color}))`}
          strokeWidth={2}
          fill={`url(#grad-${color})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default TrendAreaChart

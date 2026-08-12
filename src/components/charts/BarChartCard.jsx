// ====================================================================
// Reusable Component — BarChartCard
//
// Used by: Dashboard, all module dashboards.
// Purpose: Vertical bar chart for categorical comparisons (e.g. enrollment
//          by class, revenue by month). `data` is [{ label, value }] and
//          `color` is a chart-1..5 key. Adapts grid/axis colors to the
//          active theme via useTheme.
// ====================================================================

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '@/context/ThemeContext'

// Vertical bar chart. `data` is [{ label, value }] and `color` is a chart key.
export function BarChartCard({ data, color = 'chart-1', height = 260 }) {
  const { isDark } = useTheme()
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axis = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
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
          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
        />
        <Bar
          dataKey="value"
          fill={`hsl(var(--${color}))`}
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default BarChartCard

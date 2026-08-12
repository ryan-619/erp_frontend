// ====================================================================
// Reusable Component — DonutChart
//
// Used by: Dashboard, all module dashboards.
// Purpose: Donut chart with legend for part-to-whole comparisons (e.g.
//          gender distribution, payment status breakdown). `data` is
//          [{ label, value, color }] where color is a chart-1..5 key.
//          Renders percentage labels in the legend.
// ====================================================================

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useTheme } from '@/context/ThemeContext'

// Donut chart with legend. `data` is [{ label, value, color }] where color is a chart key.
export function DonutChart({ data, height = 240, innerRadius = 60, outerRadius = 90 }) {
  const { isDark } = useTheme()
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <ResponsiveContainer width="100%" height={height} className="!w-[180px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={`hsl(var(--${entry.color || 'chart-1'}))`} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: `hsl(var(--${d.color || 'chart-1'}))` }}
            />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-medium">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DonutChart

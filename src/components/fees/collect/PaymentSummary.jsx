import { Wallet, TrendingDown, BadgePercent, Scale } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/utils/format'

export function PaymentSummary({ summary }) {
  if (!summary) return null
  const items = [
    { label: 'Total Fees', value: summary.total, icon: Wallet, accent: 'text-primary bg-primary/10' },
    { label: 'Paid Amount', value: summary.paid, icon: TrendingDown, accent: 'text-success bg-success/10' },
    { label: 'Discount', value: summary.discount, icon: BadgePercent, accent: 'text-warning bg-warning/10' },
    { label: 'Balance Due', value: summary.balance, icon: Scale, accent: 'text-destructive bg-destructive/10' },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label} className="transition-shadow hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{it.label}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{formatCurrency(it.value)}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${it.accent}`}>
                <it.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default PaymentSummary

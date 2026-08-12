import { Wallet, TrendingUp, Clock, AlertTriangle, DollarSign, CreditCard } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { formatCurrency } from '@/utils/format'

export function FeeStats({ stats }) {
  if (!stats) return null
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Collected" value={formatCurrency(stats.totalCollected)} icon={Wallet} accent="success" trend={8} trendLabel="vs last month" />
      <StatCard label="Total Due" value={formatCurrency(stats.totalDue)} icon={Clock} accent="warning" trend={-4} trendLabel="vs last month" />
      <StatCard label="Pending Payments" value={stats.pendingPayments} icon={CreditCard} accent="primary" />
      <StatCard label="Overdue" value={stats.overdueCount} icon={AlertTriangle} accent="destructive" />
      <StatCard label="Today's Collection" value={formatCurrency(stats.todayCollected)} icon={DollarSign} accent="chart2" />
      <StatCard label="Online Collected" value={formatCurrency(stats.onlineCollected)} icon={TrendingUp} accent="chart3" />
      <StatCard label="Offline Collected" value={formatCurrency(stats.offlineCollected)} icon={Wallet} accent="chart4" />
      <StatCard label="Collection Rate" value={`${Math.round((stats.totalCollected / (stats.totalCollected + stats.totalDue)) * 100)}%`} icon={TrendingUp} accent="success" />
    </div>
  )
}

export default FeeStats

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency } from '@/utils/format'

export function FeeBreakdown({ breakdown }) {
  if (!breakdown?.length) return null
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Fee Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Fee Name</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="pr-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.map((f) => (
              <TableRow key={f._id}>
                <TableCell className="pl-6 font-medium">{f.fee_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(f.amount)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {f.discount > 0 ? formatCurrency(f.discount) : '—'}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(f.paid)}</TableCell>
                <TableCell className="pr-6">
                  <StatusBadge status={f.status.toLowerCase()} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default FeeBreakdown

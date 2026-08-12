import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { formatCurrency, formatDate } from '@/utils/format'

export function PaymentHistory({ history }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Payment History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {history?.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Receipt No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Collected By</TableHead>
                <TableHead className="pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="pl-6 font-mono text-xs font-medium">{p.receipt_no}</TableCell>
                  <TableCell>{formatDate(p.date)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                  <TableCell>{p.mode}</TableCell>
                  <TableCell className="text-muted-foreground">{p.collected_by}</TableCell>
                  <TableCell className="pr-6">
                    <StatusBadge status={p.status.toLowerCase()} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No payments recorded yet</p>
        )}
      </CardContent>
    </Card>
  )
}

export default PaymentHistory

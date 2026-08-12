import { Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatDate } from '@/utils/format'

export function ReceiptPreview({ open, onOpenChange, receipt, student }) {
  if (!receipt) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Fee Receipt</DialogTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border p-5">
            <div className="mb-4 text-center">
              <p className="text-lg font-bold">Scholaria ERP</p>
              <p className="text-xs text-muted-foreground">Fee Collection Receipt</p>
            </div>
            <div className="space-y-2 border-y py-3 text-sm">
              <Line label="Receipt No" value={receipt.receipt_no} />
              <Line label="Date" value={formatDate(receipt.date)} />
              <Line label="Student" value={student?.name || '—'} />
              <Line label="Admission No" value={student?.admission_no || '—'} />
              <Line label="Class" value={student?.class || '—'} />
              <Line label="Payment Mode" value={receipt.mode || 'Cash'} />
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <span className="font-medium">Amount Paid</span>
              <span className="text-lg font-bold text-success">{formatCurrency(receipt.amount)}</span>
            </div>
            <div className="border-t pt-3 text-center text-xs text-muted-foreground">
              This is a computer-generated receipt. Thank you for your payment.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Line({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export default ReceiptPreview

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { PAYMENT_MODES } from '@/constants/fees'

export function PaymentDrawer({ open, onOpenChange, summary, onCollect }) {
  const [form, setForm] = useState({
    amount: '',
    mode: 'Cash',
    discount: '',
    remarks: '',
  })

  const balance = summary?.balance ?? 0
  const amount = Number(form.amount) || 0

  const submit = () => {
    onCollect({ ...form, amount })
    setForm({ amount: '', mode: 'Cash', discount: '', remarks: '' })
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Collect Payment"
      description={`Outstanding balance: $${balance.toLocaleString()}`}
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel="Collect & Print"
          submitDisabled={amount <= 0}
          onSubmit={submit}
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label className="text-xs">Amount <span className="text-destructive">*</span></Label>
          <Input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Enter amount"
            required
          />
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, amount: String(balance) }))}
            className="text-xs text-primary hover:underline"
          >
            Pay full balance (${balance.toLocaleString()})
          </button>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Discount</Label>
          <Input
            type="number"
            value={form.discount}
            onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
            placeholder="Optional discount amount"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Payment Mode</Label>
          <select
            value={form.mode}
            onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Remarks</Label>
          <Input
            value={form.remarks}
            onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            placeholder="Optional notes"
          />
        </div>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}

export default PaymentDrawer

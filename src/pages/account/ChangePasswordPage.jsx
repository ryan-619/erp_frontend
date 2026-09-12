// ====================================================================
// Module: Account
// Page: Change Password — a signed-in user rotates their own password,
// and an administrator resets one for someone who is locked out.
//
// The admin panel is only rendered for admin/superadmin; the backend
// enforces the same rule, so this is convenience, not the control.
// ====================================================================

import { useState } from 'react'
import { KeyRound, Loader as Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { useAuth } from '@/context/AuthContext'
import { accountService } from '@/services/account.service'
import { toast } from '@/hooks/use-toast'

const MIN_LENGTH = 8
// Mirrors the backend rule in controllers/passwordController.js so the
// user finds out before a round-trip, not after.
const checkStrength = (pw) => {
  if (pw.length < MIN_LENGTH) return `At least ${MIN_LENGTH} characters`
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Needs at least one letter and one number'
  return null
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <Input {...props} />
    </div>
  )
}

function ChangeOwnPassword() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const strength = form.new_password ? checkStrength(form.new_password) : null
  const mismatch = form.confirm && form.new_password !== form.confirm
  const canSubmit = form.current_password && form.new_password && !strength && !mismatch && !busy

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    try {
      const res = await accountService.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      })
      toast({ title: 'Password changed', description: res?.message || 'Use your new password next time you sign in.' })
      setForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast({ title: 'Could not change password', description: err?.message || 'Try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-4 w-4" /> Your password</CardTitle>
        <CardDescription>You need your current password to set a new one.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid max-w-md gap-4">
          <Field label="Current password" type="password" autoComplete="current-password" value={form.current_password} onChange={set('current_password')} />
          <div>
            <Field label="New password" type="password" autoComplete="new-password" value={form.new_password} onChange={set('new_password')} />
            {strength && <p className="mt-1 text-xs text-destructive">{strength}</p>}
          </div>
          <div>
            <Field label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
            {mismatch && <p className="mt-1 text-xs text-destructive">Passwords do not match</p>}
          </div>
          <div>
            <Button type="submit" disabled={!canSubmit}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Change password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ResetSomeonesPassword() {
  const [form, setForm] = useState({ role: 'staff', email: '', new_password: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const strength = form.new_password ? checkStrength(form.new_password) : null
  const canSubmit = form.email && form.new_password && !strength && !busy

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    try {
      const res = await accountService.resetPassword(form)
      toast({ title: 'Password reset', description: res?.message || `${form.email} can now sign in with the new password.` })
      setForm({ role: form.role, email: '', new_password: '' })
    } catch (err) {
      toast({ title: 'Could not reset password', description: err?.message || 'Try again.', variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Reset someone's password</CardTitle>
        <CardDescription>For a member of staff or a student who has been locked out. Tell them to change it after signing in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid max-w-md gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Account type</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              value={form.role}
              onChange={set('role')}
            >
              <option value="staff">Staff</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Field label="Their email" type="email" value={form.email} onChange={set('email')} placeholder="teacher@school.test" />
          <div>
            <Field label="New password" type="text" value={form.new_password} onChange={set('new_password')} placeholder="Share this with them securely" />
            {strength && <p className="mt-1 text-xs text-destructive">{strength}</p>}
          </div>
          <div>
            <Button type="submit" variant="secondary" disabled={!canSubmit}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Reset password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ChangePasswordPage() {
  const { user } = useAuth()
  const canReset = user?.role === 'admin' || user?.role === 'superadmin'

  return (
    <div className="space-y-5 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Account' }, { label: 'Password' }]} />
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Password</h1>
        <p className="text-sm text-muted-foreground">Change your own password, or reset one for a colleague.</p>
      </div>
      <ChangeOwnPassword />
      {canReset && <ResetSomeonesPassword />}
    </div>
  )
}

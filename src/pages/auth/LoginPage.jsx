// ====================================================================
// Module: Auth
// Page: Login
//
// Purpose:
// Single reusable login page for all 5 roles (SuperAdmin, Admin, Staff,
// Student, Parent). The role selector determines which backend endpoint
// receives the credentials.
//
// Data Source:
//   auth.service.js → backend API
//
// Features:
//   - Role selector (5 roles)
//   - Email + password
//   - Show / hide password toggle
//   - Remember me (persists email)
//   - Loading state
//   - Error messages (401, 403, network, etc.)
// ====================================================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { GraduationCap, Loader as Loader2, Eye, EyeOff, ShieldCheck, Users, UserCog, GraduationCap as StudentIcon, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth, getRoleDashboard } from '@/context/AuthContext'
import { APP_NAME, USER_ROLES, ROLE_LABELS } from '@/constants/navigation'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = [
  { value: USER_ROLES.SUPER_ADMIN, label: ROLE_LABELS.superadmin, icon: ShieldCheck },
  { value: USER_ROLES.ADMIN, label: ROLE_LABELS.admin, icon: Users },
  { value: USER_ROLES.STAFF, label: ROLE_LABELS.staff, icon: UserCog },
  { value: USER_ROLES.STUDENT, label: ROLE_LABELS.student, icon: StudentIcon },
  { value: USER_ROLES.PARENT, label: ROLE_LABELS.parent, icon: UsersRound },
]

const REMEMBER_KEY = 'scholaria.login.remember'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [role, setRole] = useState(USER_ROLES.ADMIN)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const rememberedEmail = (() => {
    try {
      const raw = localStorage.getItem(REMEMBER_KEY)
      return raw ? JSON.parse(raw).email || '' : ''
    } catch {
      return ''
    }
  })()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: rememberedEmail,
      password: '',
      remember: Boolean(rememberedEmail),
    },
  })

  const onSubmit = async (values) => {
    setServerError('')
    try {
      const session = await login(role, { email: values.email, password: values.password })

      if (values.remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: values.email }))
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }

      navigate(getRoleDashboard(session.role))
    } catch (e) {
      const status = e?.status
      if (status === 401) {
        setServerError('Invalid email or password. Please try again.')
        toast({ title: 'Invalid credentials', description: 'Check your email and password.', variant: 'destructive' })
      } else if (status === 403) {
        setServerError('You do not have permission to access this panel.')
        toast({ title: 'Access denied', description: 'You do not have permission to access this panel.', variant: 'destructive' })
      } else if (status === 0 || e?.message?.includes('Network')) {
        setServerError('Unable to reach the server. Check your internet connection.')
        toast({ title: 'Network error', description: 'Unable to reach the server.', variant: 'destructive' })
      } else {
        setServerError(e?.message || 'Unable to sign in. Please try again.')
        toast({ title: 'Sign-in failed', description: e?.message || 'Please try again.', variant: 'destructive' })
      }
    }
  }

  return (
    <div>
      <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-bold">{APP_NAME}</span>
      </Link>

      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to the {APP_NAME} console. Select your role and enter your credentials.
        </p>
      </div>

      {/* Role Selector */}
      <div className="mt-6">
        <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Select Role
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {ROLE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const active = role === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border px-1 py-2.5 text-center transition-all duration-200',
                  active
                    ? 'border-primary bg-primary/5 text-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-accent',
                )}
                title={opt.label}
              >
                <Icon className={cn('h-4 w-4', active && 'text-primary')} />
                <span className="text-[10px] font-semibold leading-tight">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@institution.edu"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="#" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pr-10"
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" {...register('remember')} />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
            Remember my email
          </Label>
        </div>

        {serverError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
            </>
          ) : (
            `Sign in as ${ROLE_LABELS[role]}`
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Create one
        </Link>
      </p>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}

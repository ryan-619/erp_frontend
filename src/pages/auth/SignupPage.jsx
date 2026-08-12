// ====================================================================
// Module: Auth
// Page: Signup
//
// Purpose:
// Single reusable signup page for all 5 roles. Fields change dynamically
// based on the selected role, matching the backend controller's required
// fields (e.g. student needs first_name/last_name, admin needs name+phone).
//
// Data Source:
//   auth.service.js → backend API
// ====================================================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { GraduationCap, Loader as Loader2, Eye, EyeOff, ShieldCheck, Users, UserCog, GraduationCap as StudentIcon, UsersRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth, getRoleDashboard } from '@/context/AuthContext'
import { APP_NAME, USER_ROLES, ROLE_LABELS, SIGNUP_FIELDS } from '@/constants/navigation'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = [
  { value: USER_ROLES.SUPER_ADMIN, label: ROLE_LABELS.superadmin, icon: ShieldCheck },
  { value: USER_ROLES.ADMIN, label: ROLE_LABELS.admin, icon: Users },
  { value: USER_ROLES.STAFF, label: ROLE_LABELS.staff, icon: UserCog },
  { value: USER_ROLES.STUDENT, label: ROLE_LABELS.student, icon: StudentIcon },
  { value: USER_ROLES.PARENT, label: ROLE_LABELS.parent, icon: UsersRound },
]

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [role, setRole] = useState(USER_ROLES.ADMIN)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const fields = SIGNUP_FIELDS[role] || []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm()

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    reset()
    setServerError('')
  }

  const onSubmit = async (values) => {
    setServerError('')
    try {
      const result = await signup(role, values)
      if (result?.token) {
        navigate(getRoleDashboard(result.role))
      } else {
        navigate('/login')
      }
    } catch (e) {
      const status = e?.status
      if (status === 409) {
        setServerError('An account with this email already exists.')
        toast({ title: 'Account exists', description: 'An account with this email already exists.', variant: 'destructive' })
      } else if (status === 400) {
        setServerError(e?.message || 'Please check all required fields.')
        toast({ title: 'Missing fields', description: e?.message || 'Please check all required fields.', variant: 'destructive' })
      } else if (status === 0) {
        setServerError('Unable to reach the server. Check your internet connection.')
        toast({ title: 'Network error', description: 'Unable to reach the server.', variant: 'destructive' })
      } else {
        setServerError(e?.message || 'Unable to create account. Please try again.')
        toast({ title: 'Signup failed', description: e?.message || 'Please try again.', variant: 'destructive' })
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
        <h1 className="font-display text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Register for the {APP_NAME} platform. Fields adapt to your selected role.
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
                onClick={() => handleRoleChange(opt.value)}
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
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
            {field.type === 'password' ? (
              <div className="relative">
                <Input
                  id={field.name}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={field.placeholder}
                  className="pr-10"
                  {...register(field.name, field.required ? { required: `${field.label} is required` } : undefined)}
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
            ) : (
              <Input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                {...register(field.name, field.required ? { required: `${field.label} is required` } : undefined)}
              />
            )}
            {errors[field.name] && (
              <p className="text-xs text-destructive">{errors[field.name].message}</p>
            )}
          </div>
        ))}

        {serverError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            `Create ${ROLE_LABELS[role]} account`
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { APP_NAME } from '@/constants/navigation'

// ====================================================================
// AuthLayout — Centered Authentication Card Layout
//
// Purpose:
// A two-panel split layout for authentication screens (login, forgot
// password). The left panel renders the form via <Outlet>; the right panel
// shows branded marketing content to fill the screen on desktop.
//
// Responsive behavior:
//   - Desktop (lg+): 480px form panel + flexible brand panel side by side.
//   - Mobile: brand panel is hidden; the form panel takes full width and
//     is vertically centered.
// ====================================================================

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Form side */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 lg:w-[480px] lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Outlet />
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>

      {/* Brand side */}
      <div className="relative hidden flex-1 overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 0%, transparent 50%)' }} />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-display text-lg font-bold">{APP_NAME}</span>
          </Link>
          <div className="max-w-md space-y-4">
            <h2 className="font-display text-3xl font-bold leading-tight">
              The modern operating system for multi-tenant education.
            </h2>
            <p className="text-primary-foreground/70">
              Manage schools, colleges, students, and staff across every tenant —
              from a single, beautifully unified admin console.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div>
                <p className="font-display text-2xl font-bold">1,200+</p>
                <p className="text-sm text-primary-foreground/60">Institutions</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold">480K</p>
                <p className="text-sm text-primary-foreground/60">Students</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold">99.9%</p>
                <p className="text-sm text-primary-foreground/60">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

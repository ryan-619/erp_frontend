// ====================================================================
// PublicRoute — Guard for Unauthenticated-Only Pages
//
// Purpose:
// Wraps routes that should only be visible to logged-out users (login,
// forgot-password). If the user is already authenticated, they are
// redirected to `redirectTo` (default /dashboard) so they never see the
// login screen again while their session is valid.
//
// This is the inverse of ProtectedRoute — together they form the app's
// two-sided auth gating.
// ====================================================================

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Redirects authenticated users away from auth screens (e.g. login).
export function PublicRoute({ children, redirectTo = '/dashboard' }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to={redirectTo} replace />
  return children
}

export default PublicRoute

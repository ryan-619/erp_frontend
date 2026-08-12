import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useModules } from '@/context/ModuleContext'
import { ROLE_SIDEBAR } from '@/constants/navigation'

const SECTION_TO_MODULE = {
  dashboard: 'Dashboard',
  students: 'Students',
  academics: 'Academics',
  attendance: 'Attendance',
  examinations: 'Examinations',
  fees: 'Fees',
  hr: 'HR',
  library: 'Library',
  transport: 'Transport',
  hostel: 'Hostel',
  inventory: 'Inventory',
  'front-office': 'Front Office',
  certificate: 'Certificate',
  'front-cms': 'Front CMS',
  'settings-module': 'Settings',
  users: 'Users',
  schools: 'Schools',
  domains: 'Domains',
}

export function ProtectedRoute({ children, moduleId, allowedRoles }) {
  const { isAuthenticated, role } = useAuth()
  const { isModuleEnabled, hasPermission, isLoading } = useModules()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role-based access: if allowedRoles is specified, block other roles.
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  // While modules are loading, allow access to avoid flicker.
  if (isLoading) return children

  // Block access to disabled modules.
  if (moduleId && !isModuleEnabled(moduleId)) {
    return <Navigate to="/dashboard" replace />
  }

  // Block access if role permissions deny it.
  if (moduleId && !hasPermission(moduleId, 'view')) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute

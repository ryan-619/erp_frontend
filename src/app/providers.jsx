// ====================================================================
// Providers — Global Context Composition
//
// Wraps the entire app in all required Context providers in the correct
// nesting order so every component has access to shared state.
//
// Provider order:
//   ThemeProvider (outermost) — available to everything.
//   AuthProvider — provides session + tenant info.
//   ModuleProvider — depends on auth to fetch enabled modules + permissions.
// ====================================================================

import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ModuleProvider } from '@/context/ModuleContext'

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModuleProvider>{children}</ModuleProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default Providers

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { cn } from '@/lib/utils'

// ====================================================================
// AppLayout — Authenticated Application Shell
//
// Purpose:
// The persistent shell that wraps every protected page. Renders:
//   - A collapsible sidebar (desktop) for module navigation.
//   - A sticky navbar with the sidebar toggle, search, and user menu.
//   - A scrollable <main> region where the active route's <Outlet> renders.
//
// Layout structure:
//   [Sidebar | (Navbar / Main content)]
// The sidebar is hidden below `lg` breakpoint (mobile uses a drawer instead).
// The `collapsed` state lives here so the navbar toggle and sidebar stay in sync.
// ====================================================================

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
        <main className="scrollbar-thin flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout

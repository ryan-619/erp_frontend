import { Outlet } from 'react-router-dom'

// ====================================================================
// PublicLayout — Minimal Shell for Public Pages
//
// Purpose:
// The simplest possible layout wrapper — a full-height container with the
// app's background color. Used by routes that need no chrome (no sidebar,
// no navbar) such as landing pages, public notices, or embedded widgets.
//
// The <Outlet /> renders the matched child route inside this bare container.
// ====================================================================

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}

export default PublicLayout

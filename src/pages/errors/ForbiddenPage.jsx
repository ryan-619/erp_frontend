// ====================================================================
// Module: Errors
// Page: Forbidden
//
// Purpose:
// Show a 403 page when access is denied.
//
// Data Source:
// N/A
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { Link } from 'react-router-dom'
import { Hop as Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-display text-7xl font-bold text-destructive">403</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Access denied</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        You don't have permission to access this page. Contact your administrator if you believe this is a mistake.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild><Link to="/dashboard"><Home className="mr-2 h-4 w-4" /> Go to dashboard</Link></Button>
        <Button variant="outline" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go back</Button>
      </div>
    </div>
  )
}

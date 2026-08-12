// ====================================================================
// Module: Errors
// Page: Not Found
//
// Purpose:
// Show a 404 page when a route does not exist.
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

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-display text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild><Link to="/dashboard"><Home className="mr-2 h-4 w-4" /> Go to dashboard</Link></Button>
        <Button variant="outline" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go back</Button>
      </div>
    </div>
  )
}

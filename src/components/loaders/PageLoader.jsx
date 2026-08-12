import { Loader2 } from 'lucide-react'

// Full-screen route-level loader shown while lazy chunks resolve.
export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

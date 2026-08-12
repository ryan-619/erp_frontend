// ====================================================================
// Module: Settings
// Page: Modules
//
// Purpose:
// Enable or disable system modules (e.g., Students, Fees, Attendance, Library).
// Use the toggle switch to turn modules on or off. Disabled modules will be hidden from the navigation menu.
//
// Backend fields: module_name, module_type, status (active|inactive), icon
// ====================================================================

import { Boxes } from 'lucide-react'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useModules } from '@/hooks/useSettings'

export default function ModulesPage() {
  const { modules, isLoading, toggleModule } = useModules()

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Modules' }]} />
      <PageHeader
        title="Modules"
        description="Toggle system modules on or off. Disabled modules will be hidden from the navigation menu."
        icon={Boxes}
      />

      {isLoading ? (
        <LoadingSkeleton variant="cards" />
      ) : modules.length === 0 ? (
        <NoData title="No modules found" description="Modules have not been configured yet. Contact your administrator to set up system modules." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Card key={mod._id} className={mod.status === 'active' ? '' : 'opacity-60'}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{mod.module_name}</CardTitle>
                      <CardDescription className="text-xs">{mod.module_type || '—'}</CardDescription>
                    </div>
                  </div>
                  <Switch checked={mod.status === 'active'} onCheckedChange={() => toggleModule(mod)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={mod.status === 'active' ? 'default' : 'secondary'}>
                    {mod.status === 'active' ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {mod.icon && <span className="text-xs text-muted-foreground">{mod.icon}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

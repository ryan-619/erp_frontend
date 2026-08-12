// ====================================================================
// Module: Users
// Page: Roles
//
// Purpose:
// Manage roles and permissions for system users.
//
// Data Source:
// users.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo } from 'react'
import { Plus, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import PageHeader from '@/components/PageHeader'
import ListState from '@/components/common/ListState'
import { useAsyncData } from '@/hooks/useAsyncData'
import { usersService } from '@/services/users.service'
import { formatNumber } from '@/utils/format'

export default function RolesPage() {
  const { data, isLoading } = useAsyncData(() => usersService.roles(), [])
  const roles = data || []

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'User Management' }, { label: 'Roles' }]} />
      <PageHeader
        title="Roles & Permissions"
        description="Define roles and control what each role can access."
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Role
          </Button>
        }
      />
      <ListState
        isLoading={isLoading}
        isEmpty={!isLoading && roles.length === 0}
        emptyTitle="No roles defined"
        skeleton={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 rounded-xl bg-muted/40" />)}</div>}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role._id} className="transition-all hover:border-primary/30 hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <Badge variant="outline">{role.role_type}</Badge>
                </div>
                <CardTitle className="mt-3 text-base">{role.role_name}</CardTitle>
                <CardDescription>Manage permissions for this role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" /> Role permissions
                  </span>
                  <Button variant="ghost" size="sm">Manage</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ListState>
    </div>
  )
}

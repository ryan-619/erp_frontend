// ====================================================================
// Module: Users
// Page: Users
//
// Purpose:
// Manage system users and their access.
//
// Data Source:
// users.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Plus, MoveHorizontal as MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import PageHeader from '@/components/PageHeader'
import SearchBar from '@/components/SearchBar'
import FilterSelect from '@/components/common/FilterSelect'
import FilterBar from '@/components/FilterBar'
import ListState from '@/components/common/ListState'
import StatusBadge from '@/components/StatusBadge'
import DataTable from '@/components/DataTable'
import { useAsyncData } from '@/hooks/useAsyncData'
import { usersService } from '@/services/users.service'
import { STATUS_OPTIONS } from '@/constants/navigation'
import { initials } from '@/utils/format'

export default function UsersPage() {
  const { data, isLoading } = useAsyncData(() => usersService.list(), [])
  const [search, setSearch] = useState('')
  const [userType, setUserType] = useState('all')

  const rows = data || []
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const ms = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase())
        const mt = userType === 'all' || r.user_type === userType
        return ms && mt
      }),
    [rows, search, userType],
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(row.original.name)}
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: 'user_type', header: 'User Type' },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      {
        id: 'actions',
        header: '',
        cell: () => (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'User Management' }, { label: 'Users' }]} />
      <PageHeader
        title="Users"
        description="Manage platform users — admins, staff, students, and parents across tenants."
        actions={<Button><Plus className="mr-2 h-4 w-4" /> Invite User</Button>}
      />
      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search users…" className="max-w-sm" />
        <FilterSelect
          value={userType}
          onChange={setUserType}
          options={[
            { value: 'all', label: 'All types' },
            { value: 'admin', label: 'Admin' },
            { value: 'staff', label: 'Staff' },
            { value: 'student', label: 'Student' },
            { value: 'parent', label: 'Parent' },
          ]}
        />
      </FilterBar>
      <ListState isLoading={isLoading} isEmpty={!isLoading && filtered.length === 0} emptyTitle="No users found">
        <DataTable columns={columns} data={filtered} />
      </ListState>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Search, UserCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function StudentSearch({ students, onSelect, selected }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return students?.slice(0, 8) || []
    return (students || [])
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.admission_no.toLowerCase().includes(q) ||
          s.class.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [query, students])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, admission no, or class…"
          className="pl-9"
        />
      </div>
      <div className="max-h-80 space-y-1.5 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No students found</p>
        ) : (
          filtered.map((s) => (
            <button
              key={s._id}
              onClick={() => onSelect(s)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/40',
                selected?._id === s._id && 'border-primary bg-primary/5',
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {s.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.admission_no} · {s.class}
                </p>
              </div>
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default StudentSearch

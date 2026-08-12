import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronsLeft,
  Command,
  CornerDownLeft,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User as UserIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/sidebar/Sidebar'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { cn } from '@/lib/utils'


const getDisplayName = (name) => {
  if (typeof name === 'string') return name

  if (name && typeof name === 'object') {
    return [name.first, name.last].filter(Boolean).join(' ')
  }

  return 'User'
}

// Highlights the matching portion of text within a result label.
function HighlightMatch({ text, query }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/20 px-0.5 font-semibold text-primary">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

const NOTIFICATIONS = [
  { id: 1, title: 'New admission request', meta: 'Oakridge International', time: '2m ago' },
  { id: 2, title: 'Domain verification pending', meta: 'pinnacle.edu', time: '1h ago' },
  { id: 3, title: 'New admin joined', meta: 'Riverside Academy', time: '3h ago' },
]

// Sticky top header: collapse toggle, global search, command palette,
// notifications, theme toggle, and user profile dropdown.
export function Navbar({ collapsed, onToggleCollapse, onOpenMobile }) {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const {
    query, results, activeIndex, isOpen, inputRef,
    handleQueryChange, handleKeyDown, selectResult, open, close, setActiveIndex,
  } = useGlobalSearch()

  const displayName = getDisplayName(user?.name)

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system']
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile}>
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[var(--sidebar-width)] p-0">
          <Sidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleCollapse}
        className="hidden lg:inline-flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronsLeft className={cn('h-5 w-5 transition-transform duration-300', collapsed && 'rotate-180')} />
      </Button>

      {/* Global search with live suggestions and keyboard navigation */}
      <div className="relative hidden flex-1 max-w-lg sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={open}
          placeholder="Search pages, modules, settings…"
          className="h-9 pl-10 pr-16 text-sm"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground md:inline-flex">
          <Command className="h-3 w-3" />K
        </kbd>

        {/* Live search suggestions dropdown */}
        {isOpen && query && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No matching pages found
              </div>
            ) : (
              <ul className="max-h-80 overflow-y-auto p-1.5">
                {results.map((item, idx) => (
                  <li key={item.path}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectResult(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                        idx === activeIndex
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-accent',
                      )}
                    >
                      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium">
                          <HighlightMatch text={item.title} query={query} />
                        </span>
                        <span className="text-xs text-muted-foreground">{item.section}</span>
                      </div>
                      {idx === activeIndex && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Backdrop to close search when clicking outside */}
      {isOpen && query && (
        <div className="fixed inset-0 z-40" onClick={close} />
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {/* Mobile search trigger */}
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={open}>
          <Search className="h-5 w-5" />
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={cycleTheme} title="Toggle theme" aria-label="Toggle theme">
          {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <span className="text-xs font-normal text-muted-foreground">{NOTIFICATIONS.length} new</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NOTIFICATIONS.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2.5">
                <span className="text-sm font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">{n.meta} · {n.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm font-medium text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials || 'U'}
              </div>
              <span className="hidden text-sm font-medium md:inline-block">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email || 'alex@scholaria.io'}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2">
              <UserIcon className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2">
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={async () => { await logout(); navigate('/login') }}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default Navbar

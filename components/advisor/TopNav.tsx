'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, Flag, Settings, LogOut, Menu, X, Plus } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Logo } from '@/components/brand/Logo'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Dashboard', href: '/advisor/dashboard', icon: LayoutDashboard },
  { name: 'Clients',   href: '/advisor/clients',   icon: Users },
  { name: 'Reviews',   href: '/advisor/reviews',   icon: Calendar },
  { name: 'Flags',     href: '/advisor/flags',     icon: Flag },
  { name: 'Settings',  href: '/advisor/settings',  icon: Settings },
]

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-bg-secondary/70 backdrop-blur-xl">
      <div className="px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo size={30} />

          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm transition-colors ${
                  isActive(item.href) ? 'text-fg-primary font-semibold' : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/advisor/clients/new"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 hover:bg-accent/15 border border-accent/20 text-accent text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Client
            </Link>
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-fg-muted hover:text-danger hover:border-danger/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-fg-primary"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden pb-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive(item.href)
                    ? 'text-fg-primary font-semibold bg-bg-tertiary'
                    : 'text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
            <Link
              href="/advisor/clients/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 px-3 py-2 text-accent text-sm font-medium rounded-lg hover:bg-accent/10 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Client
            </Link>
            <button
              onClick={() => { setOpen(false); handleSignOut() }}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-fg-secondary hover:bg-bg-tertiary hover:text-danger transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

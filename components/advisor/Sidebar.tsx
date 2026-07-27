'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Flag,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  UserCircle,
} from 'lucide-react'
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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNav}
            className={`
              flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 group
              ${isActive
                ? 'bg-accent text-white shadow-sm'
                : 'text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary'
              }
            `}
          >
            <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-fg-muted group-hover:text-fg-primary'}`} />
            <span className="font-medium text-sm">{item.name}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex w-64 bg-bg-secondary border-r border-border h-screen flex-col fixed left-0 top-0 z-30">
        <div className="px-6 py-6 border-b border-border">
          <Logo size={32} href={null} />
          <p className="text-xs text-fg-muted mt-2">Advisory Platform</p>
        </div>

        <div className="px-4 pt-4 pb-2">
          <div className="flex gap-2">
            <Link
              href="/advisor/clients/new"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-accent/10 hover:bg-accent/15 border border-accent/20 text-accent text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Client
            </Link>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>

        <div className="border-t border-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-fg-primary truncate">Advisor</div>
                <div className="text-xs text-fg-muted">Active</div>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 w-full rounded-lg transition-colors text-fg-muted hover:bg-bg-tertiary hover:text-danger text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-bg-secondary border-b border-border px-4 py-3 flex items-center justify-between">
        <Logo size={28} href={null} />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded hover:bg-bg-tertiary transition-colors text-fg-secondary">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-bg-secondary h-full flex flex-col shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <Logo size={28} href={null} />
                <p className="text-xs text-fg-muted mt-2">Advisory Platform</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded hover:bg-bg-tertiary transition-colors text-fg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 pt-4 pb-2">
              <Link
                href="/advisor/clients/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-accent/10 hover:bg-accent/15 border border-accent/20 text-accent text-xs font-medium rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Client
              </Link>
            </div>
            <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
              <NavLinks onNav={() => setMobileOpen(false)} />
            </nav>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => { setMobileOpen(false); handleSignOut() }}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-fg-secondary hover:bg-bg-tertiary hover:text-danger transition-colors text-sm"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

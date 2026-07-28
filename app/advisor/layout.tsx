'use client'

import { TopNav } from '@/components/advisor/TopNav'

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav />
      <main className="min-w-0">
        {children}
      </main>
    </div>
  )
}

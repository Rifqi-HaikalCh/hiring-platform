import React from 'react'
import { cn } from '@/lib/utils'

interface FooterProps {
  isSidebarCollapsed?: boolean
}

export function Footer({ isSidebarCollapsed = false }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-12 flex items-center bg-white border-t border-gray-200 shadow-sm transition-all duration-300">
      {/* Container untuk konten dengan padding kiri dinamis seukuran sidebar di layar besar */}
      <div className={cn(
        "w-full px-6 transition-all duration-300",
        isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <p className="text-sm text-gray-600 text-center lg:text-left">
          Rifqi Haikal &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { NotificationBadge } from '@/components/ui/NotificationBadge'
import { Briefcase, User, LogOut, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 group-hover:from-teal-600 group-hover:to-teal-700 transition-all">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Hiring Platform</span>
          </Link>

          {/* Navigation Links and Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Navigation Links */}
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Briefcase className="h-4 w-4" />
              <span className="text-sm font-medium">Jobs</span>
            </Link>

            <Link
              href="/my-applications"
              className="hidden sm:flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">My Applications</span>
            </Link>

            {/* Notification Badge */}
            <NotificationBadge />

            {/* User Menu */}
            <div className="flex items-center space-x-2 pl-2 border-l border-gray-200">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{user.email}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

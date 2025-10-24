'use client'

import { User, LogOut, Briefcase } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { handleSignOut } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const router = useRouter()

  const onSignOut = async () => {
    const { error } = await handleSignOut()
    if (error) {
      toast.error('Error signing out')
    } else {
      toast.success('Signed out successfully')
      router.push('/auth')
    }
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Modern Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-gray-900">Hiring Platform</h1>
                  <p className="text-xs text-gray-500">Find your dream job</p>
                </div>
              </div>
            </div>

            {/* User actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100">
                  <User className="h-4 w-4 text-teal-700" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Candidate</span>
                  <span className="text-xs text-gray-500 truncate max-w-[150px]">{user?.email}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onSignOut}
                className="border-gray-300 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  )
}
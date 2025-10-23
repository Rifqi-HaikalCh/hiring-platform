'use client'

import { User, LogOut } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Hiring Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
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
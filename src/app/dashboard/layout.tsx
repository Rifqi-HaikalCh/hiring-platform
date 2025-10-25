'use client'

import { User, LogOut, Briefcase, FileText, Menu, X, ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { handleSignOut } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/Button'
import { Footer } from '@/components/layout/Footer'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PageTransition } from '@/components/ui/PageTransition'
import { LogoutConfirmModal } from '@/components/modals/LogoutConfirmModal'
import { NotificationBadge } from '@/components/ui/NotificationBadge';

const navigation = [
  { name: 'Job Listings', href: '/dashboard', icon: Briefcase },
  { name: 'My Applications', href: '/dashboard/applications', icon: FileText },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

const logoutItem = { name: 'Logout', icon: LogOut, isLogout: true }

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const onSignOut = async () => {
    setIsLoggingOut(true)
    const { error } = await handleSignOut()
    if (error) {
      toast.error('Error signing out')
      setIsLoggingOut(false)
    } else {
      toast.success('Signed out successfully')
      setShowLogoutModal(false)
      router.push('/auth')
    }
  }

  return (
    <div className="min-h-screen relative z-10 pb-12">
      {/* Sidebar for desktop */}
      <div className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col z-50 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "lg:w-20" : "lg:w-64"
      )}>
        <div className="flex flex-col flex-grow bg-white/70 backdrop-blur-xl border-r border-white/20 overflow-y-auto shadow-xl shadow-black/5">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between flex-shrink-0 px-6 py-5 border-b border-gray-200">
            <div className={cn("flex items-center", isSidebarCollapsed && "justify-center w-full")}>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-gray-900">Hiring</h1>
                  <p className="text-xs text-gray-500">Candidate Portal</p>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>

          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="mx-auto mt-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5 text-gray-500" />
            </button>
          )}

{/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));
              const isNotifications = item.name === 'Notifications'; // Tandai item notifikasi

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200', // Tambahkan justify-between
                    isActive
                      ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600 pl-2.5'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                    isSidebarCollapsed && 'justify-center' // Tetap tengahkan jika collapsed
                  )}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  {/* --- 3. Tampilkan Ikon dan Teks --- */}
                  <div className="flex items-center">
                    <item.icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600',
                        !isSidebarCollapsed && 'mr-3'
                      )}
                    />
                    {!isSidebarCollapsed && item.name}
                  </div>

                  {!isSidebarCollapsed && isNotifications && (
                    // Tampilkan hanya badge angka (tanpa ikon internalnya) jika memungkinkan,
                    // atau biarkan seperti ini jika NotificationBadge tidak bisa diubah
                    <NotificationBadge className="p-0 hover:bg-transparent relative -top-0.5" /> // Sedikit penyesuaian posisi
                  )}
                </Link>
              );
            })}

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutModal(true)}
              className={cn(
                'group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50',
                isSidebarCollapsed && 'justify-center'
              )}
              title={isSidebarCollapsed ? logoutItem.name : undefined}
            >
              <logoutItem.icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 text-red-500 group-hover:text-red-600',
                  !isSidebarCollapsed && 'mr-3'
                )}
              />
              {!isSidebarCollapsed && logoutItem.name}
            </button>
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100">
                  <User className="h-4 w-4 text-teal-700" />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100">
                  <User className="h-4 w-4 text-teal-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Candidate</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-xl shadow-black/5">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Mobile sidebar content */}
              <div className="flex-1 h-0 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-3">
                      <h1 className="text-lg font-bold text-gray-900">Hiring</h1>
                      <p className="text-xs text-gray-500">Candidate Portal</p>
                    </div>
                  </div>
                </div>

 <nav className="px-3 py-6 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));
                    const isNotifications = item.name === 'Notifications';

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          'group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200', // justify-between
                          isActive
                            ? 'bg-teal-50 text-teal-700 border-l-4 border-teal-600 pl-2.5'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
<div className="flex items-center">
                           {/* --- Modifikasi di sini (Mobile) --- */}
                           {!isNotifications && ( // Jangan tampilkan ikon default jika Notifikasi
                            <item.icon
                              className={cn(
                                'mr-3 h-5 w-5 flex-shrink-0',
                                isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'
                              )}
                            />
                           )}
                           {isNotifications && ( // Tampilkan ikon Bell langsung untuk Notifikasi
                             <Bell
                                className={cn(
                                  'mr-3 h-5 w-5 flex-shrink-0',
                                  isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'
                                )}
                              />
                           )}
                           {/* --------------------------------- */}
                           {item.name}
                         </div>
                        {isNotifications && (
                          <NotificationBadge className="p-0 hover:bg-transparent relative -top-0.5" />
                        )}
                      </Link>
                    );
                  })}
                  
                  {/* Logout Button - Mobile */}
                  <button
                    onClick={() => {
                      setSidebarOpen(false)
                      setShowLogoutModal(true)
                    }}
                    className="group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50"
                  >
                    <logoutItem.icon className="mr-3 h-5 w-5 flex-shrink-0 text-red-500 group-hover:text-red-600" />
                    {logoutItem.name}
                  </button>
                </nav>
              </div>

              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100">
                    <User className="h-4 w-4 text-teal-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">Candidate</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Top navbar for mobile */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 border-b border-white/20 bg-white/80 backdrop-blur-md shadow-sm lg:hidden">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-gray-900">Candidate Portal</h1>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
      <Footer isSidebarCollapsed={isSidebarCollapsed} />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onSignOut}
        loading={isLoggingOut}
      />
    </div>
  )
}

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserRole, getUserRole } from '@/lib/supabase/auth'
import { LoginSplashScreen } from '@/components/auth/LoginSplashScreen'

interface AuthContextType {
  user: User | null
  role: UserRole | null
  loading: boolean
  showSplashScreen: boolean
  splashRedirectTo: string | null
  setShowSplashScreen: (show: boolean) => void
  setSplashRedirectTo: (url: string | null) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  showSplashScreen: false,
  splashRedirectTo: null,
  setShowSplashScreen: () => {},
  setSplashRedirectTo: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSplashScreen, setShowSplashScreen] = useState(false)
  const [splashRedirectTo, setSplashRedirectTo] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setRole(session?.user ? getUserRole(session.user) : null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setRole(session?.user ? getUserRole(session.user) : null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading, showSplashScreen, splashRedirectTo, setShowSplashScreen, setSplashRedirectTo }}>
      {children}
      {showSplashScreen && (
        <LoginSplashScreen
          redirectTo={splashRedirectTo || undefined}
          onComplete={() => {
            setShowSplashScreen(false)
            setSplashRedirectTo(null)
          }}
        />
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
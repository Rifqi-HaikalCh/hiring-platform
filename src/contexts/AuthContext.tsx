'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserRole, getUserRole, handleSignOut } from '@/lib/supabase/auth' // Import handleSignOut
import { LoginSplashScreen } from '@/components/auth/LoginSplashScreen'

interface AuthContextType {
  user: User | null
  role: UserRole | null
  loading: boolean
  showSplashScreen: boolean
  splashRedirectTo: string | null
  setShowSplashScreen: (show: boolean) => void
  setSplashRedirectTo: (url: string | null) => void
  logout: () => Promise<{ error: any | null }> // Add logout function signature
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  showSplashScreen: false,
  splashRedirectTo: null,
  setShowSplashScreen: () => {},
  setSplashRedirectTo: () => {},
  logout: async () => ({ error: new Error("Logout function not implemented") }), // Provide a default dummy function
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

  // Define the logout function using handleSignOut
  const logout = async () => {
    const { error } = await handleSignOut();
    if (!error) {
        // Optionally reset state here if needed upon successful logout
        setUser(null);
        setRole(null);
    }
    return { error };
  }

  return (
    <AuthContext.Provider value={{
        user,
        role,
        loading,
        showSplashScreen,
        splashRedirectTo,
        setShowSplashScreen,
        setSplashRedirectTo,
        logout // Provide the actual logout function
    }}>
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
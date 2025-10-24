import { supabase } from './client'

export type UserRole = 'admin' | 'candidate'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  role: UserRole
}

export interface SignInData {
  email: string
  password: string
}

export async function handleSignUp({ email, password, fullName, role }: SignUpData) {
  try {
    // Sign up the user with metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })

    if (error) {
      console.error('Supabase auth error:', error)
      throw new Error(error.message || 'Failed to create account')
    }

    if (!data.user) {
      throw new Error('User creation failed')
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Sign up error:', error)
    return {
      data: null,
      error: {
        message: error.message || 'An unexpected error occurred during registration'
      }
    }
  }
}

export async function handleSignIn({ email, password }: SignInData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Sign in error:', error)
    return { data: null, error }
  }
}

export async function handleSignOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    return { error: null }
  } catch (error) {
    console.error('Sign out error:', error)
    return { error }
  }
}

export function getCurrentUser() {
  return supabase.auth.getUser()
}

export function getUserRole(user: any): UserRole | null {
  return user?.user_metadata?.role || null
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Get profile error:', error)
    return { data: null, error }
  }
}

export async function handleMagicLinkSignIn(email: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Magic link error:', error)
    return { data: null, error }
  }
}

export async function handleForgotPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Forgot password error:', error)
    return { data: null, error }
  }
}

export async function handleGoogleSignIn() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Google sign in error:', error)
    return { data: null, error }
  }
}
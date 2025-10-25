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
      console.error('Sign in error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        email: email
      })

      // Provide user-friendly error messages
      let userMessage = error.message
      if (error.message === 'Invalid login credentials') {
        userMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please verify your email address before signing in.'
      }

      throw new Error(userMessage)
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Sign in error:', {
      message: error?.message || 'Unknown error',
      name: error?.name
    })
    return {
      data: null,
      error: {
        message: error?.message || 'An unexpected error occurred during sign in',
        status: error?.status
      }
    }
  }
}

export async function handleSignOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      throw error
    }
    return { error: null }
  } catch (error: any) {
    console.error('Sign out error:', {
      message: error?.message || 'Unknown error',
      name: error?.name
    })
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
      console.error('Get profile error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        userId
      })
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Get profile error:', {
      message: error?.message || 'Unknown error',
      name: error?.name,
      userId
    })
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
      console.error('Magic link error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        email
      })
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Magic link error:', {
      message: error?.message || 'Unknown error',
      name: error?.name,
      email
    })
    return { data: null, error }
  }
}

export async function handleForgotPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      console.error('Forgot password error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        email
      })
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Forgot password error:', {
      message: error?.message || 'Unknown error',
      name: error?.name,
      email
    })
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
      console.error('Google sign in error:', {
        message: error.message,
        status: error.status,
        name: error.name
      })
      throw error
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Google sign in error:', {
      message: error?.message || 'Unknown error',
      name: error?.name
    })
    return { data: null, error }
  }
}
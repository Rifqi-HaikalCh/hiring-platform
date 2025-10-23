'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { handleSignIn, handleSignUp, SignInData, SignUpData, UserRole } from '@/lib/supabase/auth'

type AuthMode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const loginForm = useForm<SignInData>()
  const registerForm = useForm<SignUpData>()

  const onLogin = async (data: SignInData) => {
    setLoading(true)
    try {
      const { data: result, error } = await handleSignIn(data)

      if (error) {
        toast.error((error as any)?.message || 'Login failed')
        return
      }

      if (result?.user) {
        const userRole = result.user.user_metadata?.role
        toast.success('Login successful!')

        // Redirect based on role
        if (userRole === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async (data: SignUpData) => {
    setLoading(true)
    try {
      const { data: result, error } = await handleSignUp(data)

      if (error) {
        toast.error(error.message || 'Registration failed')
        return
      }

      toast.success('Registration successful! Please check your email to verify your account.')
      setMode('login')
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'login' ? 'Access your hiring platform' : 'Join our hiring platform'}
          </p>
        </div>

        <Card className="p-8">
          {/* Tabs */}
          <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...loginForm.register('email', { required: 'Email is required' })}
                  error={!!loginForm.formState.errors.email}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...loginForm.register('password', { required: 'Password is required' })}
                  error={!!loginForm.formState.errors.password}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  {...registerForm.register('fullName', { required: 'Full name is required' })}
                  error={!!registerForm.formState.errors.fullName}
                />
                {registerForm.formState.errors.fullName && (
                  <p className="text-sm text-red-600 mt-1">{registerForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...registerForm.register('email', { required: 'Email is required' })}
                  error={!!registerForm.formState.errors.email}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-red-600 mt-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...registerForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  error={!!registerForm.formState.errors.password}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-red-600 mt-1">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  {...registerForm.register('role', { required: 'Role is required' })}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                >
                  <option value="">Select your role</option>
                  <option value="admin">Admin</option>
                  <option value="candidate">Candidate</option>
                </select>
                {registerForm.formState.errors.role && (
                  <p className="text-sm text-red-600 mt-1">{registerForm.formState.errors.role.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
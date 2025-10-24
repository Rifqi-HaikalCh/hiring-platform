'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Mail, Key, ArrowLeft, Briefcase } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/contexts/AuthContext'
import {
  handleSignIn,
  handleSignUp,
  handleMagicLinkSignIn,
  handleForgotPassword,
  handleGoogleSignIn,
  SignInData,
  SignUpData,
  UserRole
} from '@/lib/supabase/auth'

type AuthView =
  | 'login-password'
  | 'login-magic-link'
  | 'forgot-password'
  | 'register-email'
  | 'register-password'

interface LoginFormData {
  email: string
  password: string
}

interface RegisterFormData {
  email: string
  password: string
  fullName: string
  role: UserRole
}

interface EmailFormData {
  email: string
}

const PLATFORM_NAME = "Hiring Platform"

export default function AuthPage() {
  const [view, setView] = useState<AuthView>('login-password')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { setShowSplashScreen, setSplashRedirectTo } = useAuth()

  const loginForm = useForm<LoginFormData>()
  const registerForm = useForm<RegisterFormData>()
  const emailForm = useForm<EmailFormData>()

  // Login with password
  const onLoginPassword = async (data: LoginFormData) => {
    setLoading(true)
    try {
      const { data: result, error } = await handleSignIn(data)

      if (error) {
        const errorMessage = (error as any)?.message || ''

        // Provide specific error messages
        if (errorMessage.includes('Invalid login credentials')) {
          toast.error('Email atau kata sandi salah')
        } else if (errorMessage.includes('Email not confirmed')) {
          toast.error('Silakan verifikasi email Anda terlebih dahulu')
        } else if (errorMessage.includes('too many requests')) {
          toast.error('Terlalu banyak percobaan. Coba lagi dalam beberapa menit.')
        } else {
          toast.error('Login gagal. Periksa kembali email dan kata sandi Anda.')
        }
        return
      }

      if (result?.user) {
        const userRole = result.user.user_metadata?.role
        toast.success('Login berhasil!')

        // Set redirect URL based on role
        const redirectUrl = userRole === 'admin' ? '/admin/dashboard' : '/dashboard'
        setSplashRedirectTo(redirectUrl)

        // Show splash screen
        setShowSplashScreen(true)
      }
    } catch (error) {
      toast.error('Terjadi kesalahan yang tidak terduga')
    } finally {
      setLoading(false)
    }
  }

  // Login with magic link
  const onMagicLink = async (data: EmailFormData) => {
    setLoading(true)
    try {
      const { error } = await handleMagicLinkSignIn(data.email)

      if (error) {
        toast.error((error as any)?.message || 'Gagal mengirim link')
        return
      }

      toast.success('Link login telah dikirim ke email Anda!')
      emailForm.reset()
    } catch (error) {
      toast.error('Terjadi kesalahan yang tidak terduga')
    } finally {
      setLoading(false)
    }
  }

  // Forgot password
  const onForgotPassword = async (data: EmailFormData) => {
    setLoading(true)
    try {
      const { error } = await handleForgotPassword(data.email)

      if (error) {
        toast.error((error as any)?.message || 'Gagal mengirim email reset')
        return
      }

      toast.success('Email reset password telah dikirim!')
      emailForm.reset()
      setView('login-password')
    } catch (error) {
      toast.error('Terjadi kesalahan yang tidak terduga')
    } finally {
      setLoading(false)
    }
  }

  // Register with password
  const onRegisterPassword = async (data: RegisterFormData) => {
    setLoading(true)
    try {
      const { data: result, error } = await handleSignUp(data)

      if (error) {
        toast.error(error.message || 'Registrasi gagal')
        return
      }

      toast.success('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi.')
      setView('login-password')
      registerForm.reset()
    } catch (error) {
      toast.error('Terjadi kesalahan yang tidak terduga')
    } finally {
      setLoading(false)
    }
  }

  // Google Sign In
  const onGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await handleGoogleSignIn()

      if (error) {
        toast.error((error as any)?.message || 'Google sign in gagal')
      }
      // The redirect happens automatically
    } catch (error) {
      toast.error('Terjadi kesalahan yang tidak terduga')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative z-10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {view === 'forgot-password' && `Selamat datang di ${PLATFORM_NAME}`}
            {view.startsWith('login') && `Masuk ke ${PLATFORM_NAME}`}
            {view.startsWith('register') && `Bergabung dengan ${PLATFORM_NAME}`}
          </h2>
          {view === 'forgot-password' && (
            <p className="mt-4 text-sm text-gray-600">
              Masukkan alamat email yang telah terdaftar untuk menerima email reset kata sandi.
            </p>
          )}
        </div>

        <Card className="p-8 shadow-lg">
          {/* Login with Password View */}
          {view === 'login-password' && (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => setView('register-email')}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Daftar menggunakan email
                  </button>
                </p>
              </div>

              <form onSubmit={loginForm.handleSubmit(onLoginPassword)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@example.com"
                    {...loginForm.register('email', { required: 'Email wajib diisi' })}
                    error={!!loginForm.formState.errors.email}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Kata sandi
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi"
                      {...loginForm.register('password', { required: 'Kata sandi wajib diisi' })}
                      error={!!loginForm.formState.errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setView('forgot-password')}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Lupa kata sandi?
                  </button>
                </div>

                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                  {loading ? 'Memproses...' : 'Masuk'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">atau</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setView('login-magic-link')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Kirim link login melalui email
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Masuk dengan Google
                </Button>
              </div>
            </>
          )}

          {/* Login with Magic Link View */}
          {view === 'login-magic-link' && (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => setView('register-email')}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Daftar menggunakan email
                  </button>
                </p>
              </div>

              <form onSubmit={emailForm.handleSubmit(onMagicLink)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@example.com"
                    {...emailForm.register('email', { required: 'Email wajib diisi' })}
                    error={!!emailForm.formState.errors.email}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                  {loading ? 'Mengirim...' : 'Kirim link'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">atau</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setView('login-password')}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Masuk dengan kata sandi
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Masuk dengan Google
                </Button>
              </div>
            </>
          )}

          {/* Forgot Password View */}
          {view === 'forgot-password' && (
            <>
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setView('login-password')}
                  className="flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Kembali
                </button>
              </div>

              <form onSubmit={emailForm.handleSubmit(onForgotPassword)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@example.com"
                    {...emailForm.register('email', { required: 'Email wajib diisi' })}
                    error={!!emailForm.formState.errors.email}
                  />
                  {emailForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                  {loading ? 'Mengirim...' : 'Kirim email'}
                </Button>
              </form>
            </>
          )}

          {/* Register Email View (Initial) */}
          {view === 'register-email' && (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => setView('login-password')}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Masuk
                  </button>
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  type="button"
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  onClick={() => setView('register-password')}
                >
                  Daftar dengan email
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">atau</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Daftar dengan Google
                </Button>
              </div>
            </>
          )}

          {/* Register with Password View */}
          {view === 'register-password' && (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => setView('login-password')}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Masuk
                  </button>
                </p>
              </div>

              <form onSubmit={registerForm.handleSubmit(onRegisterPassword)} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama lengkap
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Masukkan nama lengkap"
                    {...registerForm.register('fullName', { required: 'Nama lengkap wajib diisi' })}
                    error={!!registerForm.formState.errors.fullName}
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="text-sm text-red-600 mt-1">{registerForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@example.com"
                    {...registerForm.register('email', { required: 'Email wajib diisi' })}
                    error={!!registerForm.formState.errors.email}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Kata sandi
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi"
                      {...registerForm.register('password', {
                        required: 'Kata sandi wajib diisi',
                        minLength: {
                          value: 8,
                          message: 'Kata sandi minimal 8 karakter'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Kata sandi harus mengandung huruf besar, huruf kecil, dan angka'
                        }
                      })}
                      error={!!registerForm.formState.errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-600 mt-1">{registerForm.formState.errors.password.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Minimal 8 karakter dengan huruf besar, huruf kecil, dan angka
                  </p>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Peran
                  </label>
                  <Select
                    id="role"
                    {...registerForm.register('role', { required: 'Peran wajib dipilih' })}
                    error={!!registerForm.formState.errors.role}
                  >
                    <option value="">Pilih peran</option>
                    <option value="admin">Admin</option>
                    <option value="candidate">Kandidat</option>
                  </Select>
                  {registerForm.formState.errors.role && (
                    <p className="text-sm text-red-600 mt-1">{registerForm.formState.errors.role.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={loading}>
                  {loading ? 'Memproses...' : 'Daftar'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">atau</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onGoogleSignIn}
                disabled={loading}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Daftar dengan Google
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase/client'

interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}

const PLATFORM_NAME = "Hiring Platform"

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordFormData>()

  const password = watch('password')

  useEffect(() => {
    // Check if user came from password reset email
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Link reset password tidak valid atau sudah kadaluarsa')
        router.push('/auth')
      }
    }
    checkSession()
  }, [router])

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Kata sandi tidak cocok')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) {
        toast.error(error.message || 'Gagal mereset kata sandi')
        return
      }

      toast.success('Kata sandi berhasil direset!')

      // Sign out and redirect to login
      await supabase.auth.signOut()
      router.push('/auth')
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('Terjadi kesalahan yang tidak terduga')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-teal-100 mx-auto mb-4">
            <Lock className="h-6 w-6 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reset Kata Sandi
          </h1>
          <p className="text-sm text-gray-600">
            Masukkan kata sandi baru Anda
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi baru"
                {...register('password', {
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
                className={errors.password ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Minimal 8 karakter dengan huruf besar, huruf kecil, dan angka
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Masukkan ulang kata sandi baru"
                {...register('confirmPassword', {
                  required: 'Konfirmasi kata sandi wajib diisi',
                  validate: (value) =>
                    value === password || 'Kata sandi tidak cocok'
                })}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? 'Memproses...' : 'Reset Kata Sandi'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Kembali ke halaman login
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}

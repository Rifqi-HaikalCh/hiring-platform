'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL params (for OAuth and Magic Link)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          toast.error('Autentikasi gagal. Silakan coba lagi.')
          router.push('/auth')
          return
        }

        if (session) {
          // Check email verification for password-based signups
          const emailConfirmed = session.user.email_confirmed_at
          const isOAuthUser = session.user.app_metadata.provider !== 'email'

          // Get user role from metadata
          const role = session.user.user_metadata?.role

          // For OAuth users (Google), email is auto-verified
          // For email/password users, check if email is confirmed
          if (!isOAuthUser && !emailConfirmed) {
            toast.error('Silakan verifikasi email Anda terlebih dahulu. Periksa inbox Anda.')
            await supabase.auth.signOut()
            router.push('/auth')
            return
          }

          // Check if OAuth user has a role assigned
          if (isOAuthUser && !role) {
            // First time OAuth user - redirect to role selection
            router.push('/auth/select-role')
            return
          }

          toast.success('Berhasil masuk!')

          // Redirect based on role
          if (role === 'admin') {
            router.push('/admin/dashboard')
          } else {
            router.push('/dashboard')
          }
        } else {
          // No session found, redirect to auth
          router.push('/auth')
        }
      } catch (error) {
        console.error('Callback error:', error)
        toast.error('Terjadi kesalahan. Silakan coba lagi.')
        router.push('/auth')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 bg-teal-600 rounded-full mx-auto mb-4 animate-pulse"></div>
        <p className="text-gray-600">Memverifikasi autentikasi...</p>
      </div>
    </div>
  )
}

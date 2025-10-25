'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter()
  const { setShowSplashScreen, setSplashRedirectTo } = useAuth();
  
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
const role = session.user.user_metadata?.role;
          const isOAuthUser = session.user.app_metadata.provider !== 'email'; // Cek jika OAuth

          // ... (OAuth role selection logic jika role belum ada)
          if (isOAuthUser && !role) {
             router.push('/auth/select-role');
             return;
          }

          toast.success('Berhasil masuk!');

          // ---> Logika Kondisional Splash Screen <---
          if (role === 'admin') {
            // Jika admin, langsung redirect
            router.push('/admin/dashboard');
          } else {
            // Jika candidate (atau default), tampilkan splash screen
            setSplashRedirectTo('/dashboard'); // Atur tujuan setelah splash
            setShowSplashScreen(true);         // Tampilkan splash screen
          }
          // ----------------------------------------

        } else {
          router.push('/auth');
        }
      } catch (error) {
        console.error('Callback error:', error);
        toast.error('Terjadi kesalahan. Silakan coba lagi.');
        router.push('/auth');
      }
    };

    handleCallback();
  }, [router, setShowSplashScreen, setSplashRedirectTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 bg-teal-600 rounded-full mx-auto mb-4 animate-pulse"></div>
        <p className="text-gray-600">Memverifikasi autentikasi...</p>
      </div>
    </div>
  )
}

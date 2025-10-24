'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Briefcase, UserCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { UserRole } from '@/lib/supabase/auth'

const PLATFORM_NAME = "Hiring Platform"

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      toast.error('Silakan pilih peran Anda')
      return
    }

    setLoading(true)
    try {
      // Update user metadata with selected role
      const { error } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      })

      if (error) {
        toast.error('Gagal menyimpan peran')
        return
      }

      toast.success('Peran berhasil dipilih!')

      // Redirect based on role
      if (selectedRole === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Role selection error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pilih Peran Anda
          </h1>
          <p className="text-sm text-gray-600">
            Selamat datang di {PLATFORM_NAME}! Silakan pilih peran Anda untuk melanjutkan.
          </p>
        </div>

        <div className="space-y-4">
          {/* Admin Role */}
          <button
            type="button"
            onClick={() => setSelectedRole('admin')}
            className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedRole === 'admin'
                ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-100'
                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                selectedRole === 'admin' ? 'bg-teal-100' : 'bg-gray-100'
              }`}>
                <Briefcase className={`h-6 w-6 ${
                  selectedRole === 'admin' ? 'text-teal-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-lg ${
                  selectedRole === 'admin' ? 'text-teal-900' : 'text-gray-900'
                }`}>
                  Admin
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Kelola lowongan pekerjaan, review aplikasi, dan administrasi platform
                </p>
              </div>
              {selectedRole === 'admin' && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>

          {/* Candidate Role */}
          <button
            type="button"
            onClick={() => setSelectedRole('candidate')}
            className={`w-full p-6 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedRole === 'candidate'
                ? 'border-teal-500 bg-teal-50 shadow-lg shadow-teal-100'
                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                selectedRole === 'candidate' ? 'bg-teal-100' : 'bg-gray-100'
              }`}>
                <UserCircle className={`h-6 w-6 ${
                  selectedRole === 'candidate' ? 'text-teal-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-lg ${
                  selectedRole === 'candidate' ? 'text-teal-900' : 'text-gray-900'
                }`}>
                  Kandidat
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Cari lowongan pekerjaan dan lamar posisi yang sesuai dengan keahlian Anda
                </p>
              </div>
              {selectedRole === 'candidate' && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleRoleSelection}
            disabled={!selectedRole || loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Lanjutkan'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

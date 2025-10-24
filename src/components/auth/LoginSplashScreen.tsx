'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SplitText } from '@/components/ui/SplitText'
import { Briefcase } from 'lucide-react'

interface LoginSplashScreenProps {
  onComplete?: () => void
  redirectTo?: string
  duration?: number
}

export function LoginSplashScreen({
  onComplete,
  redirectTo,
  duration = 3000
}: LoginSplashScreenProps) {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (redirectTo) {
        router.push(redirectTo)
      }
      if (onComplete) {
        onComplete()
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [onComplete, redirectTo, duration, router])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 backdrop-blur-sm z-[99]">
      {/* Logo Icon */}
      <div className="mb-8 animate-pulse">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-2xl shadow-teal-500/50">
          <Briefcase className="h-10 w-10 text-white" />
        </div>
      </div>

      {/* Animated Text */}
      <SplitText
        text="Find the job that fits!"
        className="text-4xl md:text-5xl font-bold text-white text-center mb-4"
        delay={0.3}
        duration={0.6}
        ease="power3.out"
        from={{ opacity: 0, y: 50, scale: 0.8 }}
        to={{ opacity: 1, y: 0, scale: 1 }}
        stagger={0.04}
      />

      <SplitText
        text="Good luck"
        className="text-2xl md:text-3xl font-semibold text-teal-300 text-center"
        delay={1.2}
        duration={0.5}
        ease="power2.out"
        from={{ opacity: 0, y: 30 }}
        to={{ opacity: 1, y: 0 }}
        stagger={0.05}
      />

      {/* Loading indicator */}
      <div className="mt-12">
        <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full animate-loading-bar" />
        </div>
      </div>
    </div>
  )
}

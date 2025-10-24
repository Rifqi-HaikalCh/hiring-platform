'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SplitText } from '@/components/ui/SplitText'
import { Briefcase } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Start exit animation 500ms before completion
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, duration - 500)

    // Complete and redirect
    const completeTimer = setTimeout(() => {
      if (redirectTo) {
        router.push(redirectTo)
      }
      if (onComplete) {
        onComplete()
      }
    }, duration)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete, redirectTo, duration, router])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 1.05 : 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 backdrop-blur-sm z-[99]"
      >
        {/* Logo Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{
            scale: isExiting ? 0 : 1,
            rotate: isExiting ? 180 : 0
          }}
          transition={{ duration: 0.6, ease: 'backOut' }}
          className="mb-8"
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-2xl shadow-teal-500/50">
            <Briefcase className="h-10 w-10 text-white" />
          </div>
        </motion.div>

        {/* Animated Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -20 : 0 }}
          transition={{ duration: 0.4 }}
        >
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
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{
            opacity: isExiting ? 0 : 1,
            width: isExiting ? 0 : 192
          }}
          transition={{ duration: 0.3 }}
          className="mt-12"
        >
          <div className="w-48 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full animate-loading-bar" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

'use client'

import { useEffect, useRef } from 'react'
import { Building2, MapPin, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { gsap } from 'gsap'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salaryRange: {
    min: number
    max: number
  }
  companyLogo?: string
  jobType?: string
}

interface JobCardCandidateProps {
  job: Job
  isActive: boolean
  isApplied?: boolean
  onClick: (jobId: string) => void
}

export function JobCardCandidate({ job, isActive, isApplied = false, onClick }: JobCardCandidateProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement[]>([])
  const isHoveredRef = useRef(false)

  // Magic Bento Effects
  useEffect(() => {
    if (!cardRef.current) return

    const card = cardRef.current

    const handleMouseEnter = () => {
      isHoveredRef.current = true

      // Create particles
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (!isHoveredRef.current || !cardRef.current) return

          const particle = document.createElement('div')
          particle.className = 'absolute w-1 h-1 rounded-full pointer-events-none'
          particle.style.cssText = `
            background: rgba(20, 184, 166, 0.8);
            box-shadow: 0 0 6px rgba(20, 184, 166, 0.6);
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            z-index: 10;
          `

          cardRef.current!.appendChild(particle)
          particlesRef.current.push(particle)

          gsap.fromTo(particle,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
          )

          gsap.to(particle, {
            x: (Math.random() - 0.5) * 60,
            y: (Math.random() - 0.5) * 60,
            rotation: Math.random() * 360,
            duration: 2 + Math.random() * 2,
            ease: 'none',
            repeat: -1,
            yoyo: true
          })

          gsap.to(particle, {
            opacity: 0.3,
            duration: 1.5,
            ease: 'power2.inOut',
            repeat: -1,
            yoyo: true
          })
        }, i * 100)
      }
    }

    const handleMouseLeave = () => {
      isHoveredRef.current = false

      particlesRef.current.forEach(particle => {
        gsap.to(particle, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'back.in(1.7)',
          onComplete: () => particle.remove()
        })
      })
      particlesRef.current = []

      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // Tilt effect (subtle for candidate cards)
      const rotateX = ((y - centerY) / centerY) * -5
      const rotateY = ((x - centerX) / centerX) * 5

      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        duration: 0.1,
        ease: 'power2.out'
      })

      // Magnetism
      const magnetX = (x - centerX) * 0.02
      const magnetY = (y - centerY) * 0.02

      gsap.to(card, {
        x: magnetX,
        y: magnetY,
        duration: 0.3,
        ease: 'power2.out'
      })

      // Border glow following mouse
      const relativeX = (x / rect.width) * 100
      const relativeY = (y / rect.height) * 100
      card.style.setProperty('--glow-x', `${relativeX}%`)
      card.style.setProperty('--glow-y', `${relativeY}%`)
    }

    const handleClick = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      )

      const ripple = document.createElement('div')
      ripple.className = 'absolute rounded-full pointer-events-none'
      ripple.style.cssText = `
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        background: radial-gradient(circle, rgba(20, 184, 166, 0.3) 0%, rgba(20, 184, 166, 0.1) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        z-index: 1000;
      `

      card.appendChild(ripple)

      gsap.fromTo(ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      )
    }

    card.addEventListener('mouseenter', handleMouseEnter)
    card.addEventListener('mouseleave', handleMouseLeave)
    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('click', handleClick)

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter)
      card.removeEventListener('mouseleave', handleMouseLeave)
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('click', handleClick)
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div ref={cardRef} className="relative magic-bento-card" style={{
      '--glow-x': '50%',
      '--glow-y': '50%'
    } as React.CSSProperties}>
      <Card
        className={`relative p-4 cursor-pointer transition-all overflow-hidden ${
          isApplied
            ? 'opacity-60 bg-gray-50 border border-gray-300'
            : isActive
            ? 'border-l-4 border-l-teal-600 bg-teal-50 border border-teal-200 shadow-lg shadow-teal-500/10'
            : 'border-l-4 border-l-transparent border border-gray-200 hover:border-teal-300 hover:shadow-xl shadow-lg'
        }`}
        onClick={() => onClick(job.id)}
      >
        {/* Border glow effect - disable for applied jobs */}
        {!isApplied && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none border-glow-effect"
            style={{
              background: `radial-gradient(300px circle at var(--glow-x) var(--glow-y), rgba(20, 184, 166, 0.15), transparent 60%)`,
              opacity: 0
            }}
          />
        )}

        {/* Applied badge */}
        {isApplied && (
          <div className="absolute top-3 right-3 z-20">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md">
              <CheckCircle2 className="h-3 w-3 mr-1.5" />
              Applied
            </div>
          </div>
        )}

        <div className="relative z-10">
          <div className="flex items-start space-x-4">
            {/* Company Logo */}
            <div className={`w-14 h-14 bg-gradient-to-br from-teal-50 to-sky-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 ${isApplied ? 'opacity-70' : ''}`}>
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {job.company.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Job Details */}
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-semibold truncate mb-1 ${isApplied ? 'text-gray-600' : 'text-gray-900'}`}>
                {job.title}
              </h3>
              <p className={`text-sm font-medium mb-2 ${isApplied ? 'text-gray-500' : 'text-gray-700'}`}>{job.company}</p>

              <div className="flex flex-wrap gap-2 mb-2">
                {job.jobType && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${isApplied ? 'bg-gray-200 text-gray-600' : 'bg-teal-100 text-teal-800'}`}>
                    {job.jobType}
                  </span>
                )}
                {job.location && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    <MapPin className="h-3 w-3 mr-1" />
                    {job.location}
                  </span>
                )}
              </div>

              <p className={`text-sm font-semibold ${isApplied ? 'text-gray-500' : 'text-teal-600'}`}>
                {formatCurrency(job.salaryRange.min)} - {formatCurrency(job.salaryRange.max)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <style jsx>{`
        .magic-bento-card:hover .border-glow-effect {
          opacity: 1 !important;
          transition: opacity 0.3s ease;
        }
      `}</style>
    </div>
  )
}

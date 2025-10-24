'use client'

import { useEffect, useRef } from 'react'
import { Building2, MapPin } from 'lucide-react'
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
}

interface JobCardCandidateProps {
  job: Job
  isActive: boolean
  onClick: (jobId: string) => void
}

export function JobCardCandidate({ job, isActive, onClick }: JobCardCandidateProps) {
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
          isActive
            ? 'border-l-4 border-l-teal-600 bg-teal-50 border border-teal-200'
            : 'border-l-4 border-l-transparent border border-gray-200 hover:border-teal-300'
        }`}
        onClick={() => onClick(job.id)}
      >
        {/* Border glow effect */}
        <div className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `radial-gradient(300px circle at var(--glow-x) var(--glow-y), rgba(20, 184, 166, 0.15), transparent 60%)`,
            opacity: 0
          }}
          className="border-glow-effect"
        />

        <div className="relative z-10">
          <div className="flex items-start space-x-3">
            {/* Company Logo */}
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.company}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Building2 className="h-6 w-6 text-gray-400" />
              )}
            </div>

            {/* Job Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {job.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{job.company}</p>

              <div className="flex items-center text-sm text-gray-500 mt-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{job.location}</span>
              </div>

              <p className="text-sm font-medium text-gray-900 mt-2">
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

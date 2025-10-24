'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Edit3, Power, PowerOff, Trash2, Users, MoreHorizontal } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface Job {
  id: string
  title: string
  status: 'active' | 'inactive' | 'draft'
  startDate: string
  salaryRange: {
    min: number
    max: number
  }
}

interface JobCardAdminProps {
  job: Job
  onManage: (jobId: string) => void
  onEdit: (job: Job) => void
  onToggleStatus: (jobId: string) => void
  onDelete: (jobId: string) => void
}

export function JobCardAdmin({ job, onManage, onEdit, onToggleStatus, onDelete }: JobCardAdminProps) {
  const [showActions, setShowActions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement[]>([])
  const isHoveredRef = useRef(false)

  // Magic Bento Effects
  useEffect(() => {
    if (!cardRef.current) return

    const card = cardRef.current
    let mouseX = 0
    let mouseY = 0

    const handleMouseEnter = () => {
      isHoveredRef.current = true

      // Create particles
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          if (!isHoveredRef.current || !cardRef.current) return

          const particle = document.createElement('div')
          particle.className = 'absolute w-1 h-1 rounded-full pointer-events-none'
          particle.style.cssText = `
            background: rgba(14, 165, 233, 0.8);
            box-shadow: 0 0 6px rgba(14, 165, 233, 0.6);
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
            x: (Math.random() - 0.5) * 80,
            y: (Math.random() - 0.5) * 80,
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
      mouseX = x
      mouseY = y

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // Tilt effect
      const rotateX = ((y - centerY) / centerY) * -8
      const rotateY = ((x - centerX) / centerX) * 8

      gsap.to(card, {
        rotateX,
        rotateY,
        transformPerspective: 1000,
        duration: 0.1,
        ease: 'power2.out'
      })

      // Magnetism
      const magnetX = (x - centerX) * 0.03
      const magnetY = (y - centerY) * 0.03

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
        background: radial-gradient(circle, rgba(14, 165, 233, 0.3) 0%, rgba(14, 165, 233, 0.1) 30%, transparent 70%);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActions(false)
      }
    }

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActions])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'danger'
      case 'draft':
        return 'warning'
      default:
        return 'default'
    }
  }

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
      <Card className="relative p-4 transition-shadow overflow-hidden border border-gray-200 hover:border-sky-300">
        {/* Border glow effect */}
        <div className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: `radial-gradient(300px circle at var(--glow-x) var(--glow-y), rgba(14, 165, 233, 0.15), transparent 60%)`,
            opacity: 0
          }}
          className="border-glow-effect"
        />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <Badge variant={getStatusVariant(job.status)}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-500">started on {job.startDate}</span>
            </div>

            {/* Action Menu Button */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="p-1 h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {/* Action Dropdown */}
              {showActions && (
                <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-20 min-w-[160px]">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onEdit(job)
                        setShowActions(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Job
                    </button>

                    <button
                      onClick={() => {
                        onToggleStatus(job.id)
                        setShowActions(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {job.status === 'active' ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onDelete(job.id)
                        setShowActions(false)
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Job
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            <p className="text-gray-600">
              {formatCurrency(job.salaryRange.min)} - {formatCurrency(job.salaryRange.max)}
            </p>
          </div>

          <Button
            onClick={() => onManage(job.id)}
            className="w-full"
            variant="primary"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Candidates
          </Button>
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

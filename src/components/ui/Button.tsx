'use client'

import { ButtonHTMLAttributes, forwardRef, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { gsap } from 'gsap'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disableMagic?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disableMagic = false, children, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement>(null)
    const particlesRef = useRef<HTMLDivElement[]>([])
    const isHoveredRef = useRef(false)

    useEffect(() => {
      if (disableMagic || props.disabled) return

      const button = internalRef.current
      if (!button) return

      const getGlowColor = () => {
        switch (variant) {
          case 'primary':
            return '20, 184, 166' // teal
          case 'secondary':
            return '107, 114, 128' // gray
          case 'outline':
            return '14, 165, 233' // sky
          case 'ghost':
            return '156, 163, 175' // gray-400
          default:
            return '20, 184, 166'
        }
      }

      const glowColor = getGlowColor()

      const handleMouseEnter = () => {
        isHoveredRef.current = true

        // Scale up animation
        gsap.to(button, {
          scale: 1.05,
          duration: 0.3,
          ease: 'back.out(1.7)'
        })

        // Create particles
        const particleCount = size === 'lg' ? 6 : size === 'md' ? 4 : 3
        for (let i = 0; i < particleCount; i++) {
          setTimeout(() => {
            if (!isHoveredRef.current || !button) return

            const particle = document.createElement('div')
            particle.className = 'absolute w-0.5 h-0.5 rounded-full pointer-events-none'
            particle.style.cssText = `
              background: rgba(${glowColor}, 0.8);
              box-shadow: 0 0 4px rgba(${glowColor}, 0.6);
              left: ${Math.random() * 100}%;
              top: ${Math.random() * 100}%;
              z-index: 10;
            `

            button.appendChild(particle)
            particlesRef.current.push(particle)

            gsap.fromTo(particle,
              { scale: 0, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(1.7)' }
            )

            gsap.to(particle, {
              x: (Math.random() - 0.5) * 40,
              y: (Math.random() - 0.5) * 40,
              rotation: Math.random() * 360,
              duration: 1.5 + Math.random(),
              ease: 'none',
              repeat: -1,
              yoyo: true
            })

            gsap.to(particle, {
              opacity: 0.4,
              duration: 1,
              ease: 'power2.inOut',
              repeat: -1,
              yoyo: true
            })
          }, i * 60)
        }
      }

      const handleMouseLeave = () => {
        isHoveredRef.current = false

        // Scale back
        gsap.to(button, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        })

        // Remove particles
        particlesRef.current.forEach(particle => {
          gsap.to(particle, {
            scale: 0,
            opacity: 0,
            duration: 0.2,
            ease: 'back.in(1.7)',
            onComplete: () => particle.remove()
          })
        })
        particlesRef.current = []
      }

      const handleMouseMove = (e: MouseEvent) => {
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Border glow following mouse
        const relativeX = (x / rect.width) * 100
        const relativeY = (y / rect.height) * 100
        button.style.setProperty('--glow-x', `${relativeX}%`)
        button.style.setProperty('--glow-y', `${relativeY}%`)
      }

      const handleClick = (e: MouseEvent) => {
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Ripple effect
        const ripple = document.createElement('div')
        ripple.className = 'absolute rounded-full pointer-events-none'
        const maxSize = Math.max(rect.width, rect.height)
        ripple.style.cssText = `
          width: ${maxSize}px;
          height: ${maxSize}px;
          background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.1) 50%, transparent 70%);
          left: ${x - maxSize / 2}px;
          top: ${y - maxSize / 2}px;
          z-index: 20;
        `

        button.appendChild(ripple)

        gsap.fromTo(ripple,
          { scale: 0, opacity: 1 },
          {
            scale: 2,
            opacity: 0,
            duration: 0.6,
            ease: 'power2.out',
            onComplete: () => ripple.remove()
          }
        )

        // Bounce effect
        gsap.to(button, {
          scale: 0.95,
          duration: 0.1,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(button, {
              scale: isHoveredRef.current ? 1.05 : 1,
              duration: 0.2,
              ease: 'back.out(1.7)'
            })
          }
        })
      }

      button.addEventListener('mouseenter', handleMouseEnter)
      button.addEventListener('mouseleave', handleMouseLeave)
      button.addEventListener('mousemove', handleMouseMove)
      button.addEventListener('click', handleClick)

      return () => {
        button.removeEventListener('mouseenter', handleMouseEnter)
        button.removeEventListener('mouseleave', handleMouseLeave)
        button.removeEventListener('mousemove', handleMouseMove)
        button.removeEventListener('click', handleClick)
      }
    }, [variant, size, disableMagic, props.disabled])

    const baseStyles = 'relative inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 overflow-hidden'

    const variants = {
      primary: 'bg-teal-600 text-white hover:bg-teal-700 focus-visible:ring-teal-600',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
      outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500'
    }

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base'
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={(node) => {
          internalRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        style={{
          '--glow-x': '50%',
          '--glow-y': '50%'
        } as React.CSSProperties}
        {...props}
      >
        {!disableMagic && !props.disabled && (
          <div
            className="absolute inset-0 pointer-events-none opacity-0 hover-glow transition-opacity duration-300"
            style={{
              background: `radial-gradient(150px circle at var(--glow-x) var(--glow-y), rgba(255, 255, 255, 0.15), transparent 70%)`
            }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }

'use client'

import { SelectHTMLAttributes, forwardRef, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { gsap } from 'gsap'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  disableMagic?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, disableMagic = false, children, ...props }, ref) => {
    const internalRef = useRef<HTMLSelectElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const particlesRef = useRef<HTMLDivElement[]>([])
    const isFocusedRef = useRef(false)

    useEffect(() => {
      if (disableMagic || props.disabled) return

      const select = internalRef.current
      const wrapper = wrapperRef.current
      if (!select || !wrapper) return

      const glowColor = error ? '239, 68, 68' : '20, 184, 166' // red for error, teal for normal

      const handleFocus = () => {
        isFocusedRef.current = true

        // Subtle scale up animation
        gsap.to(wrapper, {
          scale: 1.01,
          duration: 0.3,
          ease: 'power2.out'
        })

        // Create subtle particles on focus
        const particleCount = 3
        for (let i = 0; i < particleCount; i++) {
          setTimeout(() => {
            if (!isFocusedRef.current || !wrapper) return

            const particle = document.createElement('div')
            particle.className = 'absolute w-0.5 h-0.5 rounded-full pointer-events-none'
            particle.style.cssText = `
              background: rgba(${glowColor}, 0.6);
              box-shadow: 0 0 4px rgba(${glowColor}, 0.4);
              left: ${Math.random() * 100}%;
              top: ${Math.random() * 100}%;
              z-index: 10;
            `

            wrapper.appendChild(particle)
            particlesRef.current.push(particle)

            gsap.fromTo(particle,
              { scale: 0, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(1.7)' }
            )

            gsap.to(particle, {
              x: (Math.random() - 0.5) * 30,
              y: (Math.random() - 0.5) * 30,
              rotation: Math.random() * 360,
              duration: 2 + Math.random(),
              ease: 'none',
              repeat: -1,
              yoyo: true
            })

            gsap.to(particle, {
              opacity: 0.2,
              duration: 1.2,
              ease: 'power2.inOut',
              repeat: -1,
              yoyo: true
            })
          }, i * 80)
        }
      }

      const handleBlur = () => {
        isFocusedRef.current = false

        // Scale back
        gsap.to(wrapper, {
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
        if (!isFocusedRef.current) return

        const rect = wrapper.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Border glow following mouse
        const relativeX = (x / rect.width) * 100
        const relativeY = (y / rect.height) * 100
        wrapper.style.setProperty('--glow-x', `${relativeX}%`)
        wrapper.style.setProperty('--glow-y', `${relativeY}%`)
      }

      select.addEventListener('focus', handleFocus)
      select.addEventListener('blur', handleBlur)
      wrapper.addEventListener('mousemove', handleMouseMove)

      return () => {
        select.removeEventListener('focus', handleFocus)
        select.removeEventListener('blur', handleBlur)
        wrapper.removeEventListener('mousemove', handleMouseMove)
      }
    }, [error, disableMagic, props.disabled])

    return (
      <div
        ref={wrapperRef}
        className="relative inline-block w-full"
        style={{
          '--glow-x': '50%',
          '--glow-y': '50%'
        } as React.CSSProperties}
      >
        {!disableMagic && !props.disabled && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none opacity-0 focus-glow transition-opacity duration-300"
            style={{
              background: `radial-gradient(120px circle at var(--glow-x) var(--glow-y), rgba(${error ? '239, 68, 68' : '20, 184, 166'}, 0.1), transparent 70%)`
            }}
          />
        )}
        <select
          className={cn(
            'relative flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300',
            error && 'border-red-500 focus:ring-red-600',
            className
          )}
          ref={(node) => {
            internalRef.current = node
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          {...props}
        >
          {children}
        </select>
        <style jsx>{`
          .relative:focus-within .focus-glow {
            opacity: 1 !important;
          }
        `}</style>
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }

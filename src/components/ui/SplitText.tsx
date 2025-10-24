'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  ease?: string
  from?: {
    opacity?: number
    y?: number
    x?: number
    scale?: number
    rotateX?: number
    rotateY?: number
  }
  to?: {
    opacity?: number
    y?: number
    x?: number
    scale?: number
    rotateX?: number
    rotateY?: number
  }
  stagger?: number
}

export function SplitText({
  text,
  className = '',
  delay = 0,
  duration = 0.5,
  ease = 'power3.out',
  from = { opacity: 0, y: 50 },
  to = { opacity: 1, y: 0 },
  stagger = 0.03
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chars = containerRef.current.querySelectorAll('.char')

    // Set initial state
    gsap.set(chars, from)

    // Animate characters
    gsap.to(chars, {
      ...to,
      duration,
      ease,
      stagger,
      delay
    })

    return () => {
      gsap.killTweensOf(chars)
    }
  }, [text, delay, duration, ease, from, to, stagger])

  const characters = text.split('').map((char, index) => {
    if (char === ' ') {
      return <span key={index} className="char inline-block">&nbsp;</span>
    }
    return (
      <span key={index} className="char inline-block">
        {char}
      </span>
    )
  })

  return (
    <div ref={containerRef} className={className}>
      {characters}
    </div>
  )
}

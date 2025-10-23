'use client'

import { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

interface EmptyStateProps {
  title: string
  description: string
  animationData?: any
}

export function EmptyState({ title, description, animationData }: EmptyStateProps) {
  const [animation, setAnimation] = useState(null)

  useEffect(() => {
    if (animationData) {
      setAnimation(animationData)
    } else {
      // Load default animation from public folder
      fetch('/Empty List.json')
        .then(response => response.json())
        .then(data => setAnimation(data))
        .catch(error => console.error('Error loading animation:', error))
    }
  }, [animationData])

  return (
    <div className="text-center py-12">
      <div className="w-32 h-32 mx-auto mb-4">
        {animation ? (
          <Lottie
            animationData={animation}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">Loading...</span>
          </div>
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
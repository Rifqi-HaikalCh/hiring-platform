'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X, Camera, Hand } from 'lucide-react'
import Webcam from 'react-webcam'
import * as tf from '@tensorflow/tfjs'
import * as handpose from '@tensorflow-models/handpose'
import '@tensorflow/tfjs-backend-webgl'

interface WebcamGestureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageBase64: string) => void
}

// Definisi pose gestur
const POSE_INSTRUCTIONS = [
  { id: 1, emoji: '☝️', name: 'One Finger', description: 'Tunjukkan satu jari (telunjuk)' },
  { id: 2, emoji: '✌️', name: 'Two Fingers', description: 'Tunjukkan dua jari (peace sign)' },
  { id: 3, emoji: '🤟', name: 'Three Fingers', description: 'Tunjukkan tiga jari (rock sign)' }
]

export function WebcamGestureModal({ isOpen, onClose, onCapture }: WebcamGestureModalProps) {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Helper function to safely get pose instruction
  const getCurrentPoseInstruction = useCallback((pose: number) => {
    const index = pose - 1
    return POSE_INSTRUCTIONS[index] || POSE_INSTRUCTIONS[0]
  }, [])

  // States
  const [model, setModel] = useState<handpose.HandPose | null>(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [currentPose, setCurrentPose] = useState(1)
  const [poseDetected, setPoseDetected] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [handDetected, setHandDetected] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [feedback, setFeedback] = useState('')

  // Load TensorFlow model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true)
        await tf.ready()
        const loadedModel = await handpose.load()
        setModel(loadedModel)
        setIsModelLoading(false)
        console.log('HandPose model loaded successfully')
      } catch (error) {
        console.error('Error loading model:', error)
        setIsModelLoading(false)
      }
    }

    if (isOpen) {
      loadModel()
    }
  }, [isOpen])

  // Fungsi untuk mendeteksi gesture berdasarkan landmarks
  const detectGesture = useCallback((landmarks: number[][]) => {
    if (!landmarks || landmarks.length === 0) return 0

    // Landmark indices untuk jari-jari
    const fingerTips = [8, 12, 16, 20] // index, middle, ring, pinky tips
    const fingerPips = [6, 10, 14, 18] // index, middle, ring, pinky PIPs
    const thumbTip = 4
    const thumbPip = 3

    let extendedFingers = 0

    // Check thumb (berbeda karena orientasi horizontal)
    if (landmarks[thumbTip][0] > landmarks[thumbPip][0]) {
      extendedFingers++
    }

    // Check other fingers (vertical orientation)
    for (let i = 0; i < fingerTips.length; i++) {
      if (landmarks[fingerTips[i]][1] < landmarks[fingerPips[i]][1]) {
        extendedFingers++
      }
    }

    return extendedFingers
  }, [])

  // Deteksi hand pose secara real-time
  const detectHands = useCallback(async () => {
    if (!model || !webcamRef.current?.video || isCapturing) return

    const video = webcamRef.current.video
    if (video.readyState !== 4) return

    try {
      const predictions = await model.estimateHands(video)

      if (predictions.length > 0) {
        setHandDetected(true)
        const landmarks = predictions[0].landmarks
        const gestureCount = detectGesture(landmarks)

        // Check if gesture matches current required pose
        if (gestureCount === currentPose) {
          if (!poseDetected) {
            setPoseDetected(true)
            setFeedback(`Pose ${currentPose} detected! Hold position...`)

            // Delay before moving to next pose
            setTimeout(() => {
              if (currentPose < 3) {
                setCurrentPose(prev => prev + 1)
                setPoseDetected(false)
                setFeedback('')
              } else {
                // All poses completed, start countdown
                startCountdown()
              }
            }, 1000)
          }
        } else {
          setPoseDetected(false)
          if (currentPose === 1) {
            setFeedback('Show one finger (index finger)')
          } else if (currentPose === 2) {
            setFeedback('Show two fingers (peace sign)')
          } else if (currentPose === 3) {
            setFeedback('Show three fingers (rock sign)')
          }
        }
      } else {
        setHandDetected(false)
        setFeedback('Please show your hand to the camera')
      }
    } catch (error) {
      console.error('Hand detection error:', error)
    }
  }, [model, currentPose, poseDetected, isCapturing, detectGesture])

  // Start detection when modal opens and model is ready
  useEffect(() => {
    if (isOpen && model && !isModelLoading) {
      detectionIntervalRef.current = setInterval(detectHands, 100) // 10 FPS
      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current)
          detectionIntervalRef.current = null
        }
      }
    }
  }, [isOpen, model, isModelLoading, detectHands])

  // Countdown and capture
  const startCountdown = useCallback(() => {
    setIsCapturing(true)
    setCountdown(3)
    setFeedback('Get ready!')

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          capturePhoto()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        onCapture(imageSrc)
        handleClose()
      }, 0)
    }
  }, [onCapture])

  const handleClose = useCallback(() => {
    // Cleanup
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
    }

    // Reset states
    setCurrentPose(1)
    setPoseDetected(false)
    setCountdown(0)
    setHandDetected(false)
    setIsCapturing(false)
    setFeedback('')

    onClose()
  }, [onClose])

  const resetPoses = useCallback(() => {
    setCurrentPose(1)
    setPoseDetected(false)
    setCountdown(0)
    setIsCapturing(false)
    setFeedback('')
  }, [])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                    AI Gesture Photo Capture
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {isModelLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 bg-teal-600 rounded-full mx-auto mb-4 animate-pulse"></div>
                      <p className="text-gray-600">Loading AI model...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pose Instructions */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Follow the gesture sequence:</h3>
                      <div className="flex justify-center space-x-8">
                        {POSE_INSTRUCTIONS.map((pose) => (
                          <div key={pose.id} className={`text-center p-3 rounded-lg transition-colors ${
                            currentPose === pose.id
                              ? 'bg-teal-100 border-2 border-teal-500'
                              : currentPose > pose.id
                                ? 'bg-green-100 border-2 border-green-500'
                                : 'bg-white border-2 border-gray-200'
                          }`}>
                            <div className="text-3xl mb-2">{pose.emoji}</div>
                            <div className="text-xs font-medium text-gray-700">{pose.name}</div>
                            <div className="text-xs text-gray-500">{pose.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Webcam and Overlays */}
                    <div className="relative">
                      {/* Countdown Overlay */}
                      {countdown > 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                          <div className="text-white text-6xl font-bold animate-pulse">
                            {countdown}
                          </div>
                        </div>
                      )}

                      {/* Hand Detection Status */}
                      <div className="absolute top-4 left-4 z-10">
                        <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                          handDetected ? 'bg-green-500' : 'bg-red-500'
                        } text-white text-sm`}>
                          <Hand className="h-4 w-4" />
                          <span>{handDetected ? 'Hand Detected' : 'No Hand'}</span>
                        </div>
                      </div>

                      {/* Current Pose Indicator */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                          Pose {currentPose}/3: {getCurrentPoseInstruction(currentPose).emoji}
                        </div>
                      </div>

                      {/* Webcam */}
                      <div className="relative rounded-lg overflow-hidden bg-gray-100">
                        <Webcam
                          ref={webcamRef}
                          audio={false}
                          width={800}
                          height={600}
                          screenshotFormat="image/jpeg"
                          videoConstraints={{
                            width: 800,
                            height: 600,
                            facingMode: "user"
                          }}
                          className="w-full h-auto"
                        />
                      </div>

                      {/* Hidden canvas for processing */}
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </div>

                    {/* Feedback */}
                    <div className="text-center">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-medium">
                          {feedback || `Show ${getCurrentPoseInstruction(currentPose).description.toLowerCase()}`}
                        </p>
                        {poseDetected && (
                          <div className="mt-2">
                            <div className="inline-flex items-center text-green-600">
                              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Gesture detected!
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reset Button */}
                      <div className="mt-4">
                        <button
                          onClick={resetPoses}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          disabled={isCapturing}
                        >
                          Reset Sequence
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
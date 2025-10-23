'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X, Camera } from 'lucide-react'
import Webcam from 'react-webcam'
import * as tf from '@tensorflow/tfjs'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import { Button } from '@/components/ui/Button'

interface WebcamGestureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageBase64: string) => void
}

const POSE_INSTRUCTIONS = [
  { id: 1, emoji: '☝️', name: 'One Finger', description: 'Show one finger' },
  { id: 2, emoji: '✌️', name: 'Two Fingers', description: 'Show two fingers (peace sign)' },
  { id: 3, emoji: '🤟', name: 'Three Fingers', description: 'Show three fingers (rock sign)' }
]

export function WebcamGestureModal({ isOpen, onClose, onCapture }: WebcamGestureModalProps) {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detector, setDetector] = useState<handPoseDetection.HandDetector | null>(null)
  const [currentPose, setCurrentPose] = useState(1)
  const [poseDetected, setPoseDetected] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [handDetected, setHandDetected] = useState(false)
  const [loading, setLoading] = useState(true)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize TensorFlow and hand pose detection
  useEffect(() => {
    if (!isOpen) return

    const initializeDetector = async () => {
      try {
        setLoading(true)

        // Initialize TensorFlow backend
        await tf.ready()

        // Create hand pose detector
        const model = handPoseDetection.SupportedModels.MediaPipeHands
        const detectorConfig = {
          runtime: 'tfjs' as const,
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
          modelType: 'full' as const,
          maxHands: 1
        }

        const handDetector = await handPoseDetection.createDetector(model, detectorConfig)
        setDetector(handDetector)
        setLoading(false)

        // Start pose detection
        startPoseDetection()
      } catch (error) {
        console.error('Error initializing hand pose detection:', error)
        setLoading(false)
      }
    }

    initializeDetector()

    return () => {
      stopPoseDetection()
      if (detector) {
        detector.dispose()
      }
    }
  }, [isOpen])

  const startPoseDetection = useCallback(() => {
    if (detectionIntervalRef.current) return

    detectionIntervalRef.current = setInterval(async () => {
      if (!webcamRef.current?.video || !detector || isCapturing) return

      const video = webcamRef.current.video
      if (video.readyState !== 4) return

      try {
        const hands = await detector.estimateHands(video)

        if (hands.length > 0) {
          setHandDetected(true)
          const hand = hands[0]
          const gestureDetected = detectGesture(hand, currentPose)

          if (gestureDetected && !poseDetected) {
            setPoseDetected(true)

            // Move to next pose or start countdown
            if (currentPose < 3) {
              setTimeout(() => {
                setCurrentPose(prev => prev + 1)
                setPoseDetected(false)
              }, 1000)
            } else {
              // All poses completed, start countdown
              startCountdown()
            }
          }
        } else {
          setHandDetected(false)
        }
      } catch (error) {
        console.error('Error detecting poses:', error)
      }
    }, 100)
  }, [detector, currentPose, poseDetected, isCapturing])

  const stopPoseDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }, [])

  const detectGesture = (hand: any, targetPose: number): boolean => {
    if (!hand.keypoints) return false

    const landmarks = hand.keypoints

    // Get finger tip and base positions
    const thumbTip = landmarks[4]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]
    const ringTip = landmarks[16]
    const pinkyTip = landmarks[20]

    const indexBase = landmarks[6]
    const middleBase = landmarks[10]
    const ringBase = landmarks[14]
    const pinkyBase = landmarks[18]

    // Check if fingers are extended (tip above base)
    const isIndexExtended = indexTip.y < indexBase.y
    const isMiddleExtended = middleTip.y < middleBase.y
    const isRingExtended = ringTip.y < ringBase.y
    const isPinkyExtended = pinkyTip.y < pinkyBase.y

    switch (targetPose) {
      case 1: // One finger (index)
        return isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended
      case 2: // Two fingers (peace sign)
        return isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended
      case 3: // Three fingers (rock sign)
        return isIndexExtended && isMiddleExtended && isRingExtended && !isPinkyExtended
      default:
        return false
    }
  }

  const startCountdown = useCallback(() => {
    setIsCapturing(true)
    setCountdown(3)

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Countdown finished, capture photo
          capturePhoto()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return

    const imageSrc = webcamRef.current.getScreenshot()
    if (imageSrc) {
      onCapture(imageSrc)
      handleClose()
    }
  }, [onCapture])

  const handleClose = useCallback(() => {
    stopPoseDetection()
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    // Reset state
    setCurrentPose(1)
    setPoseDetected(false)
    setCountdown(0)
    setIsCapturing(false)
    setHandDetected(false)
    setLoading(true)

    onClose()
  }, [onClose, stopPoseDetection])

  const getCurrentInstruction = () => {
    if (loading) return "Loading hand detection model..."
    if (isCapturing && countdown > 0) return `Get ready! ${countdown}`
    if (isCapturing && countdown === 0) return "Capturing..."
    if (!handDetected) return "Please show your hand to the camera"
    if (poseDetected) return `Great! ${POSE_INSTRUCTIONS[currentPose - 1].name} detected!`
    return `Show: ${POSE_INSTRUCTIONS[currentPose - 1].description}`
  }

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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Gesture-Controlled Photo Capture
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isCapturing}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Video Feed */}
                  <div className="lg:col-span-2">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full h-96 object-cover"
                        videoConstraints={{
                          width: 640,
                          height: 480,
                          facingMode: "user"
                        }}
                      />

                      {/* Overlay for countdown */}
                      {isCapturing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-black bg-opacity-50 rounded-full w-24 h-24 flex items-center justify-center">
                            <span className="text-white text-4xl font-bold">
                              {countdown > 0 ? countdown : '📸'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Hand not detected overlay */}
                      {!handDetected && !loading && (
                        <div className="absolute top-4 left-4 right-4">
                          <div className="bg-red-500 bg-opacity-80 text-white px-4 py-2 rounded-lg text-center">
                            Hand not detected - Please show your hand clearly
                          </div>
                        </div>
                      )}

                      {/* Loading overlay */}
                      {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p>Loading AI model...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Instruction */}
                    <div className="mt-4 text-center">
                      <p className="text-lg font-medium text-gray-900">
                        {getCurrentInstruction()}
                      </p>
                    </div>
                  </div>

                  {/* Instructions Panel */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Follow these poses:</h3>

                    {POSE_INSTRUCTIONS.map((pose) => (
                      <div
                        key={pose.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          currentPose === pose.id
                            ? poseDetected
                              ? 'border-green-500 bg-green-50'
                              : 'border-blue-500 bg-blue-50'
                            : currentPose > pose.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{pose.emoji}</span>
                          <div>
                            <p className="font-medium text-gray-900">{pose.name}</p>
                            <p className="text-sm text-gray-600">{pose.description}</p>
                          </div>
                          {currentPose > pose.id && (
                            <span className="text-green-500 ml-auto">✓</span>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                      <ol className="text-sm text-blue-800 space-y-1">
                        <li>1. Show each pose in order</li>
                        <li>2. Hold the pose until detected</li>
                        <li>3. After all poses, countdown starts</li>
                        <li>4. Photo captures automatically</li>
                      </ol>
                    </div>

                    {/* Manual capture button */}
                    <Button
                      onClick={capturePhoto}
                      disabled={loading || isCapturing}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      size="lg"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Manual Capture
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
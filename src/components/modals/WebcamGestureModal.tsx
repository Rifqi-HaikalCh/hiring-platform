'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X, Camera, Hand, Video } from 'lucide-react'
import Webcam from 'react-webcam'
import { HandLandmarker, FilesetResolver, HandLandmarkerResult } from '@mediapipe/tasks-vision'

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

type PoseType = 'POSE_1' | 'POSE_2' | 'POSE_3' | 'UNDETECTED'

export function WebcamGestureModal({ isOpen, onClose, onCapture }: WebcamGestureModalProps) {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastVideoTimeRef = useRef(-1)

  // Helper function to safely get pose instruction
  const getCurrentPoseInstruction = useCallback((pose: number) => {
    const index = pose - 1
    return POSE_INSTRUCTIONS[index] || POSE_INSTRUCTIONS[0]
  }, [])

  // States
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null)
  const [isModelLoading, setIsModelLoading] = useState(true)
  const [currentPose, setCurrentPose] = useState(1)
  const [poseDetected, setPoseDetected] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [handDetected, setHandDetected] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [feedback, setFeedback] = useState('')

  // Camera selection states
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined)

  // Load MediaPipe HandLandmarker model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true)

        // Initialize MediaPipe FilesetResolver
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )

        // Create HandLandmarker with VIDEO running mode
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        })

        setHandLandmarker(landmarker)
        setIsModelLoading(false)
        console.log('HandLandmarker model loaded successfully')
      } catch (error) {
        console.error('Error loading HandLandmarker:', error)
        setIsModelLoading(false)
      }
    }

    if (isOpen) {
      loadModel()
    }

    return () => {
      // Cleanup
      if (handLandmarker) {
        handLandmarker.close()
      }
    }
  }, [isOpen])

  // Enumerate video devices for camera selection
  useEffect(() => {
    const getVideoDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoInputs = devices.filter(device => device.kind === 'videoinput')
        setVideoDevices(videoInputs)

        // Set default device if available
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId)
        }
      } catch (error) {
        console.error('Error enumerating devices:', error)
      }
    }

    if (isOpen) {
      getVideoDevices()
    }
  }, [isOpen])

  // Fungsi untuk mendeteksi gesture berdasarkan landmarks
  const classifyGesture = useCallback((landmarks: any[]): PoseType => {
    if (!landmarks || landmarks.length === 0) return 'UNDETECTED'

    // Landmark indices untuk jari-jari
    const fingerTips = [8, 12, 16, 20] // index, middle, ring, pinky tips
    const fingerPips = [6, 10, 14, 18] // index, middle, ring, pinky PIPs
    const thumbTip = 4
    const thumbIp = 3

    let extendedFingers = 0

    // Check thumb (berbeda karena orientasi horizontal)
    // Thumb dianggap extended jika tip lebih ke kanan dari IP joint
    if (landmarks[thumbTip].x > landmarks[thumbIp].x) {
      extendedFingers++
    }

    // Check other fingers (vertical orientation)
    // Finger dianggap extended jika tip lebih tinggi (y lebih kecil) dari PIP
    for (let i = 0; i < fingerTips.length; i++) {
      if (landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y) {
        extendedFingers++
      }
    }

    // Map to pose types
    if (extendedFingers === 1) return 'POSE_1'
    if (extendedFingers === 2) return 'POSE_2'
    if (extendedFingers === 3) return 'POSE_3'

    return 'UNDETECTED'
  }, [])

  // Calculate bounding box from landmarks
  const getBoundingBox = useCallback((landmarks: any[], canvasWidth: number, canvasHeight: number) => {
    let minX = 1, minY = 1, maxX = 0, maxY = 0

    landmarks.forEach((landmark: any) => {
      minX = Math.min(minX, landmark.x)
      minY = Math.min(minY, landmark.y)
      maxX = Math.max(maxX, landmark.x)
      maxY = Math.max(maxY, landmark.y)
    })

    // Add padding (10%)
    const padding = 0.1
    const width = maxX - minX
    const height = maxY - minY

    minX = Math.max(0, minX - width * padding)
    minY = Math.max(0, minY - height * padding)
    maxX = Math.min(1, maxX + width * padding)
    maxY = Math.min(1, maxY + height * padding)

    return {
      x: minX * canvasWidth,
      y: minY * canvasHeight,
      width: (maxX - minX) * canvasWidth,
      height: (maxY - minY) * canvasHeight
    }
  }, [])

  // Draw visualization on canvas
  const drawVisualization = useCallback((
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    classifiedPose: PoseType,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    if (landmarks && landmarks.length > 0) {
      // Calculate bounding box
      const bbox = getBoundingBox(landmarks, canvasWidth, canvasHeight)

      // Determine color based on pose match
      const expectedPose = `POSE_${currentPose}` as PoseType
      const isMatch = classifiedPose === expectedPose
      const boxColor = isMatch ? '#10b981' : '#ef4444' // green : red
      const bgColor = isMatch ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'

      // Draw bounding box
      ctx.strokeStyle = boxColor
      ctx.lineWidth = 4
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height)

      // Draw semi-transparent fill
      ctx.fillStyle = bgColor
      ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height)

      // Draw label
      const labelText = classifiedPose === 'UNDETECTED' ? 'Undetected' : classifiedPose.replace('_', ' ')
      const labelPadding = 8
      const fontSize = 18
      ctx.font = `bold ${fontSize}px Arial`
      const textMetrics = ctx.measureText(labelText)
      const textWidth = textMetrics.width
      const textHeight = fontSize

      // Label background
      ctx.fillStyle = boxColor
      ctx.fillRect(
        bbox.x,
        bbox.y - textHeight - labelPadding * 2,
        textWidth + labelPadding * 2,
        textHeight + labelPadding * 2
      )

      // Label text
      ctx.fillStyle = '#ffffff'
      ctx.fillText(
        labelText,
        bbox.x + labelPadding,
        bbox.y - labelPadding
      )
    }
  }, [currentPose, getBoundingBox])

  // Detection loop using requestAnimationFrame
  const predictWebcam = useCallback(async () => {
    if (!handLandmarker || !webcamRef.current?.video || isCapturing) {
      if (!isCapturing) {
        animationRef.current = requestAnimationFrame(predictWebcam)
      }
      return
    }

    const video = webcamRef.current.video
    const canvas = canvasRef.current

    if (video.readyState !== 4 || !canvas) {
      animationRef.current = requestAnimationFrame(predictWebcam)
      return
    }

    // Ensure canvas dimensions match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      animationRef.current = requestAnimationFrame(predictWebcam)
      return
    }

    try {
      // Get current video time
      const nowInMs = Date.now()

      // Only process if this is a new frame
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime

        // Detect hand landmarks
        const results: HandLandmarkerResult = handLandmarker.detectForVideo(video, nowInMs)

        if (results.landmarks && results.landmarks.length > 0) {
          setHandDetected(true)
          const landmarks = results.landmarks[0]
          const classifiedPose = classifyGesture(landmarks)

          // Draw visualization
          drawVisualization(ctx, landmarks, classifiedPose, canvas.width, canvas.height)

          // Check if gesture matches current required pose
          const expectedPose = `POSE_${currentPose}` as PoseType

          if (classifiedPose === expectedPose) {
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
          // Clear canvas when no hand detected
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    } catch (error) {
      console.error('Hand detection error:', error)
    }

    // Continue the loop
    animationRef.current = requestAnimationFrame(predictWebcam)
  }, [handLandmarker, currentPose, poseDetected, isCapturing, classifyGesture, drawVisualization])

  // Start detection loop when model is ready
  useEffect(() => {
    if (isOpen && handLandmarker && !isModelLoading && webcamRef.current?.video) {
      // Start the detection loop
      animationRef.current = requestAnimationFrame(predictWebcam)

      return () => {
        if (animationRef.current !== null) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
      }
    }
  }, [isOpen, handLandmarker, isModelLoading, predictWebcam])

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
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    // Reset states
    setCurrentPose(1)
    setPoseDetected(false)
    setCountdown(0)
    setHandDetected(false)
    setIsCapturing(false)
    setFeedback('')
    lastVideoTimeRef.current = -1

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header */}
                <div className="border-b border-gray-200 bg-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-teal-100">
                        <Hand className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                          AI Gesture Capture
                        </Dialog.Title>
                        <p className="text-sm text-gray-600">Follow the gesture sequence to capture your photo</p>
                      </div>
                    </div>

                    <button
                      onClick={handleClose}
                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="px-6 py-6 bg-white">
                  {isModelLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-teal-600 rounded-full mx-auto mb-4 animate-pulse"></div>
                        <p className="text-gray-600">Loading AI model...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                    {/* Camera Selection */}
                    {videoDevices.length > 1 && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <Video className="h-5 w-5 text-gray-600" />
                          <label htmlFor="camera-select" className="text-sm font-medium text-gray-700">
                            Select Camera:
                          </label>
                          <select
                            id="camera-select"
                            value={selectedDeviceId || ''}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            {videoDevices.map((device, index) => (
                              <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Camera ${index + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Pose Instructions */}
                    <div className="bg-teal-50 p-5 rounded-xl border border-teal-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <Hand className="h-4 w-4 mr-2 text-teal-600" />
                        Follow the gesture sequence:
                      </h3>
                      <div className="flex justify-center space-x-6">
                        {POSE_INSTRUCTIONS.map((pose) => (
                          <div key={pose.id} className={`text-center p-4 rounded-xl transition-all duration-300 ${
                            currentPose === pose.id
                              ? 'bg-white border-2 border-teal-500 shadow-lg shadow-teal-200/50 scale-105'
                              : currentPose > pose.id
                                ? 'bg-white border-2 border-green-500 shadow-md shadow-green-100/50'
                                : 'bg-white/50 border-2 border-gray-200/50'
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
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 rounded-lg">
                          <div className="text-white text-6xl font-bold animate-pulse">
                            {countdown}
                          </div>
                        </div>
                      )}

                      {/* Hand Detection Status */}
                      <div className="absolute top-4 left-4 z-10">
                        <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                          handDetected ? 'bg-green-500' : 'bg-red-500'
                        } text-white text-sm shadow-lg`}>
                          <Hand className="h-4 w-4" />
                          <span>{handDetected ? 'Hand Detected' : 'No Hand'}</span>
                        </div>
                      </div>

                      {/* Current Pose Indicator */}
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm shadow-lg">
                          Pose {currentPose}/3: {getCurrentPoseInstruction(currentPose).emoji}
                        </div>
                      </div>

                      {/* Webcam with Canvas Overlay */}
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
                            facingMode: "user",
                            deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
                          }}
                          className="w-full h-auto"
                        />
                        {/* Canvas Overlay for Visual Feedback */}
                        <canvas
                          ref={canvasRef}
                          className="absolute top-0 left-0 w-full h-full pointer-events-none"
                          style={{ mixBlendMode: 'normal' }}
                        />
                      </div>
                    </div>

                    {/* Feedback */}
                    <div className="text-center">
                      <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-5">
                        <p className="text-teal-900 font-semibold text-base">
                          {feedback || `Show ${getCurrentPoseInstruction(currentPose).description.toLowerCase()}`}
                        </p>
                        {poseDetected && (
                          <div className="mt-3">
                            <div className="inline-flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg">
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
                          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isCapturing}
                        >
                          Reset Sequence
                        </button>
                      </div>
                    </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

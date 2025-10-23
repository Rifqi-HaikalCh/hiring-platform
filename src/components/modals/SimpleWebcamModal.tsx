'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { X, Camera, RotateCcw } from 'lucide-react'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/Button'

interface SimpleWebcamModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (imageBase64: string) => void
}

export function SimpleWebcamModal({ isOpen, onClose, onCapture }: SimpleWebcamModalProps) {
  const webcamRef = useRef<Webcam>(null)
  const [countdown, setCountdown] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)

  const startCountdown = useCallback(() => {
    if (isCapturing) return

    setIsCapturing(true)
    setCountdown(3)

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
  }, [isCapturing])

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      onCapture(imageSrc)
      setIsCapturing(false)
      onClose()
    }
  }, [onCapture, onClose])

  const retake = useCallback(() => {
    setIsCapturing(false)
    setCountdown(0)
  }, [])

  const handleClose = useCallback(() => {
    setIsCapturing(false)
    setCountdown(0)
    onClose()
  }, [onClose])

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                    Take Profile Photo
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="relative">
                  {/* Countdown Overlay */}
                  {countdown > 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
                      <div className="text-white text-6xl font-bold animate-pulse">
                        {countdown}
                      </div>
                    </div>
                  )}

                  {/* Webcam */}
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      width={640}
                      height={480}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user"
                      }}
                      className="w-full h-auto"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="mt-4 text-center">
                    <p className="text-gray-600 text-sm mb-4">
                      Position yourself in the center of the frame and look at the camera
                    </p>

                    {/* Controls */}
                    <div className="flex justify-center space-x-4">
                      {!isCapturing ? (
                        <Button
                          onClick={startCountdown}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
                        >
                          <Camera className="h-5 w-5" />
                          <span>Take Photo</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={retake}
                          variant="outline"
                          className="px-6 py-2 rounded-lg flex items-center space-x-2"
                        >
                          <RotateCcw className="h-5 w-5" />
                          <span>Retake</span>
                        </Button>
                      )}
                    </div>
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
'use client'

import { useRef, useState } from "react"
import { Button } from "./ui/button"

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0)
      const imageData = canvas.toDataURL("image/jpeg")
      setImage(imageData)
      stopCamera()
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  const submitImage = async () => {
    if (!image) return

    try {
      setLoading(true)
      const position = await getCurrentPosition()
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        })
      })

      if (!response.ok) throw new Error('Failed to submit')
    } catch (error) {
      console.error('Error submitting:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })
  }

  // Start camera when component mounts
  useState(() => {
    startCamera()
    return () => stopCamera()
  })

  return (
    <div className="flex flex-col items-center gap-4">
      {!image ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-md rounded-lg"
          />
          <div className="flex gap-2">
            <Button onClick={captureImage}>Capture</Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <img 
            src={image} 
            alt="Captured" 
            className="w-full max-w-md rounded-lg"
          />
          <div className="flex gap-2">
            <Button 
              onClick={submitImage} 
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setImage(null)
                startCamera()
              }}
            >
              Retake
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

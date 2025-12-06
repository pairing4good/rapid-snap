import { useEffect, useRef, useState } from 'react'
import './CameraView.css'

function CameraView({ photoCount, onAddPhoto, onDone }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    initCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const initCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Camera access denied. Please allow camera access to use this app.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      onAddPhoto({ url, blob, edited: false })
    }, 'image/jpeg', 0.95)
  }

  const handleDone = () => {
    if (photoCount === 0) {
      alert('Take at least one photo first!')
      return
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    onDone()
  }

  if (error) {
    return (
      <div className="camera-view error-view">
        <div className="error-message">
          <h2>⚠️ Camera Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="camera-view">
      <video ref={videoRef} autoPlay playsInline />
      <div className="photo-counter">{photoCount} photo{photoCount !== 1 ? 's' : ''}</div>
      <div className="camera-controls">
        <button className="capture-btn" onClick={capturePhoto} />
        <button className="done-btn" onClick={handleDone}>Done</button>
      </div>
    </div>
  )
}

export default CameraView

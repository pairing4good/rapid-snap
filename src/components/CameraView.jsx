import { useEffect, useRef, useState } from 'react'
import { initCamera, stopCamera, capturePhotoFromVideo } from '../utils/cameraUtils'
import './CameraView.css'

function CameraView({ photoCount, onAddPhoto, onDone }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    initCameraStream()
    return () => {
      stopCamera(stream)
    }
  }, [])

  const initCameraStream = async () => {
    try {
      const mediaStream = await initCamera()
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const capturePhoto = async () => {
    try {
      const photoData = await capturePhotoFromVideo(videoRef.current)
      onAddPhoto(photoData)
    } catch (err) {
      console.error('Failed to capture photo:', err)
    }
  }

  const handleDone = () => {
    if (photoCount === 0) {
      alert('Take at least one photo first!')
      return
    }
    stopCamera(stream)
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

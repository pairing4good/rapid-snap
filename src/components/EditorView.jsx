import { useEffect, useRef, useState, useCallback } from 'react'
import { applyPixelManipulation, applyFilterEffect } from '../filters'
import { 
  getCanvasCoordinates, 
  calculateCropArea, 
  drawCropOverlay, 
  isValidCropArea, 
  applyCropToCanvas 
} from '../utils/cropUtils'
import './EditorView.css'

function EditorView({ photo, onSave, onCancel }) {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const cropCanvasRef = useRef(null)
  const [currentFilter, setCurrentFilter] = useState('none')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [cropStart, setCropStart] = useState(null)
  const [cropEnd, setCropEnd] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const applyEdits = useCallback(() => {
    if (!imageRef.current || !canvasRef.current) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = imageRef.current

    // Clear and draw original image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Apply adjustments
    const brightnessVal = brightness / 100
    const contrastVal = (contrast - 100) * 2.55
    const saturationVal = saturation / 100

    applyPixelManipulation(imageData, brightnessVal, contrastVal, saturationVal)

    // Apply filter effect
    if (currentFilter !== 'none') {
      applyFilterEffect(imageData, currentFilter)
    }

    // Put modified image data back
    ctx.putImageData(imageData, 0, 0)
  }, [brightness, contrast, saturation, currentFilter])

  useEffect(() => {
    if (!photo || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      imageRef.current = img
      setImageLoaded(true)
    }

    img.src = photo.url
  }, [photo])

  useEffect(() => {
    if (imageLoaded) {
      applyEdits()
    }
  }, [imageLoaded, applyEdits])

  // Prevent scrolling during crop with non-passive touch events
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const preventScroll = (e) => {
      if (isCropping && isDragging) {
        e.preventDefault()
      }
    }

    canvas.addEventListener('touchmove', preventScroll, { passive: false })
    
    return () => {
      canvas.removeEventListener('touchmove', preventScroll)
    }
  }, [isCropping, isDragging])

  useEffect(() => {
    if (!isCropping || !cropStart || !cropEnd || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Redraw with current edits
    applyEdits()

    // Draw crop overlay
    const cropArea = calculateCropArea(cropStart, cropEnd)
    drawCropOverlay(ctx, cropArea, canvas.width, canvas.height)
  }, [cropStart, cropEnd, isCropping, applyEdits])

  const handleReset = () => {
    setCurrentFilter('none')
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setIsCropping(false)
    setCropStart(null)
    setCropEnd(null)
    
    // Reload original image
    if (!photo || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      imageRef.current = img
      ctx.drawImage(img, 0, 0)
    }
    
    img.src = photo.url
  }

  const handleCropStart = (e) => {
    if (!isCropping) return
    const coords = getCanvasCoordinates(e, canvasRef.current)
    setCropStart(coords)
    setCropEnd(coords)
    setIsDragging(true)
  }

  const handleCropMove = (e) => {
    if (!isCropping || !isDragging || !cropStart) return
    const coords = getCanvasCoordinates(e, canvasRef.current)
    setCropEnd(coords)
  }

  const handleCropEnd = () => {
    setIsDragging(false)
  }

  const applyCrop = async () => {
    if (!cropStart || !cropEnd || !canvasRef.current) return

    const cropArea = calculateCropArea(cropStart, cropEnd)
    
    if (!isValidCropArea(cropArea)) return

    try {
      const croppedImg = await applyCropToCanvas(canvasRef.current, cropArea)
      imageRef.current = croppedImg
      setIsCropping(false)
      setCropStart(null)
      setCropEnd(null)
      applyEdits()
    } catch (error) {
      console.error('Failed to apply crop:', error)
    }
  }

  const handleSave = () => {
    if (!canvasRef.current) return

    canvasRef.current.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      onSave({ url, blob, edited: true })
    }, 'image/jpeg', 0.95)
  }

  const filters = [
    { id: 'none', label: 'Original' },
    { id: 'grayscale', label: 'B&W' },
    { id: 'sepia', label: 'Sepia' },
    { id: 'vintage', label: 'Vintage' },
    { id: 'cool', label: 'Cool' },
    { id: 'warm', label: 'Warm' }
  ]

  return (
    <div className={`editor-view ${isCropping ? 'crop-mode' : ''}`}>
      <div className="editor-header">
        <button className="back-btn" onClick={onCancel}>Cancel</button>
        <h2>Edit Photo</h2>
        <button className="upload-btn" onClick={handleSave}>Save</button>
      </div>

      <div className="editor-canvas-container">
        <canvas 
          ref={canvasRef}
          onMouseDown={handleCropStart}
          onMouseMove={handleCropMove}
          onMouseUp={handleCropEnd}
          onMouseLeave={handleCropEnd}
          onTouchStart={handleCropStart}
          onTouchMove={handleCropMove}
          onTouchEnd={handleCropEnd}
          onTouchCancel={handleCropEnd}
          style={{ 
            cursor: isCropping ? 'crosshair' : 'default',
            touchAction: isCropping ? 'none' : 'auto'
          }}
        />
      </div>

      <div className="editor-controls">
        <div className="action-buttons">
          <button 
            className={`action-btn ${isCropping ? 'active' : ''}`}
            onClick={() => {
              if (isCropping && cropStart && cropEnd) {
                applyCrop()
              } else if (isCropping) {
                // Cancel crop mode
                setIsCropping(false)
                setCropStart(null)
                setCropEnd(null)
                applyEdits()
              } else {
                setIsCropping(true)
                setCropStart(null)
                setCropEnd(null)
              }
            }}
          >
            {isCropping ? (cropStart && cropEnd ? 'Apply Crop' : 'Cancel') : 'Crop'}
          </button>
          {!isCropping && (
            <button className="action-btn" onClick={handleReset}>
              Reset All
            </button>
          )}
        </div>

        {!isCropping && (
          <div className="filter-buttons">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${currentFilter === filter.id ? 'active' : ''}`}
              onClick={() => setCurrentFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        )}

        {!isCropping && (
        <div className="adjustment-controls">
          <div className="control-group">
            <label>Brightness</label>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Contrast</label>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label>Saturation</label>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
            />
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default EditorView

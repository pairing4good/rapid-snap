import { useEffect, useRef, useState, useCallback } from 'react'
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

  const applyPixelManipulation = (imageData, brightnessVal, contrastVal, saturationVal) => {
    const data = imageData.data
    const contrastFactor = (259 * (contrastVal + 255)) / (255 * (259 - contrastVal))

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // Apply brightness
      r = r * brightnessVal
      g = g * brightnessVal
      b = b * brightnessVal

      // Apply contrast
      r = contrastFactor * (r - 128) + 128
      g = contrastFactor * (g - 128) + 128
      b = contrastFactor * (b - 128) + 128

      // Apply saturation
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b
      r = gray + saturationVal * (r - gray)
      g = gray + saturationVal * (g - gray)
      b = gray + saturationVal * (b - gray)

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r))
      data[i + 1] = Math.max(0, Math.min(255, g))
      data[i + 2] = Math.max(0, Math.min(255, b))
    }

    return imageData
  }

  const applyFilterEffect = (imageData, filter) => {
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      switch (filter) {
        case 'grayscale':
          const gray = 0.299 * r + 0.587 * g + 0.114 * b
          data[i] = data[i + 1] = data[i + 2] = gray
          break
        case 'sepia':
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
          break
        case 'vintage':
          const sepiaR = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
          const sepiaG = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
          const sepiaB = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
          data[i] = sepiaR * 0.5 + r * 0.5
          data[i + 1] = sepiaG * 0.5 + g * 0.5
          data[i + 2] = sepiaB * 0.5 + b * 0.5
          break
        case 'cool':
          data[i] = Math.min(255, r * 0.5 + b * 0.5)
          data[i + 2] = Math.min(255, b * 1.2)
          break
        case 'warm':
          data[i] = Math.min(255, r * 1.2)
          data[i + 1] = Math.min(255, g * 1.1)
          data[i + 2] = Math.min(255, b * 0.8)
          break
      }
    }

    return imageData
  }

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

  useEffect(() => {
    if (!isCropping || !cropStart || !cropEnd || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Redraw with current edits
    applyEdits()

    // Draw crop rectangle
    const x = Math.min(cropStart.x, cropEnd.x)
    const y = Math.min(cropStart.y, cropEnd.y)
    const width = Math.abs(cropEnd.x - cropStart.x)
    const height = Math.abs(cropEnd.y - cropStart.y)

    ctx.strokeStyle = '#007aff'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.strokeRect(x, y, width, height)
    ctx.setLineDash([])

    // Darken outside of crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, y)
    ctx.fillRect(0, y, x, height)
    ctx.fillRect(x + width, y, canvas.width - (x + width), height)
    ctx.fillRect(0, y + height, canvas.width, canvas.height - (y + height))
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
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top
    setCropStart({ x: x * scaleX, y: y * scaleY })
    setCropEnd({ x: x * scaleX, y: y * scaleY })
    setIsDragging(true)
  }

  const handleCropMove = (e) => {
    if (!isCropping || !isDragging || !cropStart) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX || e.touches[0].clientX) - rect.left
    const y = (e.clientY || e.touches[0].clientY) - rect.top
    setCropEnd({ x: x * scaleX, y: y * scaleY })
  }

  const handleCropEnd = () => {
    setIsDragging(false)
  }

  const applyCrop = () => {
    if (!cropStart || !cropEnd || !canvasRef.current) return

    const x = Math.min(cropStart.x, cropEnd.x)
    const y = Math.min(cropStart.y, cropEnd.y)
    const width = Math.abs(cropEnd.x - cropStart.x)
    const height = Math.abs(cropEnd.y - cropStart.y)

    if (width < 10 || height < 10) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(x, y, width, height)

    canvas.width = width
    canvas.height = height
    ctx.putImageData(imageData, 0, 0)

    // Update image ref with cropped version
    const croppedImg = new Image()
    croppedImg.onload = () => {
      imageRef.current = croppedImg
      setIsCropping(false)
      setCropStart(null)
      setCropEnd(null)
      applyEdits()
    }
    croppedImg.src = canvas.toDataURL()
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
    <div className="editor-view">
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
          style={{ cursor: isCropping ? 'crosshair' : 'default' }}
        />
      </div>

      <div className="editor-controls">
        <div className="action-buttons">
          <button 
            className={`action-btn ${isCropping ? 'active' : ''}`}
            onClick={() => {
              if (isCropping && cropStart && cropEnd) {
                applyCrop()
              } else {
                setIsCropping(!isCropping)
                setCropStart(null)
                setCropEnd(null)
              }
            }}
          >
            {isCropping ? (cropStart && cropEnd ? 'Apply Crop' : 'Cancel') : 'Crop'}
          </button>
          <button className="action-btn" onClick={handleReset}>
            Reset All
          </button>
        </div>

        <div className="filter-buttons">
          {filters.map(filter => (
            <button
              key={filter.id}
              className={`filter-btn ${currentFilter === filter.id ? 'active' : ''}`}
              onClick={() => setCurrentFilter(filter.id)}
              disabled={isCropping}
            >
              {filter.label}
            </button>
          ))}
        </div>

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
      </div>
    </div>
  )
}

export default EditorView

# Implementation Guide: Rapid Photo Capture for React Apps

This guide helps you add rapid-fire photo capture capabilities to an existing React camera app. Based on lessons learned from building Rapid Snap, this document covers the key techniques, architecture decisions, and mobile-specific optimizations.

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [High-Resolution Camera Setup](#high-resolution-camera-setup)
3. [Rapid Capture with Visual Feedback](#rapid-capture-with-visual-feedback)
4. [Mobile Image Editing](#mobile-image-editing)
5. [Touch-Friendly Crop Tool](#touch-friendly-crop-tool)
6. [Multi-Select Gallery](#multi-select-gallery)
7. [Code Organization](#code-organization)
8. [Common Pitfalls](#common-pitfalls)

---

## Core Concepts

### The Rapid Capture Pattern
Traditional camera apps require users to:
1. Take photo → 2. Review → 3. Accept/Retake → 4. Repeat

Rapid capture eliminates review friction:
1. **Continuous capture** - No confirmation dialogs
2. **Instant feedback** - Visual flash animation (150ms)
3. **Live counter** - Shows capture count in real-time
4. **Batch review** - Edit/delete after all captures complete

**Use Case**: Document scanning, receipt capture, multi-item photography

### State Architecture
```javascript
// App-level state
const [photos, setPhotos] = useState([])
const [currentView, setCurrentView] = useState('camera') // camera | gallery | editor
const [editingIndex, setEditingIndex] = useState(null)

// Photo object structure
{
  url: string,      // Blob URL created with URL.createObjectURL()
  blob: Blob,       // Original JPEG blob
  edited: boolean   // Track if photo has been modified
}
```

**Critical**: Always use `URL.revokeObjectURL()` when removing photos to prevent memory leaks.

---

## High-Resolution Camera Setup

### Problem
Default browser camera streams use low resolution (typically 640x480 or 1280x720), even on devices with high-resolution cameras.

### Solution
Request highest available resolution using `ideal` constraints:

```javascript
// utils/cameraUtils.js
export async function initCamera(constraints = {}) {
  const defaultConstraints = {
    video: { 
      facingMode: 'environment',  // Rear camera on mobile
      width: { ideal: 4096 },     // Request 4K width
      height: { ideal: 2160 }     // Request 4K height
    },
    audio: false,
    ...constraints
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints)
    return stream
  } catch (error) {
    throw new Error('Camera access denied. Please allow camera access.')
  }
}
```

### Capture Quality
```javascript
export function capturePhotoFromVideo(videoElement, quality = 0.98) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    
    // Use actual video dimensions (not display size)
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoElement, 0, 0)

    // High-quality JPEG (0.98 = 98% quality)
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      resolve({ url, blob, edited: false })
    }, 'image/jpeg', quality)
  })
}
```

**Trade-offs**:
- **Web vs Native**: Web apps get ~1080p max on iOS/Safari, native camera apps get full sensor resolution (12MP+)
- **Quality vs Size**: 0.98 quality is a sweet spot (minimal artifacts, reasonable file size)
- **Performance**: Higher resolution = larger canvas operations = slower filters

---

## Rapid Capture with Visual Feedback

### The Flash Effect
Professional camera apps provide instant tactile feedback. Web implementation:

```javascript
// Component state
const [showFlash, setShowFlash] = useState(false)

const capturePhoto = async () => {
  // Trigger flash BEFORE async capture
  setShowFlash(true)
  setTimeout(() => setShowFlash(false), 150)
  
  const photoData = await capturePhotoFromVideo(videoRef.current)
  onAddPhoto(photoData)
}

// JSX
return (
  <div className="camera-view">
    <video ref={videoRef} autoPlay playsInline />
    {showFlash && <div className="camera-flash" />}
    {/* ... */}
  </div>
)
```

```css
.camera-flash {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #fff;
  animation: flash 150ms ease-out;
  pointer-events: none;  /* Don't block taps */
  z-index: 10;
}

@keyframes flash {
  0% { opacity: 0.9; }
  100% { opacity: 0; }
}
```

**Key Points**:
- **150ms duration**: Fast enough for rapid taps, slow enough to see
- **Non-blocking**: User can tap again immediately
- **High z-index**: Must appear above video but below UI controls

### Disabled State for Completion
Prevent navigation without photos:

```javascript
<button 
  className="photo-counter" 
  onClick={handleDone}
  disabled={photoCount === 0}
>
  {photoCount} photo{photoCount !== 1 ? 's' : ''}
</button>
```

```css
.photo-counter:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

---

## Mobile Image Editing

### Problem: CSS Filters Don't Work on Mobile
CSS filters (`filter: brightness(1.2)`) are buggy or unsupported on many mobile browsers.

### Solution: Pixel-Level Manipulation
```javascript
// filters/adjustments.js
export function applyPixelManipulation(imageData, brightness, contrast, saturation) {
  const data = imageData.data
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]
    // Alpha channel (data[i + 3]) unchanged
    
    // Apply brightness (0.0 - 2.0)
    r *= brightness
    g *= brightness
    b *= brightness
    
    // Apply contrast (-255 to +255)
    r = ((r - 128) * ((contrast + 255) / 255)) + 128 + contrast
    g = ((g - 128) * ((contrast + 255) / 255)) + 128 + contrast
    b = ((b - 128) * ((contrast + 255) / 255)) + 128 + contrast
    
    // Apply saturation
    const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b
    r = gray + (r - gray) * saturation
    g = gray + (g - gray) * saturation
    b = gray + (b - gray) * saturation
    
    // Clamp to valid range
    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }
  
  return imageData
}
```

### Filter Architecture
Separate each filter into its own module for maintainability:

```
src/filters/
  ├── index.js           # Export hub + applyFilterEffect()
  ├── adjustments.js     # Brightness, contrast, saturation
  ├── grayscale.js       # B&W filter
  ├── sepia.js          # Sepia tone
  ├── vintage.js        # Vintage effect
  ├── cool.js           # Cool color cast
  └── warm.js           # Warm color cast
```

Example filter:
```javascript
// filters/grayscale.js
export function applyGrayscale(imageData) {
  const data = imageData.data
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2]
    data[i] = data[i + 1] = data[i + 2] = gray
  }
  
  return imageData
}
```

### Edit Pipeline
```javascript
const applyEdits = useCallback(() => {
  const canvas = canvasRef.current
  const ctx = canvas.getContext('2d')
  const img = imageRef.current

  // 1. Draw original image
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)

  // 2. Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // 3. Apply adjustments
  applyPixelManipulation(imageData, brightness/100, contrast, saturation/100)

  // 4. Apply filter
  if (currentFilter !== 'none') {
    applyFilterEffect(imageData, currentFilter)
  }

  // 5. Render back to canvas
  ctx.putImageData(imageData, 0, 0)
}, [brightness, contrast, saturation, currentFilter])
```

---

## Touch-Friendly Crop Tool

### Challenge: Mobile Crop UX
- Scrolling interferes with drag gestures
- Small screens need fullscreen crop mode
- Touch events are passive by default

### Fullscreen Crop Mode
```javascript
// State
const [isCropping, setIsCropping] = useState(false)

// Dynamic class
<div className={`editor-view ${isCropping ? 'crop-mode' : ''}`}>
```

```css
.editor-view.crop-mode {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1000;
}

.editor-view.crop-mode .editor-canvas-container {
  padding: 10px 10px 100px;  /* Top/sides: minimal, bottom: room for controls */
}

.editor-view.crop-mode .editor-controls {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding: 5px;  /* Compact padding to maximize canvas space */
}
```

### Preventing Scroll During Crop
**Problem**: React's synthetic events are passive, `e.preventDefault()` doesn't work.

**Solution**: Direct event listener with `{ passive: false }`:

```javascript
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return

  const preventScroll = (e) => {
    if (isCropping && isDragging) {
      e.preventDefault()  // Now works!
    }
  }

  // Non-passive listener
  canvas.addEventListener('touchmove', preventScroll, { passive: false })
  
  return () => {
    canvas.removeEventListener('touchmove', preventScroll)
  }
}, [isCropping, isDragging])
```

Additionally:
```css
canvas {
  touch-action: none;  /* Disable browser gestures when cropping */
}
```

### Crop Utilities Module
Extract crop logic for reusability:

```javascript
// utils/cropUtils.js

export function calculateCropArea(start, end) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  }
}

export function getCanvasCoordinates(event, canvas) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  
  const clientX = event.touches ? event.touches[0].clientX : event.clientX
  const clientY = event.touches ? event.touches[0].clientY : event.clientY
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  }
}

export function applyCropToCanvas(canvas, cropArea) {
  return new Promise((resolve) => {
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = cropArea.width
    tempCanvas.height = cropArea.height
    
    const ctx = tempCanvas.getContext('2d')
    ctx.drawImage(
      canvas,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    )
    
    const img = new Image()
    img.onload = () => resolve(img)
    img.src = tempCanvas.toDataURL()
  })
}
```

### Interactive Resize Handles
Allow users to adjust crop boundaries after initial selection:

```javascript
// Add to component state
const [activeHandle, setActiveHandle] = useState(null)

// Detect handle clicks
const getClickedHandle = (coords, start, end, canvas) => {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const handleSize = 40 * scaleX // Large touch target
  const area = calculateCropArea(start, end)
  
  const handles = {
    topLeft: { x: area.x, y: area.y },
    topRight: { x: area.x + area.width, y: area.y },
    bottomLeft: { x: area.x, y: area.y + area.height },
    bottomRight: { x: area.x + area.width, y: area.y + area.height },
    top: { x: area.x + area.width / 2, y: area.y },
    right: { x: area.x + area.width, y: area.y + area.height / 2 },
    bottom: { x: area.x + area.width / 2, y: area.y + area.height },
    left: { x: area.x, y: area.y + area.height / 2 }
  }
  
  for (const [name, pos] of Object.entries(handles)) {
    const dx = Math.abs(coords.x - pos.x)
    const dy = Math.abs(coords.y - pos.y)
    if (dx < handleSize && dy < handleSize) return name
  }
  return null
}

// Update crop start handler
const handleCropStart = (e) => {
  if (!isCropping) return
  const coords = getCanvasCoordinates(e, canvasRef.current)
  
  // Check if clicking on existing handle
  if (cropStart && cropEnd) {
    const handle = getClickedHandle(coords, cropStart, cropEnd, canvasRef.current)
    if (handle) {
      setActiveHandle(handle)
      setIsDragging(true)
      return
    }
  }
  
  // Start new crop
  setCropStart(coords)
  setCropEnd(coords)
  setIsDragging(true)
  setActiveHandle(null)
}

// Adjust crop based on active handle
const adjustCropByHandle = (handle, coords, start, end, setStart, setEnd) => {
  switch (handle) {
    case 'topLeft':
      setStart({ x: coords.x, y: coords.y })
      break
    case 'topRight':
      setStart({ x: start.x, y: coords.y })
      setEnd({ x: coords.x, y: end.y })
      break
    case 'bottomLeft':
      setStart({ x: coords.x, y: start.y })
      setEnd({ x: end.x, y: coords.y })
      break
    case 'bottomRight':
      setEnd({ x: coords.x, y: coords.y })
      break
    case 'top':
      setStart({ x: start.x, y: coords.y })
      break
    case 'right':
      setEnd({ x: coords.x, y: end.y })
      break
    case 'bottom':
      setEnd({ x: end.x, y: coords.y })
      break
    case 'left':
      setStart({ x: coords.x, y: start.y })
      break
  }
}

// Update move handler
const handleCropMove = (e) => {
  if (!isCropping || !isDragging) return
  const coords = getCanvasCoordinates(e, canvasRef.current)
  
  if (activeHandle && cropStart && cropEnd) {
    adjustCropByHandle(activeHandle, coords, cropStart, cropEnd, setCropStart, setCropEnd)
  } else if (cropStart) {
    setCropEnd(coords)
  }
}
```

### Professional Crop Overlay
Enhanced visualization with handles and composition grid:

```javascript
export function drawCropOverlay(ctx, cropArea, canvasWidth, canvasHeight) {
  const { x, y, width, height } = cropArea
  
  // Darken outside crop area
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, canvasWidth, y)
  ctx.fillRect(0, y, x, height)
  ctx.fillRect(x + width, y, canvasWidth - (x + width), height)
  ctx.fillRect(0, y + height, canvasWidth, canvasHeight - (y + height))
  
  // Crop border
  ctx.strokeStyle = '#007aff'
  ctx.lineWidth = 3
  ctx.strokeRect(x, y, width, height)

  // Rule of thirds grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  
  // Vertical lines
  ctx.moveTo(x + width / 3, y)
  ctx.lineTo(x + width / 3, y + height)
  ctx.moveTo(x + (width * 2) / 3, y)
  ctx.lineTo(x + (width * 2) / 3, y + height)
  
  // Horizontal lines
  ctx.moveTo(x, y + height / 3)
  ctx.lineTo(x + width, y + height / 3)
  ctx.moveTo(x, y + (height * 2) / 3)
  ctx.lineTo(x + width, y + (height * 2) / 3)
  
  ctx.stroke()
  
  // Resize handles (8 total: 4 corners + 4 edges)
  const handleSize = 24
  const handleOffset = handleSize / 2
  
  const handles = [
    { x: x, y: y }, // top-left
    { x: x + width, y: y }, // top-right
    { x: x, y: y + height }, // bottom-left
    { x: x + width, y: y + height }, // bottom-right
    { x: x + width / 2, y: y }, // top
    { x: x + width, y: y + height / 2 }, // right
    { x: x + width / 2, y: y + height }, // bottom
    { x: x, y: y + height / 2 } // left
  ]
  
  // White border for visibility
  ctx.fillStyle = '#ffffff'
  handles.forEach(handle => {
    ctx.fillRect(
      handle.x - handleOffset - 2,
      handle.y - handleOffset - 2,
      handleSize + 4,
      handleSize + 4
    )
  })
  
  // Blue handle squares
  ctx.fillStyle = '#007aff'
  handles.forEach(handle => {
    ctx.fillRect(
      handle.x - handleOffset,
      handle.y - handleOffset,
      handleSize,
      handleSize
    )
  })
}
```

**Features:**
- **8 resize handles** - 4 corners + 4 edge midpoints
- **40px touch targets** - Larger hit detection for mobile
- **Rule of thirds grid** - Professional composition guide
- **Visual hierarchy** - White borders on handles for visibility
- **Smart interaction** - Tap handle to resize, tap elsewhere for new crop

### Simplified Crop UI
Hide all editing controls during crop:

```javascript
{!isCropping && (
  <>
    <div className="filter-buttons">{/* filters */}</div>
    <div className="adjustment-controls">{/* sliders */}</div>
  </>
)}
```

---

## Multi-Select Gallery

### Selection State Management
```javascript
const [isSelecting, setIsSelecting] = useState(false)
const [selectedPhotos, setSelectedPhotos] = useState(new Set())

const toggleSelection = (index) => {
  const newSelected = new Set(selectedPhotos)
  if (newSelected.has(index)) {
    newSelected.delete(index)
  } else {
    newSelected.add(index)
  }
  setSelectedPhotos(newSelected)
}

const selectAll = () => {
  const allIndices = new Set(photos.map((_, index) => index))
  setSelectedPhotos(allIndices)
}
```

**Why Set?** Fast O(1) lookup for selected state, unlike Array.includes() which is O(n).

### Dual-Mode UI
```javascript
<div className="gallery-header">
  {isSelecting ? (
    // Selection mode: Cancel | Count | Select All
    <>
      <button onClick={cancelSelection}>Cancel</button>
      <h2>{selectedPhotos.size} selected</h2>
      <button onClick={selectAll}>Select All</button>
    </>
  ) : (
    // Normal mode: Back | Title | Select | Upload
    <>
      <button onClick={onBack}>Back</button>
      <h2>Photos</h2>
      <div>
        <button onClick={() => setIsSelecting(true)}>Select</button>
        <button onClick={onUpload}>Upload</button>
      </div>
    </>
  )}
</div>
```

### Fixed Delete Toolbar (iOS Photos Pattern)
```javascript
{isSelecting && (
  <div className="selection-toolbar">
    <button 
      onClick={handleDeleteSelected}
      disabled={selectedPhotos.size === 0}
    >
      Delete ({selectedPhotos.size})
    </button>
  </div>
)}
```

```css
.selection-toolbar {
  position: fixed;  /* Stays visible while scrolling */
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px;
  background: #1c1c1e;
  border-top: 1px solid #2c2c2e;
}

.toolbar-delete-btn {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 12px 32px;
  background: #ff3b30;
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}
```

### Batch Deletion
**Critical**: Delete in reverse order to maintain indices:

```javascript
const handleDeleteSelected = () => {
  const count = selectedPhotos.size
  if (!window.confirm(`Delete ${count} photo${count > 1 ? 's' : ''}?`)) return
  
  // Sort indices descending
  const sortedIndices = Array.from(selectedPhotos).sort((a, b) => b - a)
  
  // Delete from highest index to lowest
  sortedIndices.forEach(index => onDeletePhoto(index))
  
  setSelectedPhotos(new Set())
  setIsSelecting(false)
}
```

### Visual Selection State
```javascript
<div 
  className={`photo-item ${selectedPhotos.has(index) ? 'selected' : ''}`}
  onClick={() => handlePhotoClick(index)}
>
  <img src={photo.url} />
  {isSelecting ? (
    <div className="selection-checkbox">
      {selectedPhotos.has(index) && '✓'}
    </div>
  ) : (
    <button className="delete-photo" onClick={(e) => handleDelete(index, e)}>
      ×
    </button>
  )}
</div>
```

```css
.photo-item.selected {
  outline: 3px solid #007aff;
  outline-offset: -3px;
}

.selection-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-item.selected .selection-checkbox {
  background: #007aff;
  border-color: #007aff;
}
```

---

## Code Organization

### Utility Module Pattern
Extract reusable functions into focused modules:

```
src/utils/
  ├── cameraUtils.js    # initCamera, stopCamera, capturePhotoFromVideo
  ├── cropUtils.js      # Crop geometry and rendering
  └── photoUtils.js     # Photo array management, URL lifecycle
```

**Benefits**:
- **Testability**: Pure functions easy to unit test
- **Reusability**: Import into multiple components
- **Clarity**: Components focus on UI, not business logic

Example:
```javascript
// utils/photoUtils.js
export function addPhoto(photos, photoData) {
  return [...photos, photoData]
}

export function deletePhoto(photos, index) {
  const photo = photos[index]
  if (photo?.url) {
    URL.revokeObjectURL(photo.url)  // Clean up memory
  }
  return photos.filter((_, i) => i !== index)
}

export function updatePhoto(photos, index, newPhotoData) {
  const oldPhoto = photos[index]
  if (oldPhoto?.url) {
    URL.revokeObjectURL(oldPhoto.url)
  }
  
  const updated = [...photos]
  updated[index] = newPhotoData
  return updated
}
```

### Filter Module Pattern
Each filter is self-contained:

```javascript
// filters/vintage.js
/**
 * Apply vintage effect (desaturated + sepia tint + vignette)
 * @param {ImageData} imageData - Canvas image data
 * @returns {ImageData} Modified image data
 */
export function applyVintage(imageData) {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const centerX = width / 2
  const centerY = height / 2
  const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2)
  
  for (let i = 0; i < data.length; i += 4) {
    // Sepia tone
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
    
    // Vignette (darkening at edges)
    const pixelIndex = i / 4
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
    const vignette = 1 - (dist / maxDist) * 0.5
    
    data[i] *= vignette
    data[i + 1] *= vignette
    data[i + 2] *= vignette
  }
  
  return imageData
}
```

Hub file aggregates all filters:
```javascript
// filters/index.js
import { applyGrayscale } from './grayscale.js'
import { applySepia } from './sepia.js'
// ... more imports

export function applyFilterEffect(imageData, filterName) {
  switch (filterName) {
    case 'grayscale': return applyGrayscale(imageData)
    case 'sepia': return applySepia(imageData)
    case 'vintage': return applyVintage(imageData)
    default: return imageData
  }
}

// Re-export for direct use
export { applyGrayscale, applySepia, applyVintage }
```

---

## Common Pitfalls

### 1. Memory Leaks from Blob URLs
**Problem**: `URL.createObjectURL()` creates permanent references.

**Solution**: Always revoke when done:
```javascript
useEffect(() => {
  return () => {
    photos.forEach(photo => {
      if (photo?.url) {
        URL.revokeObjectURL(photo.url)
      }
    })
  }
}, [])
```

### 2. Passive Touch Event Warning
**Problem**: `e.preventDefault()` in touchmove handler shows console warning.

**Solution**: Use direct listener with `{ passive: false }`:
```javascript
useEffect(() => {
  const handler = (e) => e.preventDefault()
  element.addEventListener('touchmove', handler, { passive: false })
  return () => element.removeEventListener('touchmove', handler)
}, [])
```

### 3. Canvas Coordinate Scaling
**Problem**: Canvas display size ≠ internal resolution.

**Solution**: Always scale coordinates:
```javascript
const rect = canvas.getBoundingClientRect()
const scaleX = canvas.width / rect.width
const scaleY = canvas.height / rect.height

const canvasX = (event.clientX - rect.left) * scaleX
const canvasY = (event.clientY - rect.top) * scaleY
```

### 4. Video Resolution Not Applied
**Problem**: Setting constraints doesn't guarantee specific resolution.

**Solution**: Check actual resolution after stream starts:
```javascript
const stream = await initCamera()
videoRef.current.srcObject = stream

videoRef.current.onloadedmetadata = () => {
  console.log('Actual resolution:', 
    videoRef.current.videoWidth, 
    videoRef.current.videoHeight
  )
}
```

### 5. Filter Performance on Large Images
**Problem**: 4K image = 8.3 million pixels to process.

**Solution**: 
- Show loading state during filter application
- Consider Web Workers for heavy filters
- Debounce slider changes:
```javascript
const debouncedBrightness = useMemo(
  () => debounce((val) => setBrightness(val), 100),
  []
)
```

### 6. iOS Safari Camera Permissions
**Problem**: Camera only works on HTTPS.

**Solution**: 
- Use `localhost` for development (allowed on HTTP)
- Use self-signed certificate for local network testing:
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [basicSsl()],
  server: { https: true, port: 8443 }
})
```

### 7. Gallery Deletion Index Shift
**Problem**: Deleting index 2, then 5 actually deletes wrong items.

**Solution**: Sort descending before batch delete:
```javascript
const sortedIndices = Array.from(selectedPhotos).sort((a, b) => b - a)
sortedIndices.forEach(index => deletePhoto(index))
```

---

## Integration Checklist

Adding rapid capture to your existing React camera app:

- [ ] **High-res camera**: Add `width/height: { ideal: 4096/2160 }` to getUserMedia
- [ ] **Flash feedback**: Add flash overlay state + 150ms animation
- [ ] **Photo counter**: Display count, make clickable to exit camera
- [ ] **Disabled state**: Prevent exit with zero photos
- [ ] **Pixel filters**: Replace CSS filters with ImageData manipulation
- [ ] **Crop fullscreen**: Add `crop-mode` class with fixed positioning
- [ ] **Prevent scroll**: Non-passive touchmove listener during crop
- [ ] **Multi-select**: Add selection state + Set-based tracking
- [ ] **Fixed toolbar**: Position delete button at bottom during selection
- [ ] **Batch delete**: Sort indices descending before deletion
- [ ] **Memory cleanup**: URL.revokeObjectURL in useEffect cleanup
- [ ] **Extract utilities**: Move camera/crop/photo logic to utils modules
- [ ] **Extract filters**: One file per filter in filters/ directory

---

## Performance Optimization Tips

1. **Debounce slider inputs** - Don't reprocess image on every pixel change
2. **Canvas pooling** - Reuse same canvas for multiple operations
3. **Lazy filter loading** - Only import filter modules when needed
4. **Thumbnail previews** - Generate small versions for gallery grid
5. **Virtual scrolling** - For galleries with 100+ photos
6. **Web Workers** - Offload heavy filter computation off main thread
7. **Progressive enhancement** - Detect device capabilities, adjust quality

---

## Browser Compatibility Notes

| Feature | Chrome/Edge | Safari iOS | Firefox | Notes |
|---------|-------------|------------|---------|-------|
| getUserMedia | ✅ | ✅ (HTTPS only) | ✅ | iOS requires HTTPS |
| Video resolution | ✅ 4K | ⚠️ ~1080p max | ✅ 4K | iOS limits web apps |
| Canvas filters | ✅ | ❌ Buggy | ✅ | Use pixel manipulation |
| Touch events | ✅ | ✅ | ✅ | Need `passive: false` |
| Blob URLs | ✅ | ✅ | ✅ | Remember to revoke |

---

## Additional Resources

- [MDN: MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [MDN: Touch events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Image Filters with Canvas](https://www.html5rocks.com/en/tutorials/canvas/imagefilters/)

---

## Contributing to This Guide

Found an issue or improvement? This guide is based on real implementation challenges. Contributions welcome via pull request.

**Built with**: React 18, Canvas API, MediaDevices API  
**License**: MIT  
**Last Updated**: December 2025

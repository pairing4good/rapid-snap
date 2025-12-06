/**
 * Calculate crop coordinates from start and end points
 * @param {Object} cropStart - Starting point {x, y}
 * @param {Object} cropEnd - Ending point {x, y}
 * @returns {Object} Crop area {x, y, width, height}
 */
export function calculateCropArea(cropStart, cropEnd) {
  const x = Math.min(cropStart.x, cropEnd.x)
  const y = Math.min(cropStart.y, cropEnd.y)
  const width = Math.abs(cropEnd.x - cropStart.x)
  const height = Math.abs(cropEnd.y - cropStart.y)
  
  return { x, y, width, height }
}

/**
 * Get mouse/touch coordinates relative to canvas
 * @param {Event} e - Mouse or touch event
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {Object} Scaled coordinates {x, y}
 */
export function getCanvasCoordinates(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const clientX = e.clientX || e.touches[0].clientX
  const clientY = e.clientY || e.touches[0].clientY
  const x = (clientX - rect.left) * scaleX
  const y = (clientY - rect.top) * scaleY
  
  return { x, y }
}

/**
 * Draw crop overlay on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} cropArea - Crop area {x, y, width, height}
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 */
export function drawCropOverlay(ctx, cropArea, canvasWidth, canvasHeight) {
  const { x, y, width, height } = cropArea
  
  // Darken outside of crop area
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, canvasWidth, y)
  ctx.fillRect(0, y, x, height)
  ctx.fillRect(x + width, y, canvasWidth - (x + width), height)
  ctx.fillRect(0, y + height, canvasWidth, canvasHeight - (y + height))
  
  // Draw crop rectangle border
  ctx.strokeStyle = '#007aff'
  ctx.lineWidth = 3
  ctx.strokeRect(x, y, width, height)

  // Draw grid lines (rule of thirds)
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
  
  // Draw resize handles
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
  
  // Draw white border for visibility
  ctx.fillStyle = '#ffffff'
  handles.forEach(handle => {
    ctx.fillRect(
      handle.x - handleOffset - 2,
      handle.y - handleOffset - 2,
      handleSize + 4,
      handleSize + 4
    )
  })
  
  // Draw blue handle squares
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

/**
 * Validate crop area dimensions
 * @param {Object} cropArea - Crop area {x, y, width, height}
 * @param {number} minSize - Minimum width/height (default: 10)
 * @returns {boolean} True if crop area is valid
 */
export function isValidCropArea(cropArea, minSize = 10) {
  return cropArea.width >= minSize && cropArea.height >= minSize
}

/**
 * Apply crop to canvas and return cropped image
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} cropArea - Crop area {x, y, width, height}
 * @returns {Promise<Image>} Promise resolving to cropped image
 */
export function applyCropToCanvas(canvas, cropArea) {
  return new Promise((resolve, reject) => {
    const { x, y, width, height } = cropArea
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(x, y, width, height)

    canvas.width = width
    canvas.height = height
    ctx.putImageData(imageData, 0, 0)

    const croppedImg = new Image()
    croppedImg.onload = () => resolve(croppedImg)
    croppedImg.onerror = reject
    croppedImg.src = canvas.toDataURL()
  })
}

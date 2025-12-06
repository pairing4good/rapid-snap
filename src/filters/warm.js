/**
 * Apply warm filter to image data (orange/red tint)
 * @param {ImageData} imageData - Canvas image data to modify
 * @returns {ImageData} Modified image data
 */
export function applyWarm(imageData) {
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    data[i] = Math.min(255, r * 1.2)
    data[i + 1] = Math.min(255, g * 1.1)
    data[i + 2] = Math.min(255, b * 0.8)
  }

  return imageData
}

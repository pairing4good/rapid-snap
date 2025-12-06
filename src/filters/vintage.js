/**
 * Apply vintage filter to image data (soft sepia blend)
 * @param {ImageData} imageData - Canvas image data to modify
 * @returns {ImageData} Modified image data
 */
export function applyVintage(imageData) {
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    const sepiaR = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
    const sepiaG = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
    const sepiaB = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
    
    data[i] = sepiaR * 0.5 + r * 0.5
    data[i + 1] = sepiaG * 0.5 + g * 0.5
    data[i + 2] = sepiaB * 0.5 + b * 0.5
  }

  return imageData
}

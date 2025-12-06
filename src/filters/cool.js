/**
 * Apply cool filter to image data (blue tint)
 * @param {ImageData} imageData - Canvas image data to modify
 * @returns {ImageData} Modified image data
 */
export function applyCool(imageData) {
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const b = data[i + 2]
    
    data[i] = Math.min(255, r * 0.5 + b * 0.5)
    data[i + 2] = Math.min(255, b * 1.2)
  }

  return imageData
}

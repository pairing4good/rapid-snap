/**
 * Apply grayscale filter to image data
 * @param {ImageData} imageData - Canvas image data to modify
 * @returns {ImageData} Modified image data
 */
export function applyGrayscale(imageData) {
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    const gray = 0.299 * r + 0.587 * g + 0.114 * b
    data[i] = data[i + 1] = data[i + 2] = gray
  }

  return imageData
}

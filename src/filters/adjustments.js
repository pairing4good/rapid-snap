/**
 * Apply brightness, contrast, and saturation adjustments to image data
 * @param {ImageData} imageData - Canvas image data to modify
 * @param {number} brightnessVal - Brightness multiplier (1.0 = normal)
 * @param {number} contrastVal - Contrast adjustment (-255 to 255)
 * @param {number} saturationVal - Saturation multiplier (1.0 = normal)
 * @returns {ImageData} Modified image data
 */
export function applyPixelManipulation(imageData, brightnessVal, contrastVal, saturationVal) {
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

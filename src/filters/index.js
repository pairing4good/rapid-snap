import { applyGrayscale } from './grayscale.js'
import { applySepia } from './sepia.js'
import { applyVintage } from './vintage.js'
import { applyCool } from './cool.js'
import { applyWarm } from './warm.js'

export { applyPixelManipulation } from './adjustments.js'
export { applyGrayscale } from './grayscale.js'
export { applySepia } from './sepia.js'
export { applyVintage } from './vintage.js'
export { applyCool } from './cool.js'
export { applyWarm } from './warm.js'

/**
 * Apply a named filter effect to image data
 * @param {ImageData} imageData - Canvas image data to modify
 * @param {string} filterName - Name of the filter to apply
 * @returns {ImageData} Modified image data
 */
export function applyFilterEffect(imageData, filterName) {
  switch (filterName) {
    case 'grayscale':
      return applyGrayscale(imageData)
    case 'sepia':
      return applySepia(imageData)
    case 'vintage':
      return applyVintage(imageData)
    case 'cool':
      return applyCool(imageData)
    case 'warm':
      return applyWarm(imageData)
    default:
      return imageData
  }
}

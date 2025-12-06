/**
 * Add a photo to the photos array
 * @param {Array} photos - Current photos array
 * @param {Object} photoData - Photo data to add
 * @returns {Array} Updated photos array
 */
export function addPhoto(photos, photoData) {
  return [...photos, photoData]
}

/**
 * Delete a photo at specified index and revoke its URL
 * @param {Array} photos - Current photos array
 * @param {number} index - Index of photo to delete
 * @returns {Array} Updated photos array
 */
export function deletePhoto(photos, index) {
  const newPhotos = [...photos]
  URL.revokeObjectURL(newPhotos[index].url)
  newPhotos.splice(index, 1)
  return newPhotos
}

/**
 * Update a photo at specified index and revoke old URL
 * @param {Array} photos - Current photos array
 * @param {number} index - Index of photo to update
 * @param {Object} photoData - New photo data
 * @returns {Array} Updated photos array
 */
export function updatePhoto(photos, index, photoData) {
  const newPhotos = [...photos]
  URL.revokeObjectURL(newPhotos[index].url)
  newPhotos[index] = photoData
  return newPhotos
}

/**
 * Revoke all photo URLs to free memory
 * @param {Array} photos - Photos array
 */
export function revokeAllPhotoUrls(photos) {
  photos.forEach(photo => {
    if (photo.url) {
      URL.revokeObjectURL(photo.url)
    }
  })
}

/**
 * Create FormData from photos array for upload
 * @param {Array} photos - Photos array
 * @param {string} fieldNamePrefix - Prefix for form field names
 * @returns {FormData} FormData object ready for upload
 */
export function createPhotoFormData(photos, fieldNamePrefix = 'photo') {
  const formData = new FormData()
  photos.forEach((photo, index) => {
    formData.append(`${fieldNamePrefix}${index}`, photo.blob, `${fieldNamePrefix}${index}.jpg`)
  })
  return formData
}

/**
 * Initialize camera with specified constraints
 * @param {Object} constraints - MediaStream constraints
 * @returns {Promise<MediaStream>} Camera stream
 */
export async function initCamera(constraints = {}) {
  const defaultConstraints = {
    video: { 
      facingMode: 'environment',
      width: { ideal: 4096 },
      height: { ideal: 2160 }
    },
    audio: false,
    ...constraints
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints)
    return stream
  } catch (error) {
    console.error('Error accessing camera:', error)
    throw new Error('Camera access denied. Please allow camera access to use this app.')
  }
}

/**
 * Stop all tracks in a media stream
 * @param {MediaStream} stream - Media stream to stop
 */
export function stopCamera(stream) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
}

/**
 * Capture photo from video element
 * @param {HTMLVideoElement} videoElement - Video element to capture from
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Object>} Photo data {url, blob}
 */
export function capturePhotoFromVideo(videoElement, quality = 0.98) {
  return new Promise((resolve, reject) => {
    if (!videoElement) {
      reject(new Error('Video element not available'))
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth
    canvas.height = videoElement.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoElement, 0, 0)

    canvas.toBlob(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        resolve({ url, blob, edited: false })
      } else {
        reject(new Error('Failed to capture photo'))
      }
    }, 'image/jpeg', quality)
  })
}

/**
 * Check if camera is available
 * @returns {boolean} True if camera API is available
 */
export function isCameraAvailable() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

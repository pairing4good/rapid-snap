import { useState } from 'react'
import './GalleryView.css'

function GalleryView({ photos, onBack, onEditPhoto, onDeletePhoto, onUpload }) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState(new Set())

  const handleDelete = (index, e) => {
    e.stopPropagation()
    if (window.confirm('Delete this photo?')) {
      onDeletePhoto(index)
    }
  }

  const toggleSelection = (index) => {
    const newSelected = new Set(selectedPhotos)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedPhotos(newSelected)
  }

  const handlePhotoClick = (index) => {
    if (isSelecting) {
      toggleSelection(index)
    } else {
      onEditPhoto(index)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedPhotos.size === 0) return
    
    const count = selectedPhotos.size
    if (window.confirm(`Delete ${count} photo${count > 1 ? 's' : ''}?`)) {
      // Delete in reverse order to maintain correct indices
      const sortedIndices = Array.from(selectedPhotos).sort((a, b) => b - a)
      sortedIndices.forEach(index => onDeletePhoto(index))
      setSelectedPhotos(new Set())
      setIsSelecting(false)
    }
  }

  const cancelSelection = () => {
    setSelectedPhotos(new Set())
    setIsSelecting(false)
  }

  const selectAll = () => {
    const allIndices = new Set(photos.map((_, index) => index))
    setSelectedPhotos(allIndices)
  }

  return (
    <div className="gallery-view">
      <div className="gallery-header">
        {isSelecting ? (
          <>
            <button className="back-btn" onClick={cancelSelection}>Cancel</button>
            <h2>{selectedPhotos.size} selected</h2>
            <button className="select-all-btn" onClick={selectAll}>
              Select All
            </button>
          </>
        ) : (
          <>
            <button className="back-btn" onClick={onBack}>Back</button>
            <h2>Photos</h2>
            <div className="header-actions">
              <button className="select-btn" onClick={() => setIsSelecting(true)}>Select</button>
              <button className="upload-btn" onClick={onUpload}>Upload</button>
            </div>
          </>
        )}
      </div>
      {isSelecting && (
        <div className="selection-toolbar">
          <button 
            className="toolbar-delete-btn" 
            onClick={handleDeleteSelected}
            disabled={selectedPhotos.size === 0}
          >
            Delete ({selectedPhotos.size})
          </button>
        </div>
      )}
      <div className="gallery-grid">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className={`photo-item ${selectedPhotos.has(index) ? 'selected' : ''}`}
            onClick={() => handlePhotoClick(index)}
          >
            <img src={photo.url} alt={`Photo ${index + 1}`} />
            {isSelecting ? (
              <div className="selection-checkbox">
                {selectedPhotos.has(index) && '✓'}
              </div>
            ) : (
              <button 
                className="delete-photo"
                onClick={(e) => handleDelete(index, e)}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default GalleryView

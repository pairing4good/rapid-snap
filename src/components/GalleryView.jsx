import './GalleryView.css'

function GalleryView({ photos, onBack, onEditPhoto, onDeletePhoto, onUpload }) {
  const handleDelete = (index, e) => {
    e.stopPropagation()
    if (window.confirm('Delete this photo?')) {
      onDeletePhoto(index)
    }
  }

  return (
    <div className="gallery-view">
      <div className="gallery-header">
        <button className="back-btn" onClick={onBack}>Back</button>
        <h2>Photos</h2>
        <button className="upload-btn" onClick={onUpload}>Upload</button>
      </div>
      <div className="gallery-grid">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="photo-item"
            onClick={() => onEditPhoto(index)}
          >
            <img src={photo.url} alt={`Photo ${index + 1}`} />
            <button 
              className="delete-photo"
              onClick={(e) => handleDelete(index, e)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GalleryView

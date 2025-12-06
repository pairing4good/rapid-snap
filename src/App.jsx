import { useState } from 'react'
import CameraView from './components/CameraView'
import GalleryView from './components/GalleryView'
import EditorView from './components/EditorView'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('camera') // 'camera', 'gallery', 'editor'
  const [photos, setPhotos] = useState([])
  const [currentEditIndex, setCurrentEditIndex] = useState(-1)

  const handleAddPhoto = (photoData) => {
    setPhotos(prev => [...prev, photoData])
  }

  const handleDeletePhoto = (index) => {
    setPhotos(prev => {
      const newPhotos = [...prev]
      URL.revokeObjectURL(newPhotos[index].url)
      newPhotos.splice(index, 1)
      return newPhotos
    })
  }

  const handleUpdatePhoto = (index, photoData) => {
    setPhotos(prev => {
      const newPhotos = [...prev]
      URL.revokeObjectURL(newPhotos[index].url)
      newPhotos[index] = photoData
      return newPhotos
    })
  }

  const handleEditPhoto = (index) => {
    setCurrentEditIndex(index)
    setCurrentView('editor')
  }

  const handleUpload = () => {
    // Implement your upload logic here
    console.log('Photos ready for upload:', photos)
    alert(`${photos.length} photo${photos.length !== 1 ? 's' : ''} ready for upload!`)
  }

  return (
    <div className="app-container">
      {currentView === 'camera' && (
        <CameraView
          photoCount={photos.length}
          onAddPhoto={handleAddPhoto}
          onDone={() => setCurrentView('gallery')}
        />
      )}
      
      {currentView === 'gallery' && (
        <GalleryView
          photos={photos}
          onBack={() => setCurrentView('camera')}
          onEditPhoto={handleEditPhoto}
          onDeletePhoto={handleDeletePhoto}
          onUpload={handleUpload}
        />
      )}
      
      {currentView === 'editor' && (
        <EditorView
          photo={photos[currentEditIndex]}
          onSave={(photoData) => {
            handleUpdatePhoto(currentEditIndex, photoData)
            setCurrentView('gallery')
          }}
          onCancel={() => setCurrentView('gallery')}
        />
      )}
    </div>
  )
}

export default App

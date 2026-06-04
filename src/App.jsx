import { useRef, useState } from 'react'
import { useSelections } from './hooks/useSelections.js'
import BathroomScene from './components/BathroomScene.jsx'
import { SelectionPanel } from './components/SelectionPanel.jsx'
import { ExportModal } from './components/ExportModal.jsx'
import './index.css'

export default function App() {
  const { selections, update } = useSelections()
  const [recenterKey, setRecenterKey]     = useState(0)
  const [showRoomWalls, setShowRoomWalls] = useState(true)
  const [panelReady, setPanelReady]       = useState(() => !!sessionStorage.getItem('elite-intro-played'))
  const [showExport, setShowExport]       = useState(false)
  const [screenshotUrl, setScreenshotUrl] = useState(null)
  const glRef = useRef(null)

  const handleExport = (dataUrl) => {
    setScreenshotUrl(dataUrl)
    setShowExport(true)
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <BathroomScene
        selections={selections}
        recenterKey={recenterKey}
        showRoomWalls={showRoomWalls}
        onPanelReady={() => setPanelReady(true)}
        onExport={handleExport}
        glRef={glRef}
      />
      <SelectionPanel
        selections={selections}
        onUpdate={update}
        panelReady={panelReady}
      />
      {showExport && (
        <ExportModal
          selections={selections}
          screenshotUrl={screenshotUrl}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}

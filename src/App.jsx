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

  const [exportHovered, setExportHovered] = useState(false)

  const handleExport = () => {
    setRecenterKey(k => k + 1)
    setTimeout(() => {
      const dataUrl = glRef.current?.domElement.toDataURL('image/jpeg', 0.92)
      if (dataUrl) {
        setScreenshotUrl(dataUrl)
        setShowExport(true)
      }
    }, 150)
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <BathroomScene
        selections={selections}
        recenterKey={recenterKey}
        showRoomWalls={showRoomWalls}
        onPanelReady={() => setPanelReady(true)}
        glRef={glRef}
      />

      <button
        onClick={handleExport}
        onMouseEnter={() => setExportHovered(true)}
        onMouseLeave={() => setExportHovered(false)}
        title="Export design"
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 101,
          width: 28, height: 28, borderRadius: '50%', border: 'none',
          background: exportHovered ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)',
          color: exportHovered ? '#ffffff' : 'rgba(255,255,255,0.55)',
          transform: exportHovered ? 'scale(1.12)' : 'scale(1)',
          cursor: 'pointer', lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.1s ease, color 0.1s ease, transform 0.1s ease',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      </button>

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

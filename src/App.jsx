import { useState } from 'react'
import { useSelections } from './hooks/useSelections.js'
import BathroomScene from './components/BathroomScene.jsx'
import { SelectionPanel } from './components/SelectionPanel.jsx'
import './index.css'

export default function App() {
  const { selections, update } = useSelections()
  const [recenterKey, setRecenterKey]     = useState(0)
  const [showRoomWalls, setShowRoomWalls] = useState(true)
  const [panelReady, setPanelReady]       = useState(() => !!sessionStorage.getItem('elite-intro-played'))

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <BathroomScene
        selections={selections}
        recenterKey={recenterKey}
        showRoomWalls={showRoomWalls}
        onPanelReady={() => setPanelReady(true)}
      />
      <SelectionPanel
        selections={selections}
        onUpdate={update}
        panelReady={panelReady}
      />
    </div>
  )
}

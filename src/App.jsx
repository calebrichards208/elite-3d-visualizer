import { useState } from 'react'
import { useSelections } from './hooks/useSelections.js'
import BathroomScene from './components/BathroomScene.jsx'
import { SelectionPanel } from './components/SelectionPanel.jsx'
import './index.css'

export default function App() {
  const { selections, update } = useSelections()
  const [recenterKey, setRecenterKey]     = useState(0)
  const [showRoomWalls, setShowRoomWalls] = useState(true)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <BathroomScene
        selections={selections}
        recenterKey={recenterKey}
        showRoomWalls={showRoomWalls}
      />
      <SelectionPanel
        selections={selections}
        onUpdate={update}
      />
    </div>
  )
}

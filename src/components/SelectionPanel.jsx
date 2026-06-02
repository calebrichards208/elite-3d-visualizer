import { useState } from 'react'
import manifest from '../data/products-manifest.json'

export function SelectionPanel({ selections, onUpdate }) {
  const [mainTab, setMainTab] = useState('base')
  const [activeTab, setActiveTab] = useState('base')

  const category = manifest.categories[activeTab]
  if (!category) return null

  const options = category.options || []
  const selected = selections[activeTab] || manifest.defaults[activeTab]

  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, bottom: 0, width: '25%',
      background: '#1a1a1a', borderLeft: '1px solid #333',
      display: 'flex', flexDirection: 'column', padding: '16px',
      fontFamily: 'system-ui', color: '#eee', fontSize: '13px', overflowY: 'auto'
    }}>
      <h2 style={{ margin: '0 0 20px', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {category.label}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', flexGrow: 1 }}>
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onUpdate(activeTab, opt.id)}
            style={{
              padding: '10px', borderRadius: '6px', border: selected === opt.id ? '2px solid #c9a25a' : '1px solid #444',
              background: selected === opt.id ? 'rgba(201,162,90,0.1)' : '#222',
              color: '#eee', cursor: 'pointer', fontSize: '11px', textAlign: 'center', transition: 'all 0.2s'
            }}>
            {opt.thumbnail && <img src={opt.thumbnail} alt={opt.label} style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '4px', marginBottom: '6px' }} />}
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderTop: '1px solid #333', paddingTop: '12px' }}>
        {Object.keys(manifest.categories).map(catKey => (
          <button
            key={catKey}
            onClick={() => setActiveTab(catKey)}
            style={{
              padding: '6px 12px', borderRadius: '4px', border: 'none',
              background: activeTab === catKey ? '#c9a25a' : '#333',
              color: activeTab === catKey ? '#000' : '#aaa', cursor: 'pointer', fontSize: '10px', fontWeight: 500
            }}>
            {manifest.categories[catKey].label}
          </button>
        ))}
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import manifest from '../data/products-manifest.json'

const MAIN_TABS = [
  { key: 'bath',     label: 'Bath Area', enabled: true  },
  { key: 'vanity',   label: 'Vanity',    enabled: false },
  { key: 'flooring', label: 'Flooring',  enabled: false },
  { key: 'toilet',   label: 'Toilet',    enabled: false },
]

const SUB_TABS = [
  { key: 'walls',      label: 'Shower Walls', catKey: 'walls' },
  { key: 'base',       label: 'Base Type',     catKey: 'base' },
  { key: 'trim',       label: 'Fixture Color', catKey: 'trim' },
  { key: 'showerHead', label: 'Shower Head',   catKey: 'showerHead' },
  { key: 'enclosure',  label: 'Enclosure',     catKey: 'enclosure' },
  { key: 'seat',       label: 'Seat',          catKey: 'seat' },
  { key: 'grabBar',    label: 'Grab Bars',     catKey: 'grabBar' },
  { key: 'shelf',      label: 'Shelf',         catKey: 'shelf' },
]

export function SelectionPanel({ selections, onUpdate }) {
  const [activeTab, setActiveTab] = useState('walls')
  const [minimized, setMinimized] = useState(false)
  const subScrollRef = useRef(null)
  const activeTabRef = useRef(null)

  const mobile = window.innerWidth <= 768

  useEffect(() => {
    if (!minimized && activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' })
    }
  }, [minimized])

  const currentSub = SUB_TABS.find(t => t.key === activeTab)
  const category   = manifest.categories[currentSub?.catKey]
  const options    = category?.options ?? []
  const currentVal = selections[activeTab] ?? manifest.defaults[activeTab]

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: 48,
    flexShrink: 0,
    cursor: 'pointer',
    borderBottom: minimized ? 'none' : '1px solid #f0f0f0',
  }

  const labelStyle = {
    fontSize: '13px', fontWeight: 600, color: '#111', letterSpacing: '-0.01em',
  }

  const chevronStyle = {
    fontSize: '18px', color: '#999', lineHeight: 1, userSelect: 'none',
  }

  // Minimized: slim bar matching the header exactly
  if (minimized) {
    return (
      <div style={{
        position: 'fixed',
        ...(mobile
          ? { bottom: 16, left: 16, right: 16, width: 'auto' }
          : { bottom: 0, right: 0, width: 380, borderRadius: '18px 0 0 0' }),
        height: 48,
        background: '#ffffff',
        ...(mobile ? { borderRadius: 14 } : {}),
        boxShadow: mobile ? '0 8px 48px rgba(0,0,0,0.18)' : '-4px 0 24px rgba(0,0,0,0.10)',
        fontFamily: "'Inter', 'SF Pro Text', system-ui, sans-serif",
        userSelect: 'none',
      }}>
        <div style={headerStyle} onClick={() => setMinimized(false)}>
          <span style={labelStyle}>Design Options</span>
          <span style={chevronStyle}>⌃</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      ...(mobile
        ? { bottom: 0, left: 0, right: 0, height: '52vh', borderRadius: '18px 18px 0 0' }
        : { bottom: 0, right: 0, width: 380, height: '100vh', borderRadius: '18px 0 0 0' }),
      background: '#ffffff',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Inter', 'SF Pro Text', system-ui, sans-serif",
      userSelect: 'none',
    }}>

      {/* ── Header: matches minimized bar ── */}
      <div style={headerStyle} onClick={() => setMinimized(true)}>
        <span style={labelStyle}>Design Options</span>
        <span style={chevronStyle}>⌄</span>
      </div>

      {/* ── Main area tabs ── */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #f0f0f0',
        background: '#fff',
        flexShrink: 0,
      }}>
        {MAIN_TABS.map(tab => (
          <button
            key={tab.key}
            disabled={!tab.enabled}
            onClick={e => e.stopPropagation()}
            style={{
              flex: 1,
              padding: '12px 6px 10px',
              border: 'none',
              background: 'none',
              fontSize: '13px',
              fontWeight: tab.enabled ? 700 : 500,
              color: tab.enabled ? '#111' : '#bbb',
              cursor: tab.enabled ? 'pointer' : 'default',
              borderBottom: tab.enabled ? '2px solid #111' : '2px solid transparent',
              marginBottom: -1,
              letterSpacing: '-0.01em',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Sub-tabs ── */}
      <div style={{ padding: '10px 16px 0', background: '#fff', flexShrink: 0 }}>
        <div style={{
          fontSize: '10px', fontWeight: 700, color: '#999',
          letterSpacing: '0.1em', marginBottom: '8px',
        }}>
          BROWSE OPTIONS
        </div>
        <div
          ref={subScrollRef}
          style={{
            display: 'flex', gap: '6px',
            overflowX: 'auto', paddingBottom: '10px',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}
        >
          {SUB_TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                ref={active ? activeTabRef : null}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flexShrink: 0,
                  padding: '6px 13px',
                  borderRadius: 20,
                  border: active ? '1.5px solid #111' : '1.5px solid #e0e0e0',
                  background: active ? '#111' : '#fff',
                  color: active ? '#fff' : '#555',
                  fontSize: '12px',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Thumbnail grid ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95))',
          pointerEvents: 'none', zIndex: 1,
        }} />
      <div style={{
        height: '100%',
        overflowY: 'auto',
        padding: '4px 14px 14px',
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr 1fr 1fr' : '1fr 1fr',
        gap: mobile ? '6px' : '8px',
        alignContent: 'start',
        scrollbarWidth: 'thin',
        scrollbarColor: '#e0e0e0 transparent',
      }}>
        {options.map(opt => {
          const selected = currentVal === opt.id
          return (
            <button
              key={opt.id}
              onClick={() => onUpdate(activeTab, opt.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '8px 8px 10px',
                background: selected ? '#fdf8f0' : '#fafafa',
                border: selected ? '2px solid #c9a25a' : '1.5px solid #eee',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'border-color 0.12s, background 0.12s',
                textAlign: 'center',
              }}
            >
              {opt.thumbnail && (
                <img
                  src={opt.thumbnail}
                  alt={opt.label}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    objectFit: 'cover',
                    borderRadius: 7,
                    display: 'block',
                  }}
                />
              )}
              <span style={{
                fontSize: '11px',
                fontWeight: selected ? 600 : 500,
                color: selected ? '#c9a25a' : '#444',
                lineHeight: 1.3,
              }}>
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
      </div>
    </div>
  )
}

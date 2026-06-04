import { useState, useRef, useEffect, useTransition, useMemo, memo } from 'react'
import manifest from '../data/products-manifest.json'

const MAIN_TABS = [
  { key: 'bath',     label: 'Bath Area', enabled: true  },
  { key: 'vanity',   label: 'Vanity',    enabled: false },
  { key: 'flooring', label: 'Flooring',  enabled: false },
  { key: 'toilet',   label: 'Toilet',    enabled: false },
]

const SUB_TABS = [
  { key: 'walls',       label: 'Shower Walls', catKey: 'walls' },
  { key: 'wallPattern', label: 'Pattern',       catKey: 'wallPattern' },
  { key: 'base',        label: 'Base Type',     catKey: 'base' },
  { key: 'trim',       label: 'Fixture Color', catKey: 'trim' },
  { key: 'showerHead', label: 'Shower Head',   catKey: 'showerHead' },
  { key: 'enclosure',  label: 'Enclosure',     catKey: 'enclosure' },
  { key: 'seat',       label: 'Seat',          catKey: 'seat' },
  { key: 'grabBar',    label: 'Grab Bars',     catKey: 'grabBar' },
  { key: 'shelf',      label: 'Shelf',         catKey: 'shelf' },
]

const PANEL_HEIGHT_DESKTOP = '55vh'
const PANEL_HEIGHT_MOBILE  = '52vh'
const PANEL_WIDTH_DESKTOP  = 380

export const SelectionPanel = memo(function SelectionPanel({ selections, onUpdate }) {
  const [activeTab, setActiveTab] = useState('walls')
  const [minimized, setMinimized] = useState(false)
  const [, startTransition] = useTransition()
  const subScrollRef = useRef(null)
  const activeTabRef = useRef(null)
  const selectedOptRef = useRef(null)

  const mobile = useMemo(() => window.innerWidth <= 768, [])

  useEffect(() => {
    if (!minimized) {
      if (activeTabRef.current) {
        activeTabRef.current.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' })
      }
      if (selectedOptRef.current) {
        selectedOptRef.current.scrollIntoView({ behavior: 'instant', block: 'nearest' })
      }
    }
  }, [minimized])

  const currentSub = SUB_TABS.find(t => t.key === activeTab)
  const category   = manifest.categories[currentSub?.catKey]
  const options    = category?.options ?? []
  const currentVal = selections[activeTab] ?? manifest.defaults[activeTab]

  // ── Floating toggle button (always rendered) ──────────────────────────────
  const floatBtn = (
    <button
      onClick={() => startTransition(() => setMinimized(v => !v))}
      style={{
        position: 'fixed',
        ...(mobile
          ? { bottom: `calc(${minimized ? '16px + 48px' : PANEL_HEIGHT_MOBILE} + 12px)`, left: '50%', transform: `translateX(-50%) rotate(${minimized ? 180 : 0}deg)` }
          : { bottom: `calc(${minimized ? '0px + 48px' : PANEL_HEIGHT_DESKTOP} + 12px)`, right: `${PANEL_WIDTH_DESKTOP - 60}px`, transform: `rotate(${minimized ? 180 : 0}deg)` }),
        width: 40, height: 40,
        borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.9)',
        background: 'rgba(255,255,255,0.95)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        color: '#333',
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.3s ease, bottom 0.3s ease',
        zIndex: 200,
      }}
    >⌃</button>
  )

  if (minimized) {
    return (
      <>
        {floatBtn}
        <div style={{
          position: 'fixed',
          ...(mobile
            ? { bottom: 16, left: 16, right: 16 }
            : { bottom: 0, right: 0, width: PANEL_WIDTH_DESKTOP }),
          height: 48,
          background: '#fff',
          ...(mobile ? { borderRadius: 14 } : { borderRadius: '18px 0 0 0' }),
          boxShadow: mobile ? '0 8px 48px rgba(0,0,0,0.18)' : '-4px 0 24px rgba(0,0,0,0.10)',
          fontFamily: "'Inter', 'SF Pro Text', system-ui, sans-serif",
          userSelect: 'none',
          display: 'flex', alignItems: 'center',
          padding: '0 16px',
          cursor: 'pointer',
          zIndex: 100,
        }} onClick={() => startTransition(() => setMinimized(false))}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>
            Design Options
          </span>
        </div>
      </>
    )
  }

  return (
    <>
      {floatBtn}
      <div style={{
        position: 'fixed',
        ...(mobile
          ? { bottom: 0, left: 0, right: 0, height: PANEL_HEIGHT_MOBILE, borderRadius: '18px 18px 0 0' }
          : { bottom: 0, right: 0, width: PANEL_WIDTH_DESKTOP, height: PANEL_HEIGHT_DESKTOP, borderRadius: '18px 0 0 0' }),
        background: '#ffffff',
        boxShadow: mobile ? '0 -4px 24px rgba(0,0,0,0.10)' : '-4px 0 24px rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Inter', 'SF Pro Text', system-ui, sans-serif",
        userSelect: 'none',
        zIndex: 100,
      }}>

        {/* ── Main area tabs (folder style) ── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          background: '#f0ede8',
          padding: '10px 10px 0',
          gap: 4,
          flexShrink: 0,
        }}>
          {MAIN_TABS.filter(tab => tab.enabled).map(tab => {
            const active = tab.enabled && activeTab !== null
            const isActive = tab.key === 'bath'
            return (
              <button
                key={tab.key}
                disabled={!tab.enabled}
                style={{
                  padding: isActive ? '10px 18px 12px' : '8px 14px 10px',
                  border: 'none',
                  borderRadius: isActive ? '10px 10px 0 0' : '8px 8px 0 0',
                  background: isActive ? '#ffffff' : tab.enabled ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                  fontSize: isActive ? '15px' : '13px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#111' : tab.enabled ? '#666' : '#bbb',
                  cursor: tab.enabled ? 'pointer' : 'default',
                  letterSpacing: '-0.01em',
                  boxShadow: isActive ? '0 -2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.12s',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            )
          })}
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
                  ref={selected ? selectedOptRef : null}
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
    </>
  )
})

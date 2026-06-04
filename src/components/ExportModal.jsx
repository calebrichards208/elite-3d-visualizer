import { useEffect, useState } from 'react'
import manifest from '../data/products-manifest.json'

const SUMMARY_ROWS = [
  { key: 'base',       label: 'Base Type'    },
  { key: 'baseColor',  label: 'Base Color'   },
  { key: 'walls',      label: 'Walls'        },
  { key: 'trim',       label: 'Fixture Color' },
  { key: 'enclosure',  label: 'Enclosure'    },
  { key: 'showerHead', label: 'Shower Head'  },
  { key: 'grabBar',    label: 'Grab Bars'    },
  { key: 'seat',       label: 'Seat'         },
  { key: 'shelf',      label: 'Shelf'        },
]

function getLabel(key, value, selections) {
  if (key === 'baseColor' && value === 'match-walls') {
    const wallOpt = manifest.categories.walls?.options.find(o => o.id === selections.walls)
    return wallOpt ? `Match Walls (${wallOpt.label})` : 'Match Walls'
  }
  const cat = manifest.categories[key]
  return cat?.options.find(o => o.id === value)?.label ?? value
}

export function ExportModal({ selections, screenshotUrl, onClose }) {
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const rows = SUMMARY_ROWS.map(({ key, label }) => ({
    label,
    value: getLabel(key, selections[key] ?? manifest.defaults[key], selections),
  }))

  const summaryText = [
    'ELITE CONSTRUCTION + REMODELING',
    'Bath Design Summary',
    '',
    ...rows.map(r => `${r.label}: ${r.value}`),
  ].join('\n')

  const handleCopy = (type, text) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSaveImage = () => {
    if (!screenshotUrl) return
    const a = document.createElement('a')
    a.href = screenshotUrl
    a.download = `elite-bath-design-${Date.now()}.jpg`
    a.click()
  }

  const handleCopyLink = () => {
    const encoded = btoa(JSON.stringify(selections))
    const url = `${window.location.origin}${window.location.pathname}?d=${encoded}`
    handleCopy('link', url)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 400,
          maxHeight: '88vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}
      >
        <button onClick={onClose} className="export-close" style={{
          position: 'absolute', top: 10, right: 10,
          width: 26, height: 26, borderRadius: '50%', border: 'none',
          background: '#fff', color: '#e53e3e',
          boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
          fontSize: 13, fontWeight: 700, lineHeight: 1,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1,
        }}>✕</button>

        {screenshotUrl && (
          <img
            src={screenshotUrl}
            alt="Bath design"
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
          />
        )}

        <div style={{ padding: '14px 18px 4px', overflowY: 'auto', flex: 1 }}>
          <p style={{
            fontFamily: 'system-ui', fontSize: 10, fontWeight: 700,
            color: '#c9a25a', letterSpacing: '0.12em', marginBottom: 10,
          }}>
            ELITE CONSTRUCTION + REMODELING
          </p>
          {rows.map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '5px 0', borderBottom: '1px solid #f4f4f4',
            }}>
              <span style={{ fontSize: 12, color: '#999', fontFamily: 'system-ui' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111', fontFamily: 'system-ui', textAlign: 'right', marginLeft: 12 }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', gap: 6, padding: '12px 14px',
          borderTop: '1px solid #f0f0f0',
        }}>
          <button onClick={handleSaveImage} className="export-btn" style={btn('#1a1a1a')}>Save Image</button>
          <button onClick={() => handleCopy('summary', summaryText)} className="export-btn" style={btn(copied === 'summary' ? '#2a7a4a' : '#c9a25a')}>
            {copied === 'summary' ? 'Copied ✓' : 'Copy Summary'}
          </button>
          <button onClick={handleCopyLink} className="export-btn" style={btn(copied === 'link' ? '#2a7a4a' : '#666')}>
            {copied === 'link' ? 'Copied ✓' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

const btn = bg => ({
  flex: 1, padding: '9px 2px', borderRadius: 8, border: 'none',
  background: bg, color: '#fff', fontSize: 11, fontWeight: 600,
  fontFamily: 'system-ui', cursor: 'pointer',
  transition: 'background 0.15s', letterSpacing: '-0.01em',
})

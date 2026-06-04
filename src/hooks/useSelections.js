import { useState, useEffect, useCallback } from 'react'
import manifest from '../data/products-manifest.json'

const LS_KEY = 'elite-3d-selections'

export function useSelections() {
  const [selections, setSelections] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const encoded = params.get('d')
    if (encoded) {
      try { return { ...manifest.defaults, ...JSON.parse(atob(encoded)) } } catch {}
    }
    const stored = localStorage.getItem(LS_KEY)
    if (stored) {
      try { return { ...manifest.defaults, ...JSON.parse(stored) } } catch {}
    }
    return manifest.defaults
  })

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('d')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const update = useCallback((key, value) => {
    setSelections(prev => {
      let next = { ...prev, [key]: value }
      if (key === 'base' && value === 'tub' && ['bench', 'corner', 'fold-down'].includes(prev.seat)) {
        next = { ...next, seat: 'none' }
      }
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { selections, update }
}

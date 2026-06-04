import { useState, useEffect, useCallback } from 'react'
import manifest from '../data/products-manifest.json'

const LS_KEY = 'elite-3d-selections'

export function useSelections() {
  const [selections, setSelections] = useState(manifest.defaults)

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) {
      setSelections(JSON.parse(stored))
    }
  }, [])

  const update = useCallback((key, value) => {
    setSelections(prev => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { selections, update }
}

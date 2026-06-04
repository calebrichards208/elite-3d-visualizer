import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows, MeshReflectorMaterial } from '@react-three/drei'
import { loadBasisTexture } from '../utils/loadBasisTexture.js'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import manifest from '../data/products-manifest.json'

RectAreaLightUniformsLib.init()

// ─── Trim finish presets ──────────────────────────────────────────────────────

const TRIM_PROPS = {
  'chrome':             { color: '#d4d4d4', metalness: 1.0, roughness: 0.05 },
  'brushed-nickel':     { color: '#a8a8ae', metalness: 0.9, roughness: 0.30 },
  'matte-black':        { color: '#1a1a1a', metalness: 0.5, roughness: 0.80 },
  'oil-rubbed-bronze':  { color: '#3a1c0c', metalness: 0.6, roughness: 0.55 },
}

// ─── Hex fallback colors for solid wall options ───────────────────────────────
const WALL_HEX = {
  'white':           '#f8f7f5',
  'matte-white':     '#f5f5f3',
  'almond':          '#d6c8a8',
  'biscuit':         '#cebf9e',
  'linen':           '#e2d8c8',
  'gray':            '#9a9a9c',
  'sandbar':         '#c2b290',
  'arctic-ice':      '#b8bcc0',
  'canyon-rock':     '#b89470',
  'carbon-ash':      '#5a5a5a',
  'evo':             '#f0f0ee',
  'glacier-ice':     '#ddeef2',
  'horizon-beige':   '#d0c4a8',
  'metapeake':       '#c8ccc8',
  'napoli-marble':   '#c4bcb4',
  'santa-cruz':      '#c0a880',
  'santorini-white': '#f0ece8',
  'sierra-sand':     '#c8b080',
  'tuscany':         '#d4c0a0',
  'versailles':      '#dcd8d4',
  'white-travertine':'#f0ebe0',
}

// ─── Hardcoded wet-area positions (found via keyboard positioning tool) ───────
const SHOWER_WET_POS = [-1.683, 0.000, 1.344]
const TUB_WET_POS    = [-1.683, 0.000, 1.354]
const ACC_POS        = [-1.683, 0.000, 1.394]
const STD_DOOR_POS   = [-1.678, 0.000, 1.364]
const STD_GLASS_POS  = [-2.028, 1.200, -0.036]
const TUB_DOOR_POS   = [-1.998, 1.210, -0.096]
const TUB_PULL_POS   = [-1.978, 1.130, -0.096]
const DENALI_DOOR_POS = [-1.983, 1.250, -0.006]
const VALVE_POS         = [-1.883, 0.000, 1.444]
const STANDARD_HEAD_POS = [-1.883, 0.000, 1.444]
const RAIN_HEAD_POS     = [-1.883, 0.100, 1.444]
const HANDHELD_POS      = [-1.883, 0.250, 1.244]
const TUB_HEAD_POS      = [-1.883, 0.000, 1.444]
const SEAT_POS          = [-1.683, 0.000,  1.344]
const FOLD_DOWN_POS     = [-2.623, 0.400, -0.206]
const DRAIN_POS         = [-1.823, 0.000,  1.474]
const GRAB_BAR_VERT_POS   = [-2.233, -0.050, 1.544]
const GRAB_BAR_VERT_EULER = [0.50 * Math.PI, 0.33 * Math.PI, -0.50 * Math.PI]
const GRAB_BAR_DIAG_POS   = [-0.433, 1.100, 1.194]
const GRAB_BAR_DIAG_EULER = [0.50 * Math.PI, 0.00 * Math.PI, -1.00 * Math.PI]

// ─── Models to load ───────────────────────────────────────────────────────────

const STATIC_ENV_URLS = [
  '/models/elite_floor.glb',
  '/models/elite_baseboard.glb',
  '/models/vanity.glb',
  '/models/toilet.glb',
  '/models/mirror.glb',
  '/models/mirror_frame.glb',
]
const ROOM_WALL_URL = '/models/elite_walls.glb'

const PRELOAD_URLS = [
  ...STATIC_ENV_URLS,
  ROOM_WALL_URL,
  '/models/SHOWER-SURROUND-CENTER-ELITE.glb',
  '/models/SHOWER-SURROUND-SIDES-ELITE.glb',
  '/models/SHOWER-STANDARD.glb',
  '/models/TUB-CLASSIC.glb',
  '/models/SHOWER-VALVE.glb',
  '/models/LA-STANDARD-SHOWER-FIXTURE.glb',
  '/models/LA-RAIN-SHOWER-HEAD.glb',
  '/models/LA-HANDHELD_FIXTURE.glb',
  '/models/LA-TUB-SHOWER-FIXTURES.glb',
  '/models/LA-GRAB-BAR-24.glb',
  '/models/SHOWER-ROD-CURVED.glb',
  '/models/SHOWER-DOOR-STD.glb',
  '/models/SH-STD-GLASS.glb',
  '/models/TB-GE-ENCLOSURE.glb',
  '/models/TB-STD-GLASS.glb',
  '/models/SD-Horizontal_Ladder_Pulls.glb',
  '/models/SHOWER-DRAIN.glb',
  '/models/BENCH-SHOWER-SEAT.glb',
  '/models/MOEN_BENCH_2.glb',
  '/models/HEXAGONAL-CORNER-SEAT.glb',
  '/models/METAL-CORNER-SHELF_both.glb',
  '/models/NICHE-SHELF.glb',
]
PRELOAD_URLS.forEach(url => useGLTF.preload(url))

// ─── Env model ────────────────────────────────────────────────────────────────

function EnvModel({ url, visible = true }) {
  const { scene } = useGLTF(url)
  const { gl } = useThree()
  const cloned = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    try {
      window.__envScenes = window.__envScenes || {}
      window.__envScenes[url] = cloned
    } catch (e) {}

    // Apply materials to specific environment models
    if (url === '/models/elite_floor.glb') {
      cloned.traverse(child => {
        if (child.isMesh) {
          const mat = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.92,
            metalness: 0,
          })

          const textureLoader = new THREE.TextureLoader()
          const maxAniso = gl.capabilities.getMaxAnisotropy()

          // Load diffuse map
          textureLoader.load('/textures/laminate_floor/laminate_floor_02_diff_2k.jpg', tex => {
            tex.colorSpace = THREE.SRGBColorSpace
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping
            tex.repeat.set(2, 2)
            tex.anisotropy = maxAniso
            mat.map = tex
            mat.needsUpdate = true
          })

          // Load normal map
          textureLoader.load('/textures/laminate_floor/laminate_floor_02_nor_gl_2k.png', tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping
            tex.repeat.set(2, 2)
            tex.anisotropy = maxAniso
            mat.normalMap = tex
            mat.normalScale.set(1, 1)
            mat.needsUpdate = true
          })

          // Load roughness map
          textureLoader.load('/textures/laminate_floor/laminate_floor_02_rough_2k.png', tex => {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping
            tex.repeat.set(2, 2)
            tex.anisotropy = maxAniso
            mat.roughnessMap = tex
            mat.needsUpdate = true
          })

          child.material = mat
        }
      })
    } else if (url === '/models/elite_walls.glb') {
      cloned.traverse(child => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#f4f4f2',
            roughness: 0.85,
            metalness: 0,
          })
        }
      })
    } else if (url === '/models/elite_baseboard.glb') {
      cloned.traverse(child => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.4,
            metalness: 0,
          })
        }
      })
    } else if (url === '/models/toilet.glb') {
      cloned.traverse(child => {
        if (!child.isMesh) return
        const n = child.name.toLowerCase()
        if (n.includes('seat') || n.includes('lid')) {
          child.material = new THREE.MeshStandardMaterial({ color: '#f8f8f6', roughness: 0.35, metalness: 0 })
        } else {
          child.material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.12, metalness: 0.05 })
        }
      })
    } else if (url === '/models/mirror_frame.glb') {
      cloned.traverse(child => {
        if (!child.isMesh) return
        child.material = new THREE.MeshStandardMaterial({
          color: '#3d2b1a', roughness: 0.85, metalness: 0,
        })
      })
    } else if (url === '/models/mirror.glb') {
      // Keep frame visible as-is; MirrorReflector places the glass separately
    } else if (url === '/models/vanity.glb') {
      cloned.traverse(child => {
        if (!child.isMesh) return
        const n = child.name.toLowerCase()
        if (n.includes('basin') || n.includes('sink') || n.includes('bowl')) {
          child.material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.12, metalness: 0.05 })
        } else {
          child.material = new THREE.MeshStandardMaterial({ color: '#fcfcfc', roughness: 0.5, metalness: 0 })
        }
      })
    }
  }, [cloned, gl, url])

  return <primitive object={cloned} visible={visible} />
}

// ─── Mirror reflector ────────────────────────────────────────────────────────

// Position/size tuned to sit inside the mirror frame — adjust if needed
const MIRROR_POS  = [-3.970, 1.650, 1.450]
const MIRROR_SIZE = [1.20, 0.67]

function MirrorReflector({ position = MIRROR_POS }) {
  return (
    <mesh position={position} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={MIRROR_SIZE} />
      <MeshReflectorMaterial
        resolution={512}
        mirror={1}
        mixBlur={0}
        mixStrength={1}
        roughness={0}
        color="#c8ccd0"
      />
    </mesh>
  )
}

// ─── Wall panels ─────────────────────────────────────────────────────────────

function WallPanels({ wallId, wallPatternId }) {
  const { scene: centerGLB } = useGLTF('/models/SHOWER-SURROUND-CENTER-ELITE.glb')
  const { scene: sidesGLB }  = useGLTF('/models/SHOWER-SURROUND-SIDES-ELITE.glb')
  const { gl }               = useThree()

  const center = useMemo(() => centerGLB.clone(true), [centerGLB])
  const sides  = useMemo(() => sidesGLB.clone(true), [sidesGLB])

  const matRef = useRef(new THREE.MeshStandardMaterial({ roughness: 0.48, metalness: 0.02, side: THREE.DoubleSide }))


  // ── Wall color ────────────────────────────────────────────────────────────
  useEffect(() => {
    const maxAniso = gl.capabilities.getMaxAnisotropy()
    const mat = matRef.current
    let cancelled = false

    const colorOpt = manifest.categories.walls?.options.find(o => o.id === wallId)
      || manifest.categories.wallColor?.options.find(o => o.id === wallId)

    const applyMat = () => {
      if (cancelled) return
      ;[center, sides].forEach(scene =>
        scene.traverse(child => {
          if (!child.isMesh) return
          child.material = mat
          child.material.needsUpdate = true
        })
      )
    }

    async function update() {
      mat.map = null
      mat.color.set(WALL_HEX[wallId] ?? '#ece9e4')
      mat.needsUpdate = true
      applyMat()

      if (colorOpt?.basisTexture) {
        try {
          const tex = await loadBasisTexture(colorOpt.basisTexture, gl)
          if (cancelled) return
          tex.colorSpace = THREE.SRGBColorSpace
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping
          tex.anisotropy = maxAniso
          tex.repeat.set(colorOpt.solid ? 1 : 2, colorOpt.solid ? 1 : 2)
          tex.needsUpdate = true
          mat.map = tex
          mat.color.set('#ffffff')
          mat.needsUpdate = true
          applyMat()
        } catch (e) {
          console.warn('[WallPanels] color basis failed, using hex fallback:', e.message)
        }
      }
    }

    update()
    return () => { cancelled = true }
  }, [wallId, center, sides, gl])

  // ── Etch pattern (normalMap + emissiveMap on base material) ─────────────
  useEffect(() => {
    const mat = matRef.current
    let cancelled = false

    const clearEtch = () => {
      mat.normalMap = null
      mat.normalScale.set(0, 0)
      mat.emissiveMap = null
      mat.emissive.set('#000000')
      mat.emissiveIntensity = 0
      mat.roughnessMap = null
      mat.displacementMap = null
      mat.displacementScale = 0
      mat.displacementBias = 0
      mat.roughness = 0.38
      mat.needsUpdate = true
    }

    const patternOpt = manifest.categories.wallPattern?.options.find(o => o.id === wallPatternId)
    if (!patternOpt?.normalTexture) { clearEtch(); return }

    const [rx, ry] = patternOpt.etchRepeat ?? [4, 5.3]
    const etchRot = patternOpt.etchRotation ?? 0
    const [ox, oy] = patternOpt.etchOffset ?? [0, 0]
    const setupTex = (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(rx, ry)
      tex.rotation = etchRot
      tex.center.set(0.5, 0.5)
      tex.offset.set(ox, oy)
      tex.generateMipmaps = true
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.anisotropy = gl.capabilities.getMaxAnisotropy()
      tex.needsUpdate = true
      return tex
    }

    const getAdaptiveIntensity = () => {
      const hex = WALL_HEX[wallId] ?? '#888888'
      const c = new THREE.Color(hex)
      const luminance = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
      return THREE.MathUtils.lerp(0.45, 0.08, luminance)
    }

    const loadAlpha = patternOpt.alphaTexture
      ? patternOpt.alphaTexture.endsWith('.png')
        ? new Promise(res => new THREE.TextureLoader().load(patternOpt.alphaTexture, res))
        : loadBasisTexture(patternOpt.alphaTexture, gl)
      : Promise.resolve(null)

    Promise.all([loadBasisTexture(patternOpt.normalTexture, gl), loadAlpha])
      .then(([normalTex, alphaTex]) => {
        if (cancelled) return
        mat.roughnessMap = null
        if (alphaTex) {
          // Strategy A: alpha present — emissive white lines + displacement depth (no normalMap = no ghosting)
          mat.normalMap = null
          mat.normalScale.set(0, 0)
          mat.emissiveMap = setupTex(alphaTex)
          mat.emissive.set('#ffffff')
          mat.emissiveIntensity = getAdaptiveIntensity()
          mat.displacementMap = null
          mat.displacementScale = 0
          mat.roughness = 0.6
        } else {
          // Strategy B: normal only — same-color dimensional grooves
          mat.normalMap = setupTex(normalTex)
          mat.normalScale.set(1.2, -1.2)
          mat.emissiveMap = null
          mat.emissive.set('#000000')
          mat.emissiveIntensity = 0
          mat.displacementMap = null
          mat.displacementScale = 0
          mat.roughness = 0.38
        }
        mat.needsUpdate = true
      })
      .catch(e => console.warn('[WallPanels] etch load failed:', e.message))

    return () => { cancelled = true }
  }, [wallPatternId, wallId, gl])

  return (
    <group>
      <primitive object={center} />
      <primitive object={sides} />
    </group>
  )
}

// ─── Base (shower / tub) ──────────────────────────────────────────────────────

const BASE_COLOR_HEX = {
  'white':   '#f8f8f6',
  'almond':  '#d6c8a8',
  'biscuit': '#cebf9e',
  'gray':    '#9a9a9c',
  'sandbar': '#c2b290',
}

const VALID_BASE_COLORS = new Set([
  'white', 'almond', 'biscuit', 'linen', 'gray', 'sandbar',
  'arctic-ice', 'canyon-rock', 'carbon-ash', 'evo', 'glacier-ice',
  'metapeake', 'napoli-marble', 'sandalwood', 'santa-cruz',
  'santorini-white', 'sierra-sand', 'tuscany', 'versailles', 'white-travertine',
])

function BaseModel({ selection, baseColor, wallId }) {
  const { scene: shower } = useGLTF('/models/SHOWER-STANDARD.glb')
  const { scene: tub }    = useGLTF('/models/TUB-CLASSIC.glb')
  const { gl }            = useThree()

  useEffect(() => {
    const isSolid = baseColor !== 'match-walls'
    const effectiveId = isSolid ? baseColor : (VALID_BASE_COLORS.has(wallId) ? wallId : 'white')
    const mat = new THREE.MeshStandardMaterial({ roughness: isSolid ? 0.15 : 0.48, metalness: 0 })
    let cancelled = false

    const applyMat = () => {
      shower.traverse(child => { if (child.isMesh) child.material = mat })
    }

    if (isSolid) {
      mat.color.set(BASE_COLOR_HEX[effectiveId] ?? '#f8f8f6')
      applyMat()
    } else {
      const wallOpt = manifest.categories.walls?.options.find(o => o.id === effectiveId)
      mat.color.set(WALL_HEX[effectiveId] ?? '#f8f8f6')
      applyMat()

      if (wallOpt?.basisTexture) {
        loadBasisTexture(wallOpt.basisTexture, gl).then(tex => {
          if (cancelled) return
          tex.colorSpace = THREE.SRGBColorSpace
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping
          tex.repeat.set(wallOpt.solid ? 1 : 1.5, wallOpt.solid ? 1 : 1.5)
          tex.anisotropy = gl.capabilities.getMaxAnisotropy()
          tex.needsUpdate = true
          mat.map = tex
          mat.color.set('#ffffff')
          mat.needsUpdate = true
          applyMat()
        }).catch(() => {})
      }
    }

    const tubMat = new THREE.MeshStandardMaterial({
      color: BASE_COLOR_HEX[isSolid ? effectiveId : 'white'] ?? '#f8f8f6',
      roughness: 0.15, metalness: 0,
    })
    tub.traverse(child => { if (child.isMesh) child.material = tubMat })

    return () => { cancelled = true }
  }, [shower, tub, gl, baseColor, wallId])

  return (
    <>
      <primitive object={shower} visible={selection === 'shower'} />
      <primitive object={tub} visible={selection === 'tub'} />
    </>
  )
}

// ─── Glass panel model ────────────────────────────────────────────────────────

function GlassModel({ url, visible, rain = false }) {
  const { scene: glb } = useGLTF(url)
  const { gl } = useThree()
  const model = useMemo(() => glb.clone(true), [glb])

  const glassMat = useRef(new THREE.MeshStandardMaterial({
    color: '#ddeef5',
    transparent: true,
    side: THREE.DoubleSide,
    metalness: 0.05,
  }))

  useEffect(() => {
    const mat = glassMat.current
    model.traverse(child => {
      if (!child.isMesh) return
      child.material = mat
    })

    if (rain) {
      mat.roughness = 0.08
      mat.opacity   = 0.28
      mat.color.set('#c8d8e0')
      loadBasisTexture('/textures/basis/rain_normal.basis', gl).then(tex => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(1.5, 6)
        tex.needsUpdate = true
        mat.normalMap = tex
        mat.normalScale.set(2.5, 2.5)
        mat.needsUpdate = true
      }).catch(() => {})
    } else {
      mat.roughness = 0.04
      mat.opacity   = 0.18
      mat.color.set('#ddeef5')
      mat.normalMap = null
      mat.normalScale.set(0, 0)
      mat.needsUpdate = true
    }
  }, [model, rain])

  return <primitive object={model} visible={visible} />
}

// ─── Reusable trim-colored model ─────────────────────────────────────────────

function TrimColoredModel({ url, trimId, visible = true }) {
  const { scene: glb } = useGLTF(url)
  const model = useMemo(() => glb.clone(true), [glb])

  useEffect(() => {
    const props = TRIM_PROPS[trimId] ?? TRIM_PROPS['chrome']
    const color = new THREE.Color(props.color)
    model.traverse(child => {
      if (!child.isMesh) return
      child.material = child.material.clone()
      child.material.color.set(color)
      child.material.metalness = props.metalness
      child.material.roughness = props.roughness
      child.material.needsUpdate = true
    })
  }, [trimId, model])

  return <primitive object={model} visible={visible} />
}

function TrimModels({ trimId }) {
  return <TrimColoredModel url="/models/SHOWER-VALVE.glb" trimId={trimId} />
}

function OptionalModel({ url, visible }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} visible={visible} />
}

// ─── Seat models ──────────────────────────────────────────────────────────────

// Bench/corner seat GLBs contain two mirrored seats (one per side wall).
// Node positions are all 0,0,0 in these GLBs — must read geometry vertex centroids.
function LeftSeatModel({ url, visible }) {
  const { scene } = useGLTF(url)
  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.updateMatrixWorld(true)

    const infos = []
    clone.traverse(child => {
      if (child.isMesh && child.geometry?.attributes?.position) {
        const box = new THREE.Box3().setFromBufferAttribute(child.geometry.attributes.position)
        const center = box.getCenter(new THREE.Vector3()).applyMatrix4(child.matrixWorld)
        infos.push({ mesh: child, center })
      }
    })

    if (infos.length > 1) {
      const spread = axis => {
        const vals = infos.map(i => i.center[axis])
        return Math.max(...vals) - Math.min(...vals)
      }
      const axis = spread('z') >= spread('x') ? 'z' : 'x'
      const vals = infos.map(i => i.center[axis])
      const mid = (Math.max(...vals) + Math.min(...vals)) / 2
      infos.forEach(({ mesh, center }) => { if (center[axis] > mid) mesh.visible = false })
    }

    return clone
  }, [scene])
  return <primitive object={cloned} visible={visible} />
}

// Fold-down GLB has no embedded materials — apply teak basis texture.
function FoldDownSeat({ visible }) {
  const { scene } = useGLTF('/models/MOEN_BENCH_2.glb')
  const { gl } = useThree()
  const cloned = useMemo(() => scene.clone(true), [scene])

  useEffect(() => {
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.0 })
    loadBasisTexture('/textures/MOEN_TEAK_BENCH_Silver_Teak.basis', gl).then(tex => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      mat.map = tex
      mat.needsUpdate = true
      cloned.traverse(child => { if (child.isMesh) { child.material = mat } })
    })
  }, [cloned, gl])

  return <primitive object={cloned} visible={visible} />
}

// ─── Camera ───────────────────────────────────────────────────────────────────

const _camCtx = { camera: null, center: null }

function CameraRig({ recenterKey, showerCenter, skipIntro, onPanelReady }) {
  const { camera }  = useThree()
  const controlsRef = useRef()
  const [animating, setAnimating] = useState(!skipIntro)
  const targetRef     = useRef(null)
  const panelFiredRef = useRef(false)

  useEffect(() => {
    _camCtx.camera = camera
    _camCtx.center = showerCenter
  })

  useEffect(() => {
    if (!controlsRef.current) return
    const { x, y, z } = showerCenter
    const mobile = window.innerWidth <= 768
    const tx = x, ty = y + (mobile ? 0.7 : 1.0), tz = z + (mobile ? 4.4 : 3.0)
    targetRef.current = new THREE.Vector3(tx, ty, tz)
    controlsRef.current.target.set(x, y + (mobile ? 0.0 : 0.3), z)
    if (skipIntro) {
      camera.position.set(tx, ty, tz)
      controlsRef.current.update()
      controlsRef.current.saveState()
    } else {
      camera.position.set(tx, ty + 1.5, tz + 6)
      controlsRef.current.update()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, showerCenter])

  useFrame(() => {
    if (!animating || !targetRef.current) return
    camera.position.lerp(targetRef.current, 0.035)
    const dist = camera.position.distanceTo(targetRef.current)
    if (!panelFiredRef.current && dist < 3.5) {
      panelFiredRef.current = true
      onPanelReady?.()
    }
    if (dist < 0.08) {
      camera.position.copy(targetRef.current)
      setAnimating(false)
      sessionStorage.setItem('elite-intro-played', '1')
      controlsRef.current?.saveState()
    }
  })

  useEffect(() => {
    if (recenterKey === 0 || !controlsRef.current) return
    controlsRef.current.reset()
  }, [recenterKey])

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!animating}
      enablePan={false}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2}
      minAzimuthAngle={-Math.PI / 2.2}
      maxAzimuthAngle={Math.PI / 2.2}
      minDistance={1.5}
      maxDistance={12}
      enableDamping
      dampingFactor={0.04}
      zoomSpeed={0.4}
      makeDefault
    />
  )
}

// ─── Nudge tool helpers ───────────────────────────────────────────────────────

function add3(a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]] }
function fmt3(v) { return `${v[0].toFixed(3)}, ${v[1].toFixed(3)}, ${v[2].toFixed(3)}` }

const NUDGE_GROUPS = [
  { key: 'base',    label: 'Base'       },
  { key: 'valve',   label: 'Valve'      },
  { key: 'acc',     label: 'Curtain Rod'},
  { key: 'seat',     label: 'Seats'      },
  { key: 'folddown', label: 'Fold Down'  },
  { key: 'head',     label: 'Heads'      },
  { key: 'gbv',     label: 'GB Back'    },
  { key: 'gbd',     label: 'GB Entry'   },
  { key: 'stddoor', label: 'Std Door'   },
  { key: 'tubpull', label: 'Tub Pull'   },
  { key: 'drain',   label: 'Drain'      },
  { key: 'mirror',  label: 'Mirror'     },
]

function NudgeOverlay({ active, setActive, positions, rotations }) {
  const wrap = {
    position: 'fixed', top: 72, left: 16, zIndex: 100,
    fontFamily: 'monospace', fontSize: '13px', borderRadius: '10px',
    padding: '12px 14px', lineHeight: 1.6,
    background: 'rgba(14,16,22,0.95)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    userSelect: 'none', minWidth: '260px',
  }
  const pill = (selected) => ({
    padding: '4px 10px', borderRadius: '20px', border: 'none',
    cursor: 'pointer', fontSize: '11px', fontWeight: 500,
    fontFamily: 'monospace',
    background: selected ? '#c9a25a' : 'rgba(255,255,255,0.1)',
    color: selected ? '#0a0b0f' : 'rgba(255,255,255,0.75)',
    transition: 'all 0.12s',
  })

  const pos = active ? positions[active] : null
  const isGrabBar = active === 'gbv' || active === 'gbd'
  const rot = isGrabBar && rotations ? rotations[active] : null

  return (
    <div style={wrap}>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '6px', letterSpacing: '0.1em' }}>
        SELECT GROUP TO NUDGE
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
        {NUDGE_GROUPS.map(g => (
          <button key={g.key} style={pill(active === g.key)}
            onClick={() => setActive(active === g.key ? null : g.key)}>
            {g.label}
          </button>
        ))}
      </div>
      {pos && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginBottom: '8px' }}>
          <div style={{ color: '#c9a25a', fontSize: '11px' }}>
            NUDGING: <b style={{ color: '#fff' }}>{NUDGE_GROUPS.find(g=>g.key===active)?.label}</b>
          </div>
          <div style={{ color: '#fff', fontSize: '14px', userSelect: 'text', cursor: 'text' }}>[{fmt3(pos)}]</div>
          {rot && (() => {
            const eu = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(...rot))
            return <div style={{ color: '#80c8ff', fontSize: '12px' }}>rot [{[eu.x,eu.y,eu.z].map(v=>(v/Math.PI).toFixed(2)+'π').join(', ')}]</div>
          })()}
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '4px' }}>
            ◀▶=X · ▲▼=Z · W/S=Y · Shift=fine · Enter=copy · Esc=deselect
            {isGrabBar && ' · Q/E=rotZ · R/F=rotX · T/G=rotY'}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Full scene ───────────────────────────────────────────────────────────────

function SceneContent({ selections, recenterKey, nudges, gbRots, showRoomWalls, skipIntro, onPanelReady }) {
  const { scene: surroundRef } = useGLTF('/models/SHOWER-SURROUND-CENTER-ELITE.glb')
  const nicheCenter = useMemo(() => {
    const c = new THREE.Box3().setFromObject(surroundRef).getCenter(new THREE.Vector3())
    c.z += 0.35
    return c
  }, [surroundRef])

  const gbvQuat = useMemo(() => new THREE.Quaternion(...gbRots.gbv), [gbRots.gbv])
  const gbdQuat = useMemo(() => new THREE.Quaternion(...gbRots.gbd), [gbRots.gbd])

  const basePosRaw = selections.base === 'tub' ? TUB_WET_POS : SHOWER_WET_POS
  const positions = {
    base:      add3(basePosRaw,        nudges.base),
    valve:     add3(VALVE_POS,         nudges.valve),
    acc:       add3(ACC_POS,           nudges.acc),
    seat:      add3(SEAT_POS,          nudges.seat),
    folddown:  add3(FOLD_DOWN_POS,     nudges.folddown),
    head:      add3(STANDARD_HEAD_POS, nudges.head),
    headRain:  add3(RAIN_HEAD_POS,     nudges.head),
    headHand:  add3(HANDHELD_POS,      nudges.head),
    headTub:   add3(TUB_HEAD_POS,      nudges.head),
    gbv:       add3(GRAB_BAR_VERT_POS, nudges.gbv),
    gbd:       add3(GRAB_BAR_DIAG_POS, nudges.gbd),
    stddoor:   add3(selections.base === 'tub' ? TUB_DOOR_POS : STD_DOOR_POS,  nudges.stddoor),
    stdglass:  add3(selections.base === 'tub' ? TUB_DOOR_POS : STD_GLASS_POS, nudges.stddoor),
    tubpull:   add3(TUB_PULL_POS, nudges.tubpull),
    drain:     add3(DRAIN_POS,         nudges.drain),
    mirror:    add3(MIRROR_POS,        nudges.mirror),
  }
  const rotations = gbRots

  return (
    <>
      <Environment preset="warehouse" background={false} environmentIntensity={0.15} />
      <ambientLight intensity={0.55} color="#ffffff" />
      <rectAreaLight width={2.2} height={1.8} intensity={3.5} color="#fffaf0" position={[-2.0, 3.5, -0.8]} rotation={[-Math.PI / 2, 0, 0]} />
      <directionalLight position={[-4, 3, 2]} intensity={0.35} color="#f0f8ff" />
      <directionalLight position={[0, 2, 5]}  intensity={0.25} color="#ffffff" castShadow={false} />
      <directionalLight position={[3, 2, 0]}  intensity={0.25} color="#ffffff" castShadow={false} />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.65} scale={12} blur={1.8} far={3} frames={1} />

      {STATIC_ENV_URLS.map(url => <EnvModel key={url} url={url} />)}
      <EnvModel key={ROOM_WALL_URL} url={ROOM_WALL_URL} visible={showRoomWalls} />
      <MirrorReflector position={positions.mirror} />

      <WallPanels wallId={selections.walls ?? selections.wallColor} wallPatternId={selections.wallPattern} />

      <group position={positions.acc} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/SHOWER-ROD-CURVED.glb" trimId={selections.trim}
                          visible={selections.enclosure === 'curtain-rod'} />
      </group>

      <group position={positions.stddoor} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel
          url={selections.base === 'tub' ? '/models/TB-GE-ENCLOSURE.glb' : '/models/SHOWER-DOOR-STD.glb'}
          trimId={selections.trim}
          visible={selections.enclosure === 'clear-glass-door' || selections.enclosure === 'rain-glass-door'} />
      </group>

      <group position={positions.stdglass} rotation={[0, Math.PI / 2, 0]}>
        <GlassModel
          url={selections.base === 'tub' ? '/models/TB-STD-GLASS.glb' : '/models/SH-STD-GLASS.glb'}
          rain={selections.enclosure === 'rain-glass-door'}
          visible={selections.enclosure === 'clear-glass-door' || selections.enclosure === 'rain-glass-door'} />
      </group>

      <group position={positions.tubpull} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/SD-Horizontal_Ladder_Pulls.glb" trimId={selections.trim}
                          visible={selections.base === 'tub' && (selections.enclosure === 'clear-glass-door' || selections.enclosure === 'rain-glass-door')} />
      </group>

      <group position={positions.seat} rotation={[0, Math.PI / 2, 0]}>
        <LeftSeatModel url="/models/BENCH-SHOWER-SEAT.glb"     visible={selections.seat === 'bench'} />
        <LeftSeatModel url="/models/HEXAGONAL-CORNER-SEAT.glb" visible={selections.seat === 'corner'} />
      </group>

      <group position={positions.folddown} rotation={[0, Math.PI / 2, 0]}>
        <FoldDownSeat visible={selections.seat === 'fold-down'} />
      </group>

      <group position={SHOWER_WET_POS} rotation={[0, Math.PI / 2, 0]}
             visible={selections.shelf === 'corner-shelf'}>
        <TrimColoredModel url="/models/METAL-CORNER-SHELF_both.glb" trimId={selections.trim} />
      </group>

      <group position={TUB_WET_POS} rotation={[0, Math.PI / 2, 0]}>
        <OptionalModel url="/models/NICHE-SHELF.glb" visible={selections.shelf === 'niche-shelf'} />
      </group>

      <group position={positions.valve} rotation={[0, Math.PI / 2, 0]}>
        <TrimModels trimId={selections.trim} />
      </group>

      <group position={positions.head} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/LA-STANDARD-SHOWER-FIXTURE.glb" trimId={selections.trim}
                          visible={selections.base !== 'tub' && selections.showerHead === 'standard'} />
      </group>

      <group position={positions.headRain} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/LA-RAIN-SHOWER-HEAD.glb" trimId={selections.trim}
                          visible={selections.base !== 'tub' && selections.showerHead === 'rain-head'} />
      </group>

      <group position={positions.headHand} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/LA-HANDHELD_FIXTURE.glb" trimId={selections.trim}
                          visible={selections.base !== 'tub' && selections.showerHead === 'handheld'} />
      </group>

      <group position={positions.headTub} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/LA-TUB-SHOWER-FIXTURES.glb" trimId={selections.trim}
                          visible={selections.base === 'tub'} />
      </group>

      <group position={positions.gbv} quaternion={gbvQuat}>
        <TrimColoredModel url="/models/LA-GRAB-BAR-24.glb" trimId={selections.trim}
                          visible={selections.grabBar === 'grab-bar-set'} />
      </group>
      <group position={positions.gbd} quaternion={gbdQuat}>
        <TrimColoredModel url="/models/LA-GRAB-BAR-24.glb" trimId={selections.trim}
                          visible={selections.grabBar === 'grab-bar-set'} />
      </group>

      <group position={positions.base} rotation={[0, Math.PI / 2, 0]}>
        <BaseModel selection={selections.base} baseColor={selections.baseColor} wallId={selections.walls ?? selections.wallColor} />
      </group>
      <group position={positions.drain} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/SHOWER-DRAIN.glb" trimId={selections.trim}
                          visible={selections.base !== 'tub'} />
      </group>

      <CameraRig recenterKey={recenterKey} showerCenter={nicheCenter} skipIntro={skipIntro} onPanelReady={onPanelReady} />
    </>
  )
}

// ─── Loading overlay ──────────────────────────────────────────────────────────

function LoadingOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '34px', height: '34px',
        border: '2px solid rgba(201,162,90,0.2)',
        borderTop: '2px solid #c9a25a',
        borderRadius: '50%',
        animation: 'spin 0.9s linear infinite',
      }} />
    </div>
  )
}

function SceneLoaded({ onLoad }) {
  useEffect(() => { onLoad?.() }, [onLoad])
  return null
}

// ─── Canvas export ────────────────────────────────────────────────────────────

function ScreenshotCapture({ glRef }) {
  const { gl } = useThree()
  useEffect(() => { glRef.current = gl }, [gl, glRef])
  return null
}

export default function BathroomScene({ selections, recenterKey, showRoomWalls, onPanelReady, onExport, glRef }) {
  const [skipIntro] = useState(() => !!sessionStorage.getItem('elite-intro-played'))
  const [isLoaded, setIsLoaded] = useState(false)
  const [exportHovered, setExportHovered] = useState(false)

  const handleExport = useCallback(() => {
    const { camera, center } = _camCtx
    if (camera && center) {
      const { x, y, z } = center
      camera.position.set(x, y + 1.0, z + 4.0)
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const dataUrl = glRef?.current?.domElement.toDataURL('image/jpeg', 0.92)
      if (dataUrl) onExport?.(dataUrl)
    }))
  }, [glRef, onExport])
  const [active, setActive] = useState(null)
  const [showNudge, setShowNudge] = useState(false)
  const [nudges, setNudges] = useState({
    base:[0,0,0], valve:[0,0,0], acc:[0,0,0], seat:[0,0,0], folddown:[0,0,0],
    head:[0,0,0], gbv:[0,0,0], gbd:[0,0,0], stddoor:[0,0,0], tubpull:[0,0,0], drain:[0,0,0], mirror:[0,0,0],
  })
  const eulerToQuat = (e) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...e))
    return [q.x, q.y, q.z, q.w]
  }
  const [gbRots, setGbRots] = useState({
    gbv: eulerToQuat(GRAB_BAR_VERT_EULER),
    gbd: eulerToQuat(GRAB_BAR_DIAG_EULER),
  })
  const activeRef  = useRef(null)
  const nudgesRef  = useRef(nudges)
  const gbRotsRef  = useRef(gbRots)
  useEffect(() => { activeRef.current = active  }, [active])
  useEffect(() => { nudgesRef.current = nudges  }, [nudges])
  useEffect(() => { gbRotsRef.current = gbRots  }, [gbRots])

  const basePosRaw = selections.base === 'tub' ? TUB_WET_POS : SHOWER_WET_POS

  useEffect(() => {
    const STEP = 0.05
    const FINE = 0.01
    const ROT_STEP = Math.PI / 12
    const shiftHeld = { current: false }
    const KEY_SELECT = { '1':'base', '2':'valve', '3':'acc', '4':'seat', '5':'head', '6':'gbv', '7':'gbd', '8':'drain' }
    const onKey = (e) => {
      if (e.key === 'Shift') { shiftHeld.current = true; return }
      if (KEY_SELECT[e.key]) { setActive(KEY_SELECT[e.key]); return }
      const grp = activeRef.current
      if (!grp) return

      const step = shiftHeld.current ? FINE : STEP
      const dx = e.key==='ArrowLeft'  ? -step : e.key==='ArrowRight' ? step : 0
      const dz = e.key==='ArrowUp'    ? -step : e.key==='ArrowDown'  ? step : 0
      const dy = (e.key==='w'||e.key==='W') ? step : (e.key==='s'||e.key==='S') ? -step : 0
      if (dx||dy||dz) {
        e.preventDefault()
        setNudges(prev => { const c=prev[grp]; return {...prev,[grp]:[c[0]+dx,c[1]+dy,c[2]+dz]} })
      }

      if (grp === 'gbv' || grp === 'gbd') {
        const ROT_MAP = {
          q:[0,0,1,1], Q:[0,0,1,1], e:[0,0,-1,1], E:[0,0,-1,1],
          r:[1,0,0,1], R:[1,0,0,1], f:[-1,0,0,1], F:[-1,0,0,1],
          t:[0,1,0,1], T:[0,1,0,1], g:[0,-1,0,1], G:[0,-1,0,1],
        }
        const entry = ROT_MAP[e.key]
        if (entry) {
          e.preventDefault()
          const [ax, ay, az, sign] = entry
          setGbRots(prev => {
            const [x, y, z, w] = prev[grp]
            const q  = new THREE.Quaternion(x, y, z, w)
            const dq = new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(ax, ay, az).normalize(), sign * ROT_STEP)
            dq.multiply(q)
            return { ...prev, [grp]: [dq.x, dq.y, dq.z, dq.w] }
          })
        }
      }

      if (e.key==='Escape') setActive(null)
      if (e.key==='Enter') {
        const n = nudgesRef.current
        const r = gbRotsRef.current
        const toEulerStr = (qArr) => {
          const eu = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(...qArr))
          return [eu.x, eu.y, eu.z].map(v => (v / Math.PI).toFixed(3) + 'π').join(', ')
        }
        const lines = [
          `VALVE_POS:           ${fmt3(add3(VALVE_POS,          n.valve))}`,
          `ACC_POS:             ${fmt3(add3(ACC_POS,            n.acc))}`,
          `STD_DOOR_POS:        ${fmt3(add3(STD_DOOR_POS,       n.stddoor))}`,
          `STD_GLASS_POS:       ${fmt3(add3(STD_GLASS_POS,      n.stddoor))}`,
          `DENALI_DOOR_POS:     ${fmt3(add3(DENALI_DOOR_POS,    n.denali ?? [0,0,0]))}`,
          `STANDARD_HEAD_POS:   ${fmt3(add3(STANDARD_HEAD_POS,  n.head))}`,
          `RAIN_HEAD_POS:       ${fmt3(add3(RAIN_HEAD_POS,      n.head))}`,
          `HANDHELD_POS:        ${fmt3(add3(HANDHELD_POS,       n.head))}`,
          `TUB_HEAD_POS:        ${fmt3(add3(TUB_HEAD_POS,       n.head))}`,
          `GRAB_BAR_VERT_POS:   ${fmt3(add3(GRAB_BAR_VERT_POS,  n.gbv))}`,
          `GRAB_BAR_VERT_EULER: ${toEulerStr(r.gbv)}`,
          `GRAB_BAR_DIAG_POS:   ${fmt3(add3(GRAB_BAR_DIAG_POS,  n.gbd))}`,
          `GRAB_BAR_DIAG_EULER: ${toEulerStr(r.gbd)}`,
          `SHOWER_WET_POS:      ${fmt3(add3(SHOWER_WET_POS,     n.base))}`,
          `TUB_WET_POS:         ${fmt3(add3(TUB_WET_POS,        n.base))}`,
          `DRAIN_POS:           ${fmt3(add3(DRAIN_POS,           n.drain))}`,
          `MIRROR_POS:          ${fmt3(add3(MIRROR_POS,          n.mirror))}`,
        ].join('\n')
        navigator.clipboard.writeText(lines).then(() => {
          console.log('Copied to clipboard:\n' + lines)
        })
      }
    }
    const onKeyUp = (e) => { if (e.key === 'Shift') shiftHeld.current = false }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const positions = {
    base:    add3(basePosRaw,        nudges.base),
    valve:   add3(VALVE_POS,         nudges.valve),
    acc:     add3(ACC_POS,           nudges.acc),
    seat:     add3(SEAT_POS,          nudges.seat),
    folddown: add3(FOLD_DOWN_POS,     nudges.folddown),
    head:     add3(STANDARD_HEAD_POS, nudges.head),
    gbv:      add3(GRAB_BAR_VERT_POS, nudges.gbv),
    gbd:     add3(GRAB_BAR_DIAG_POS, nudges.gbd),
    stddoor: add3(selections.base === 'tub' ? TUB_DOOR_POS : STD_DOOR_POS,  nudges.stddoor),
    stdglass: add3(selections.base === 'tub' ? TUB_DOOR_POS : STD_GLASS_POS, nudges.stddoor),
    tubpull: add3(TUB_PULL_POS, nudges.tubpull),
    drain:   add3(DRAIN_POS,         nudges.drain),
    mirror:  add3(MIRROR_POS,        nudges.mirror),
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {!isLoaded && <LoadingOverlay />}
      <button
        onClick={() => setShowNudge(v => !v)}
        title="Toggle nudge tool"
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 101,
          width: 28, height: 28, borderRadius: '50%', border: 'none',
          background: showNudge ? 'rgba(201,162,90,0.9)' : 'transparent',
          color: showNudge ? '#0a0b0f' : 'transparent',
          cursor: showNudge ? 'pointer' : 'default',
          fontSize: '14px', lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >⚙</button>
      {showNudge && <NudgeOverlay active={active} setActive={setActive} positions={positions} rotations={gbRots} />}
      <button
        onClick={handleExport}
        onMouseEnter={() => setExportHovered(true)}
        onMouseLeave={() => setExportHovered(false)}
        title="Export design"
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 101,
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: exportHovered ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)',
          color: exportHovered ? '#ffffff' : 'rgba(255,255,255,0.65)',
          transform: exportHovered ? 'scale(1.1)' : 'scale(1)',
          cursor: 'pointer', lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.1s ease, color 0.1s ease, transform 0.1s ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      </button>
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 52, near: 0.05, far: 80 }}
        shadows
        onCreated={({ gl }) => { if (gl && gl.shadowMap) gl.shadowMap.type = THREE.PCFShadowMap }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          preserveDrawingBuffer: true,
        }}
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--bg-scene)',
          backgroundImage: 'var(--grid-pattern)',
        }}
      >
        <ScreenshotCapture glRef={glRef ?? { current: null }} />
        <Suspense fallback={null}>
          <SceneContent selections={selections} recenterKey={recenterKey} nudges={nudges} gbRots={gbRots} showRoomWalls={showRoomWalls} skipIntro={skipIntro} onPanelReady={onPanelReady} />
          <SceneLoaded onLoad={() => setIsLoaded(true)} />
        </Suspense>
      </Canvas>
    </>
  )
}

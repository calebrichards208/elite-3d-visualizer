import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Html, Environment, ContactShadows } from '@react-three/drei'
import { loadBasisTexture } from '../utils/loadBasisTexture.js'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import manifest from '../data/products-manifest.json'

RectAreaLightUniformsLib.init()

// ─── Trim finish presets ──────────────────────────────────────────────────────

const TRIM_PROPS = {
  'chrome':             { color: '#d4d4d4', metalness: 1.0, roughness: 0.05 },
  'brushed-nickel':     { color: '#a8a8ae', metalness: 0.9, roughness: 0.30 },
  'matte-black':        { color: '#1a1a1a', metalness: 0.5, roughness: 0.80 },
  'brushed-gold':       { color: '#c8a44a', metalness: 1.0, roughness: 0.25 },
  'oil-rubbed-bronze':  { color: '#3a1c0c', metalness: 0.6, roughness: 0.55 },
  'stainless':          { color: '#c4c4c4', metalness: 1.0, roughness: 0.20 },
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
const TUB_WET_POS    = [-1.683, 0.000, 1.444]
const ACC_POS        = [-1.683, 0.000, 1.394]
const STD_DOOR_POS   = [-1.683, 0.000, 1.394]
const STD_GLASS_POS  = [-2.033, 1.200, -0.006]
const DENALI_DOOR_POS = [-1.983, 1.250, -0.006]
const VALVE_POS         = [-1.883, 0.000, 1.444]
const STANDARD_HEAD_POS = [-1.933, 0.000, 1.344]
const RAIN_HEAD_POS     = [-1.883, 0.100, 1.444]
const HANDHELD_POS      = [-1.883, 0.250, 1.244]
const TUB_HEAD_POS      = [-1.883, 0.000, 1.444]
const SEAT_POS          = [-1.683, 0.000,  1.344]
const FOLD_DOWN_POS     = [-2.633, 0.400, -0.256]
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
  '/models/LA-RAIN-SHOWER-HEAD.glb',
  '/models/LA-HANDHELD_FIXTURE.glb',
  '/models/LA-TUB-SHOWER-FIXTURES.glb',
  '/models/LA-GRAB-BAR-24.glb',
  '/models/SHOWER-ROD-CURVED.glb',
  '/models/SHOWER-DOOR-STD.glb',
  '/models/SH-STD-GLASS.glb',
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
    }
  }, [cloned, gl, url])

  return <primitive object={cloned} visible={visible} />
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
      mat.roughness = 0.38
      mat.needsUpdate = true
    }

    const patternOpt = manifest.categories.wallPattern?.options.find(o => o.id === wallPatternId)
    if (!patternOpt?.normalTexture) { clearEtch(); return }

    const setupTex = (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(4, 5.3)
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
      return THREE.MathUtils.lerp(0.75, 0.15, luminance)
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
          mat.displacementMap = setupTex(alphaTex)
          mat.displacementScale = -0.004
          mat.displacementBias = 0
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

function BaseModel({ selection }) {
  const { scene: shower } = useGLTF('/models/SHOWER-STANDARD.glb')
  const { scene: tub }    = useGLTF('/models/TUB-CLASSIC.glb')
  return (
    <>
      <primitive object={shower} visible={selection === 'shower'} />
      <primitive object={tub}    visible={selection === 'tub'} />
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

function CameraRig({ recenterKey, showerCenter }) {
  const { camera }  = useThree()
  const controlsRef = useRef()

  useEffect(() => {
    if (!controlsRef.current) return
    const { x, y, z } = showerCenter
    const mobile = window.innerWidth <= 768
    camera.position.set(x, y + (mobile ? 0.7 : 1.0), z + (mobile ? 5.5 : 4))
    controlsRef.current.target.set(x, y + (mobile ? 0.0 : 0.3), z)
    controlsRef.current.update()
    controlsRef.current.saveState()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, showerCenter])

  useEffect(() => {
    if (recenterKey === 0 || !controlsRef.current) return
    controlsRef.current.reset()
  }, [recenterKey])

  return (
    <OrbitControls
      ref={controlsRef}
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
  { key: 'seat',    label: 'Seats'      },
  { key: 'head',    label: 'Heads'      },
  { key: 'gbv',     label: 'GB Back'    },
  { key: 'gbd',     label: 'GB Entry'   },
  { key: 'stddoor', label: 'Std Door'   },
  { key: 'drain',   label: 'Drain'      },
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

function SceneContent({ selections, recenterKey, nudges, gbRots, showRoomWalls }) {
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
    head:      add3(STANDARD_HEAD_POS, nudges.head),
    headRain:  add3(RAIN_HEAD_POS,     nudges.head),
    headHand:  add3(HANDHELD_POS,      nudges.head),
    headTub:   add3(TUB_HEAD_POS,      nudges.head),
    gbv:       add3(GRAB_BAR_VERT_POS, nudges.gbv),
    gbd:       add3(GRAB_BAR_DIAG_POS, nudges.gbd),
    stddoor:   add3(STD_DOOR_POS,      nudges.stddoor),
    stdglass:  add3(STD_GLASS_POS,     nudges.stddoor),
    drain:     add3(DRAIN_POS,         nudges.drain),
  }
  const rotations = gbRots

  return (
    <>
      <Environment preset="warehouse" background={false} environmentIntensity={0.15} />
      <ambientLight intensity={0.55} color="#ffffff" />
      <rectAreaLight width={2.2} height={1.8} intensity={5.5} color="#fffaf0" position={[-2.0, 3.5, -0.8]} rotation={[-Math.PI / 2, 0, 0]} />
      <directionalLight position={[-4, 3, 2]} intensity={0.35} color="#f0f8ff" />
      <ContactShadows position={[0, 0.01, 0]} opacity={0.65} scale={12} blur={1.8} far={3} frames={1} />

      {STATIC_ENV_URLS.map(url => <EnvModel key={url} url={url} />)}
      <EnvModel key={ROOM_WALL_URL} url={ROOM_WALL_URL} visible={showRoomWalls} />

      <WallPanels wallId={selections.walls ?? selections.wallColor} wallPatternId={selections.wallPattern} />

      <group position={positions.acc} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/SHOWER-ROD-CURVED.glb" trimId={selections.trim}
                          visible={selections.enclosure === 'curtain-rod'} />
      </group>

      <group position={positions.stddoor} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/SHOWER-DOOR-STD.glb" trimId={selections.trim}
                          visible={selections.enclosure === 'clear-glass-door' || selections.enclosure === 'rain-glass-door'} />
      </group>

      <group position={positions.stdglass} rotation={[0, Math.PI / 2, 0]}>
        <GlassModel url="/models/SH-STD-GLASS.glb"
                    rain={selections.enclosure === 'rain-glass-door'}
                    visible={selections.enclosure === 'clear-glass-door' || selections.enclosure === 'rain-glass-door'} />
      </group>

      <group position={positions.seat} rotation={[0, Math.PI / 2, 0]}>
        <LeftSeatModel url="/models/BENCH-SHOWER-SEAT.glb"     visible={selections.seat === 'bench'} />
        <LeftSeatModel url="/models/HEXAGONAL-CORNER-SEAT.glb" visible={selections.seat === 'corner'} />
      </group>

      <group position={FOLD_DOWN_POS} rotation={[0, Math.PI / 2, 0]}>
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
        <BaseModel selection={selections.base} />
      </group>
      <group position={positions.drain} rotation={[0, Math.PI / 2, 0]}>
        <TrimColoredModel url="/models/SHOWER-DRAIN.glb" trimId={selections.trim}
                          visible={selections.base !== 'tub'} />
      </group>

      <CameraRig recenterKey={recenterKey} showerCenter={nicheCenter} />
    </>
  )
}

// ─── Loading overlay ──────────────────────────────────────────────────────────

function LoadingOverlay() {
  return (
    <Html center>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '34px', height: '34px',
          border: '2px solid rgba(201,162,90,0.2)',
          borderTop: '2px solid #c9a25a',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }} />
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic', fontSize: '15px',
          color: 'rgba(240,237,232,0.5)', letterSpacing: '0.08em',
        }}>Loading…</p>
      </div>
    </Html>
  )
}

// ─── Canvas export ────────────────────────────────────────────────────────────

export default function BathroomScene({ selections, recenterKey, showRoomWalls }) {
  const [active, setActive] = useState(null)
  const [showNudge, setShowNudge] = useState(false)
  const [nudges, setNudges] = useState({
    base:[0,0,0], valve:[0,0,0], acc:[0,0,0], seat:[0,0,0],
    head:[0,0,0], gbv:[0,0,0], gbd:[0,0,0], stddoor:[0,0,0], drain:[0,0,0],
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
    seat:    add3(SEAT_POS,          nudges.seat),
    head:    add3(STANDARD_HEAD_POS, nudges.head),
    gbv:     add3(GRAB_BAR_VERT_POS, nudges.gbv),
    gbd:     add3(GRAB_BAR_DIAG_POS, nudges.gbd),
    stddoor: add3(STD_DOOR_POS,      nudges.stddoor),
    stdglass: add3(STD_GLASS_POS,    nudges.stddoor),
    drain:   add3(DRAIN_POS,         nudges.drain),
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <button
        onClick={() => setShowNudge(v => !v)}
        title="Toggle nudge tool"
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 101,
          width: 28, height: 28, borderRadius: '50%', border: 'none',
          background: showNudge ? 'rgba(201,162,90,0.9)' : 'rgba(255,255,255,0.08)',
          color: showNudge ? '#0a0b0f' : 'rgba(255,255,255,0.3)',
          cursor: 'pointer', fontSize: '14px', lineHeight: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >⚙</button>
      {showNudge && <NudgeOverlay active={active} setActive={setActive} positions={positions} rotations={gbRots} />}
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 52, near: 0.05, far: 80 }}
        shadows
        onCreated={({ gl }) => { if (gl && gl.shadowMap) gl.shadowMap.type = THREE.PCFShadowMap }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--bg-scene)',
          backgroundImage: 'var(--grid-pattern)',
        }}
      >
        <Suspense fallback={<LoadingOverlay />}>
          <SceneContent selections={selections} recenterKey={recenterKey} nudges={nudges} gbRots={gbRots} showRoomWalls={showRoomWalls} />
        </Suspense>
      </Canvas>
    </>
  )
}

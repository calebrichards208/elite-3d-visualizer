import * as THREE from 'three'

let basisReady = null

function initBasis() {
  if (basisReady) return basisReady
  basisReady = new Promise(async (resolve, reject) => {
    try {
      if (!window.BASIS) {
        await new Promise((res, rej) => {
          const s = document.createElement('script')
          s.src = '/basis/basis_transcoder.js'
          s.onload = res
          s.onerror = rej
          document.head.appendChild(s)
        })
      }
      const wasm = await fetch('/basis/basis_transcoder.wasm').then(r => r.arrayBuffer())
      const mod  = await window.BASIS({ wasmBinary: wasm })
      mod.initializeBasis()
      resolve(mod)
    } catch (err) {
      basisReady = null
      reject(err)
    }
  })
  return basisReady
}

export async function loadBasisTexture(url) {
  const [mod, buf] = await Promise.all([
    initBasis(),
    fetch(url).then(r => r.arrayBuffer()),
  ])

  const data = new Uint8Array(buf)
  const bf   = new mod.BasisFile(data)

  if (!bf.startTranscoding()) {
    bf.close(); bf.delete()
    throw new Error('[BasisLoader] transcoding failed: ' + url)
  }

  const fmt = mod.cTFRGBA32
  const w   = bf.getImageWidth(0, 0)
  const h   = bf.getImageHeight(0, 0)
  const dst = new Uint8Array(bf.getImageTranscodedSizeInBytes(0, 0, fmt))
  bf.transcodeImage(dst, 0, 0, fmt, 0, 0)
  bf.close()
  bf.delete()

  const tex = new THREE.DataTexture(dst, w, h, THREE.RGBAFormat)
  tex.flipY = true
  tex.needsUpdate = true
  return tex
}

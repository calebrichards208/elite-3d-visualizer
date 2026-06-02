import { BasisTextureLoader } from 'three-stdlib'
import * as THREE from 'three'

let basisLoader = null
let basisLoaderGl = null

function getBasisLoader(gl) {
  if (!basisLoader || basisLoaderGl !== gl) {
    basisLoader = new BasisTextureLoader()
    basisLoader.setTranscoderPath('/basis/')
    basisLoader.detectSupport(gl)
    basisLoaderGl = gl
  }
  return basisLoader
}

const texLoader = new THREE.TextureLoader()

export function loadWallTexture(url, gl) {
  if (url.endsWith('.basis')) {
    return new Promise((resolve, reject) => {
      getBasisLoader(gl).load(url, resolve, undefined, reject)
    })
  }
  return new Promise((resolve, reject) => {
    texLoader.load(url, resolve, undefined, reject)
  })
}

// backward-compat alias
export { loadWallTexture as loadBasisTexture }

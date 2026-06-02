import { BasisTextureLoader } from 'three-stdlib'

let loader = null
let loaderGl = null

function getLoader(gl) {
  if (!loader || loaderGl !== gl) {
    loader = new BasisTextureLoader()
    loader.setTranscoderPath('/basis/')
    loader.detectSupport(gl)
    loaderGl = gl
  }
  return loader
}

export function loadBasisTexture(url, gl) {
  return new Promise((resolve, reject) => {
    getLoader(gl).load(url, resolve, undefined, reject)
  })
}

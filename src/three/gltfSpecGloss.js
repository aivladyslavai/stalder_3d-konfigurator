import * as THREE from 'three'

const NAME = 'KHR_materials_pbrSpecularGlossiness'

/**
 * Sketchfab-Lotos kommt als specular-glossiness. Three.js 0.169 kennt die
 * Erweiterung nicht mehr – wir mappen Diffuse auf MeshStandard.
 */
class SpecGlossPlugin {
  constructor(parser) {
    this.parser = parser
    this.name = NAME
  }

  extendMaterialParams(materialIndex, materialParams) {
    const def = this.parser.json.materials[materialIndex]
    const ext = def.extensions?.[NAME]
    if (!ext) return Promise.resolve()

    const pending = []
    if (Array.isArray(ext.diffuseFactor)) {
      const c = ext.diffuseFactor
      materialParams.color.setRGB(c[0], c[1], c[2], THREE.LinearSRGBColorSpace)
      if (c[3] != null) materialParams.opacity = c[3]
    }
    if (ext.diffuseTexture) {
      pending.push(this.parser.assignTexture(materialParams, 'map', ext.diffuseTexture, THREE.SRGBColorSpace))
    }
    materialParams.metalness = 0
    materialParams.roughness = 1 - (ext.glossinessFactor ?? 0.4)
    return Promise.all(pending)
  }
}

export function extendGltfLoader(loader) {
  loader.register((parser) => new SpecGlossPlugin(parser))
}

import * as THREE from 'three'

// --- Prozedurale Texturen (komplett selbst generiert, keine externen Assets) ---

// Deterministischer Hash / Value-Noise
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function lerp(a, b, t) {
  return a + (b - a) * t
}
function smooth(t) {
  return t * t * (3 - 2 * t)
}
function valueNoise(x, y) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const tl = hash(xi, yi)
  const tr = hash(xi + 1, yi)
  const bl = hash(xi, yi + 1)
  const br = hash(xi + 1, yi + 1)
  const u = smooth(xf)
  const v = smooth(yf)
  return lerp(lerp(tl, tr, u), lerp(bl, br, u), v)
}
function fbm(x, y, octaves = 5) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq)
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

/**
 * Wasser-Normalmap aus FBM-Höhenfeld – erzeugt feine, gerichtete Wellen.
 */
export function makeWaterNormalTexture(size = 256, scale = 6) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)
  const h = (i, j) => fbm((i / size) * scale, (j / size) * scale, 5)
  const strength = 2.2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hl = h((x - 1 + size) % size, y)
      const hr = h((x + 1) % size, y)
      const hd = h(x, (y - 1 + size) % size)
      const hu = h(x, (y + 1) % size)
      let nx = (hl - hr) * strength
      let ny = (hd - hu) * strength
      let nz = 1
      const len = Math.hypot(nx, ny, nz)
      nx /= len
      ny /= len
      nz /= len
      const idx = (y * size + x) * 4
      img.data[idx] = (nx * 0.5 + 0.5) * 255
      img.data[idx + 1] = (ny * 0.5 + 0.5) * 255
      img.data[idx + 2] = (nz * 0.5 + 0.5) * 255
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/**
 * Kaustik-Textur (Worley/Voronoi-Grate) – das typische Lichtnetz am Beckenboden.
 */
export function makeCausticsTexture(size = 256, cells = 7) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)

  // Feature-Punkte (gekachelt) erzeugen
  const pts = []
  for (let gy = -1; gy <= cells; gy++) {
    for (let gx = -1; gx <= cells; gx++) {
      const jx = hash(gx + 0.3, gy + 7.1)
      const jy = hash(gx + 5.7, gy + 2.9)
      pts.push([((gx + jx) / cells) * size, ((gy + jy) / cells) * size])
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let f1 = 1e9
      let f2 = 1e9
      for (const [px, py] of pts) {
        let dx = Math.abs(x - px)
        let dy = Math.abs(y - py)
        dx = Math.min(dx, size - dx)
        dy = Math.min(dy, size - dy)
        const d = dx * dx + dy * dy
        if (d < f1) {
          f2 = f1
          f1 = d
        } else if (d < f2) {
          f2 = d
        }
      }
      // Grat (F2 - F1) -> dünne helle Linien
      const edge = Math.sqrt(f2) - Math.sqrt(f1)
      let v = 1 - Math.min(1, edge / (size / cells / 1.6))
      v = Math.pow(v, 3.5) // schärfere, hellere Adern
      const c = Math.min(255, v * 255)
      const idx = (y * size + x) * 4
      img.data[idx] = c
      img.data[idx + 1] = c
      img.data[idx + 2] = c
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/**
 * Mosaik-Kachel-Textur (Farbe leicht variierend, dunkle Fugen) – Pool-Optik.
 */
export function makeMosaicTexture(size = 512, tiles = 16, baseColor = '#2a8fb8') {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const base = new THREE.Color(baseColor)
  const grout = base.clone().multiplyScalar(0.45)
  ctx.fillStyle = `rgb(${grout.r * 255 | 0},${grout.g * 255 | 0},${grout.b * 255 | 0})`
  ctx.fillRect(0, 0, size, size)
  const step = size / tiles
  const gap = Math.max(1, step * 0.06)
  for (let j = 0; j < tiles; j++) {
    for (let i = 0; i < tiles; i++) {
      const n = 0.82 + valueNoise(i * 1.3, j * 1.3) * 0.36
      const c = base.clone().multiplyScalar(n)
      ctx.fillStyle = `rgb(${Math.min(255, c.r * 255) | 0},${Math.min(255, c.g * 255) | 0},${Math.min(255, c.b * 255) | 0})`
      ctx.fillRect(i * step + gap, j * step + gap, step - gap * 2, step - gap * 2)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/**
 * Eine einzelne Steinplatte (Paver) mit Fuge am Rand + feiner Körnung.
 * UV in Metern + repeat(1,1) ergibt 1-m-Platten.
 */
export function makePaverTexture(size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  // dunklere Fuge als Hintergrund
  ctx.fillStyle = '#8f897d'
  ctx.fillRect(0, 0, size, size)
  // Plattenfläche (heller), feine Körnung
  const img = ctx.createImageData(size, size)
  const groutPx = Math.round(size * 0.04)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inGrout = x < groutPx || y < groutPx || x > size - groutPx || y > size - groutPx
      const n = 0.92 + valueNoise((x / size) * 40, (y / size) * 40) * 0.12
      const base = inGrout ? 150 : 232 * n
      const idx = (y * size + x) * 4
      img.data[idx] = base
      img.data[idx + 1] = base * 0.985
      img.data[idx + 2] = base * 0.95
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/**
 * Holzdeck-Textur – horizontale Dielen mit Maserung, Fugen und Stössen.
 */
export function makeWoodTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const planks = 6
  const ph = size / planks
  const tones = ['#b6854f', '#a9763f', '#c0905a', '#9f6f3b', '#b88a55', '#aa7d49']
  for (let p = 0; p < planks; p++) {
    const y = p * ph
    ctx.fillStyle = tones[p % tones.length]
    ctx.fillRect(0, y, size, ph)
    // Maserung (feine horizontale Linien)
    for (let g = 0; g < 60; g++) {
      const gy = y + Math.random() * ph
      ctx.strokeStyle = `rgba(60,40,20,${0.04 + Math.random() * 0.06})`
      ctx.lineWidth = 0.5 + Math.random()
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.bezierCurveTo(size * 0.3, gy + (Math.random() - 0.5) * 3, size * 0.7, gy + (Math.random() - 0.5) * 3, size, gy)
      ctx.stroke()
    }
    // Fuge zwischen Dielen
    ctx.fillStyle = 'rgba(20,12,6,0.55)'
    ctx.fillRect(0, y, size, Math.max(1, ph * 0.04))
    // gelegentlicher Diele-Stoss (vertikal)
    if (p % 2 === 0) {
      const sx = size * (0.35 + Math.random() * 0.3)
      ctx.fillStyle = 'rgba(20,12,6,0.5)'
      ctx.fillRect(sx, y, Math.max(1, size * 0.004), ph)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/**
 * Sichtbeton-Textur – sanfte Wolken/Marmorierung + dezente Fugen.
 */
export function makeConcreteTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm((x / size) * 6, (y / size) * 6, 5)
      const v = 200 + n * 38 - 19
      const idx = (y * size + x) * 4
      img.data[idx] = v
      img.data[idx + 1] = v
      img.data[idx + 2] = v * 0.99
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/**
 * Feine Stein-Normalmap für die Terrasse.
 */
export function makeStoneNormalTexture(size = 256, scale = 24) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)
  const h = (i, j) => fbm((i / size) * scale, (j / size) * scale, 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hl = h((x - 1 + size) % size, y)
      const hr = h((x + 1) % size, y)
      const hd = h(x, (y - 1 + size) % size)
      const hu = h(x, (y + 1) % size)
      let nx = (hl - hr) * 0.6
      let ny = (hd - hu) * 0.6
      let nz = 1
      const len = Math.hypot(nx, ny, nz)
      const idx = (y * size + x) * 4
      img.data[idx] = (nx / len * 0.5 + 0.5) * 255
      img.data[idx + 1] = (ny / len * 0.5 + 0.5) * 255
      img.data[idx + 2] = (nz / len * 0.5 + 0.5) * 255
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

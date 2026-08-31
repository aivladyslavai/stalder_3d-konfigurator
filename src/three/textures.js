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

// --- Kachelbares (periodisches) Rauschen ---
// Die Gitterkoordinaten werden modulo der Periode gefaltet, dadurch entstehen
// beim Wiederholen der Textur keine sichtbaren Nähte.
function wrap(v, p) {
  return ((v % p) + p) % p
}
function pValueNoise(x, y, px, py) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const tl = hash(wrap(xi, px), wrap(yi, py))
  const tr = hash(wrap(xi + 1, px), wrap(yi, py))
  const bl = hash(wrap(xi, px), wrap(yi + 1, py))
  const br = hash(wrap(xi + 1, px), wrap(yi + 1, py))
  const u = smooth(xf)
  const v = smooth(yf)
  return lerp(lerp(tl, tr, u), lerp(bl, br, u), v)
}
function pFbm(x, y, px, py, octaves = 4) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amp * pValueNoise(x * freq, y * freq, px * freq, py * freq)
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

/**
 * Wasser-Normalmap: drei überlagerte, leicht gerichtete Wellenzüge auf einem
 * periodischen Höhenfeld – nahtlos kachelbar und fein genug für Kräuselungen.
 */
export function makeWaterNormalTexture(size = 512, period = 6) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)

  const height = (i, j) => {
    const x = (i / size) * period
    const y = (j / size) * period
    // grosse Dünung leicht in die Länge gezogen, darüber feine Kräuselung
    return (
      pFbm(x, y * 1.55, period, period, 5) * 0.4 +
      pFbm(x * 2.15 + 3.1, y * 1.9 + 7.4, period * 2, period * 2, 4) * 0.28 +
      pFbm(x * 5.7 + 11.0, y * 6.4 + 2.2, period * 6, period * 6, 3) * 0.18 +
      pValueNoise(x * 13.0, y * 17.0, period * 13, period * 17) * 0.09 +
      pValueNoise(x * 29.0 + 4.0, y * 23.0, period * 29, period * 23) * 0.05
    )
  }

  const strength = 2.6
  const cache = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) cache[y * size + x] = height(x, y)
  const at = (x, y) => cache[((y + size) % size) * size + ((x + size) % size)]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let nx = (at(x - 1, y) - at(x + 1, y)) * strength
      let ny = (at(x, y - 1) - at(x, y + 1)) * strength
      let nz = 1
      const len = Math.hypot(nx, ny, nz)
      const idx = (y * size + x) * 4
      img.data[idx] = ((nx / len) * 0.5 + 0.5) * 255
      img.data[idx + 1] = ((ny / len) * 0.5 + 0.5) * 255
      img.data[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.center.set(0.5, 0.5)
  return tex
}

/**
 * HDR-Himmelskuppel als Equirect-DataTexture. Dient als Reflexionsumgebung für
 * die Wasseroberfläche: heller Horizont plus überstrahlte Sonne, damit
 * Spiegelung und Glanzlichter unter flachem Blickwinkel realistisch aufhellen.
 */
export function makeSkyEnvTexture(width = 256, mode = 'day') {
  const height = width / 2
  const data = new Float32Array(width * height * 4)

  const palettes = {
    day: {
      zenith: [0.22, 0.42, 0.78],
      horizon: [0.68, 0.8, 0.92],
      ground: [0.16, 0.2, 0.14],
      sun: [12, 11, 9],
      sunDir: [9, 12, 6],
    },
    dusk: {
      zenith: [0.08, 0.13, 0.3],
      horizon: [1.05, 0.55, 0.3],
      ground: [0.07, 0.08, 0.08],
      sun: [24, 10, 4],
      sunDir: [-7, 4, -4],
    },
    // Schwimmhalle: diffuse, helle Decke ohne Sonnenscheibe
    indoor: {
      zenith: [0.62, 0.64, 0.66],
      horizon: [0.34, 0.35, 0.37],
      ground: [0.16, 0.15, 0.14],
      sun: [3.2, 3.1, 2.9],
      sunDir: [2, 9, 3],
    },
  }
  const palette = palettes[mode] || palettes.day
  const hasDisc = mode !== 'indoor'

  const [sx, sy, sz] = palette.sunDir
  const sl = Math.hypot(sx, sy, sz)
  const sun = [sx / sl, sy / sl, sz / sl]

  for (let y = 0; y < height; y++) {
    // v = 0 unten (Nadir), v = 1 oben (Zenit)
    const v = (y + 0.5) / height
    const elev = (v - 0.5) * Math.PI // -pi/2 .. pi/2
    const up = Math.sin(elev)
    let base
    if (up >= 0) {
      const k = Math.pow(up, 0.55)
      base = [
        lerp(palette.horizon[0], palette.zenith[0], k),
        lerp(palette.horizon[1], palette.zenith[1], k),
        lerp(palette.horizon[2], palette.zenith[2], k),
      ]
    } else {
      const k = Math.min(1, -up * 3)
      base = [
        lerp(palette.horizon[0], palette.ground[0], k),
        lerp(palette.horizon[1], palette.ground[1], k),
        lerp(palette.horizon[2], palette.ground[2], k),
      ]
    }

    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width
      const az = (u - 0.5) * Math.PI * 2
      const dir = [Math.cos(elev) * Math.cos(az), up, Math.cos(elev) * Math.sin(az)]
      const cosA = dir[0] * sun[0] + dir[1] * sun[1] + dir[2] * sun[2]

      // Sonnenscheibe mit weichem Halo (drinnen nur ein breites Deckenlicht)
      const disc = hasDisc ? Math.pow(Math.max(0, cosA), 3000) : 0
      const halo = Math.pow(Math.max(0, cosA), hasDisc ? 24 : 6) * 0.35

      const idx = (y * width + x) * 4
      data[idx] = base[0] + palette.sun[0] * disc + palette.sun[0] * 0.03 * halo
      data[idx + 1] = base[1] + palette.sun[1] * disc + palette.sun[1] * 0.03 * halo
      data[idx + 2] = base[2] + palette.sun[2] * disc + palette.sun[2] * 0.03 * halo
      data[idx + 3] = 1
    }
  }

  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.needsUpdate = true
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
/**
 * Beckenauskleidung als grossformatige Paneele: glatte Fläche mit feinem
 * Schliff bzw. leichter Wolke und einer dünnen Fuge an zwei Kanten. Über
 * repeat wird die Paneelgrösse in Metern gesteuert.
 */
export function makePoolPanelTexture(size = 512, baseColor = '#dfe6ea', kind = 'steel') {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const base = new THREE.Color(baseColor)

  ctx.fillStyle = `rgb(${(base.r * 255) | 0}, ${(base.g * 255) | 0}, ${(base.b * 255) | 0})`
  ctx.fillRect(0, 0, size, size)

  if (kind === 'steel') {
    // Längsschliff: helle Chromkante, keine dunklen Striche
    for (let i = 0; i < size * 5; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const len = 18 + Math.random() * 110
      const a = 0.04 + Math.random() * 0.07
      ctx.fillStyle = Math.random() < 0.72 ? `rgba(255,255,255,${a})` : `rgba(180,196,208,${a * 0.45})`
      ctx.fillRect(x, y, len, 1)
    }
  }

  // sanfte Wolke, damit die Fläche nicht digital flach wirkt
  const img = ctx.getImageData(0, 0, size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = (fbm((x / size) * 3, (y / size) * 3, 3) - 0.5) * (kind === 'steel' ? 6 : 7)
      const idx = (y * size + x) * 4
      img.data[idx] = Math.min(255, Math.max(0, img.data[idx] + n))
      img.data[idx + 1] = Math.min(255, Math.max(0, img.data[idx + 1] + n))
      img.data[idx + 2] = Math.min(255, Math.max(0, img.data[idx + 2] + n))
    }
  }
  ctx.putImageData(img, 0, 0)

  // Paneelfuge: schmaler Schatten mit Lichtkante daneben
  const seam = Math.max(1, Math.round(size / 220))
  if (kind === 'steel') {
    ctx.fillStyle = 'rgba(150,168,180,0.18)'
    ctx.fillRect(0, 0, size, seam)
    ctx.fillRect(0, 0, seam, size)
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.fillRect(0, seam, size, seam)
    ctx.fillRect(seam, 0, seam, size)
  } else {
    ctx.fillStyle = 'rgba(40,58,70,0.34)'
    ctx.fillRect(0, 0, size, seam)
    ctx.fillRect(0, 0, seam, size)
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.fillRect(0, seam, size, seam)
    ctx.fillRect(seam, 0, seam, size)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function canvasToTex(canvas, srgb = false) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  return tex
}

/**
 * Lochblech für Schwebestufen: nahtloses Edelstahl-Gitter mit Fase.
 * map / roughness / metalness / normal / alpha.
 */
export function makePerforatedTreadMaps(size = 512, holes = 12) {
  const n = holes
  const cell = size / n
  const holeR = cell * 0.33
  const rim = cell * 0.1
  const height = new Float32Array(size * size)

  const stamp = (cx, cy) => {
    const rMax = holeR + rim + 1.5
    const x0 = Math.max(0, Math.floor(cx - rMax))
    const x1 = Math.min(size - 1, Math.ceil(cx + rMax))
    const y0 = Math.max(0, Math.floor(cy - rMax))
    const y1 = Math.min(size - 1, Math.ceil(cy + rMax))
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy)
        let h = 1
        if (d <= holeR - 0.6) h = 0
        else if (d < holeR + rim) {
          const t = (d - (holeR - 0.6)) / (rim + 0.6)
          h = smooth(Math.min(1, Math.max(0, t)))
        }
        const idx = y * size + x
        if (h < height[idx]) height[idx] = h
      }
    }
  }

  height.fill(1)
  for (let j = 0; j < n; j++) {
    const odd = j & 1
    for (let i = 0; i < n; i++) {
      const cx = ((i + (odd ? 0.5 : 0) + 0.5) % n) * cell
      const cy = (j + 0.5) * cell
      stamp(cx, cy)
      if (odd && i === 0) stamp(cx + size, cy)
    }
  }

  const color = document.createElement('canvas')
  color.width = color.height = size
  const rough = document.createElement('canvas')
  rough.width = rough.height = size
  const metal = document.createElement('canvas')
  metal.width = metal.height = size
  const alpha = document.createElement('canvas')
  alpha.width = alpha.height = size
  const norm = document.createElement('canvas')
  norm.width = norm.height = size

  const cCtx = color.getContext('2d')
  const rCtx = rough.getContext('2d')
  const mCtx = metal.getContext('2d')
  const aCtx = alpha.getContext('2d')
  const nCtx = norm.getContext('2d')
  const cImg = cCtx.createImageData(size, size)
  const rImg = rCtx.createImageData(size, size)
  const mImg = mCtx.createImageData(size, size)
  const aImg = aCtx.createImageData(size, size)
  const nImg = nCtx.createImageData(size, size)

  const at = (x, y) => height[(((y % size) + size) % size) * size + (((x % size) + size) % size)]
  const strength = 2.8

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = height[y * size + x]
      const brush = 0.88 + fbm((x / size) * 18, (y / size) * 3.2, 3) * 0.22
      const steelR = Math.min(255, (210 + brush * 38) * h + 18 * (1 - h))
      const steelG = Math.min(255, (218 + brush * 32) * h + 28 * (1 - h))
      const steelB = Math.min(255, (224 + brush * 28) * h + 36 * (1 - h))
      const i = (y * size + x) * 4
      cImg.data[i] = steelR
      cImg.data[i + 1] = steelG
      cImg.data[i + 2] = steelB
      cImg.data[i + 3] = 255
      const rv = Math.round((0.11 + (1 - h) * 0.72) * 255)
      rImg.data[i] = rImg.data[i + 1] = rImg.data[i + 2] = rv
      rImg.data[i + 3] = 255
      const mv = Math.round(h * 255)
      mImg.data[i] = mImg.data[i + 1] = mImg.data[i + 2] = mv
      mImg.data[i + 3] = 255
      const av = h > 0.12 ? 255 : 0
      aImg.data[i] = aImg.data[i + 1] = aImg.data[i + 2] = av
      aImg.data[i + 3] = 255

      let nx = (at(x - 1, y) - at(x + 1, y)) * strength
      let ny = (at(x, y - 1) - at(x, y + 1)) * strength
      let nz = 1
      const len = Math.hypot(nx, ny, nz) || 1
      nImg.data[i] = ((nx / len) * 0.5 + 0.5) * 255
      nImg.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255
      nImg.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255
      nImg.data[i + 3] = 255
    }
  }
  cCtx.putImageData(cImg, 0, 0)
  rCtx.putImageData(rImg, 0, 0)
  mCtx.putImageData(mImg, 0, 0)
  aCtx.putImageData(aImg, 0, 0)
  nCtx.putImageData(nImg, 0, 0)

  return {
    map: canvasToTex(color, true),
    roughnessMap: canvasToTex(rough),
    metalnessMap: canvasToTex(metal),
    alphaMap: canvasToTex(alpha),
    normalMap: canvasToTex(norm),
  }
}
export function makeGrateTexture(size = 256, slats = 16) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = 16
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, size, 16)
  const pitch = size / slats
  for (let i = 0; i < slats; i++) {
    const x = i * pitch
    const w = pitch * 0.62
    const grad = ctx.createLinearGradient(x, 0, x + w, 0)
    grad.addColorStop(0, '#9aa4aa')
    grad.addColorStop(0.4, '#eef2f4')
    grad.addColorStop(1, '#8b969c')
    ctx.fillStyle = grad
    ctx.fillRect(x + pitch * 0.18, 0, w, 16)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

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
 * Gedeckte, leicht vergraute Thermoholz-Töne statt kräftigem Orange.
 */
export function makeWoodTexture(size = 1024, planks = 10) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const ph = size / planks
  const tones = ['#a98a68', '#9d7e5e', '#b39473', '#94785a', '#ab8d6c', '#a08265', '#b09071', '#98795c']
  for (let p = 0; p < planks; p++) {
    const y = p * ph
    ctx.fillStyle = tones[p % tones.length]
    ctx.fillRect(0, y, size, ph)

    // längs verlaufende Maserung
    for (let g = 0; g < 90; g++) {
      const gy = y + Math.random() * ph
      ctx.strokeStyle = `rgba(58,42,26,${0.03 + Math.random() * 0.05})`
      ctx.lineWidth = 0.5 + Math.random() * 1.2
      ctx.beginPath()
      ctx.moveTo(0, gy)
      ctx.bezierCurveTo(size * 0.3, gy + (Math.random() - 0.5) * 4, size * 0.7, gy + (Math.random() - 0.5) * 4, size, gy)
      ctx.stroke()
    }
    // heller Streifen für leichte Sonnenbleiche
    ctx.fillStyle = `rgba(255,246,230,${0.03 + Math.random() * 0.05})`
    ctx.fillRect(0, y + ph * 0.25, size, ph * 0.3)

    // Fuge zwischen den Dielen
    ctx.fillStyle = 'rgba(26,18,10,0.5)'
    ctx.fillRect(0, y, size, Math.max(1, ph * 0.05))

    // versetzte Dielenstösse
    const joints = 1 + (p % 2)
    for (let j = 0; j < joints; j++) {
      const sx = size * (0.15 + Math.random() * 0.7)
      ctx.fillStyle = 'rgba(26,18,10,0.45)'
      ctx.fillRect(sx, y, Math.max(1, size * 0.003), ph)
    }
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 16
  return tex
}

/** Nahtlos kachelbares Rasen-Albedo: feine Halme, leichte Horste, kein Golf-Neon. */
export function makeGrassTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)
  const P = 8
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * P
      const v = (y / size) * P
      const clump = pFbm(u, v, P, P, 4)
      const fine = pValueNoise(u * 36, v * 36, P * 36, P * 36)
      const bladeA = pValueNoise(u * 22, v * 70, P * 22, P * 70)
      const bladeB = pValueNoise(u * 64, v * 18, P * 64, P * 18)
      const speckle = pValueNoise(u * 80, v * 80, P * 80, P * 80)
      const dry = pFbm(u + 3, v + 1, P, P, 3)
      const mixN = clump * 0.3 + fine * 0.14 + bladeA * 0.28 + bladeB * 0.16 + speckle * 0.12
      const lush = Math.max(0, Math.min(1, (mixN - 0.47) * 1.45 + 0.5))
      const straw = Math.max(0, dry - 0.68) * 1.1
      const gap = Math.max(0, 0.38 - clump) * 0.9
      const r = 70 + lush * 46 + straw * 28 - gap * 6
      const g = 110 + lush * 56 + straw * 8 - gap * 12
      const b = 52 + lush * 20 + straw * 4 - gap * 4
      const idx = (y * size + x) * 4
      img.data[idx] = Math.max(0, Math.min(255, r))
      img.data[idx + 1] = Math.max(0, Math.min(255, g))
      img.data[idx + 2] = Math.max(0, Math.min(255, b))
      img.data[idx + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

/** Halm-Normalmap, periodisch wie das Albedo – nicht die Stein-Normal der Terrasse. */
export function makeGrassNormalTexture(size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)
  const P = 8
  const h = (i, j) => {
    const u = (i / size) * P
    const v = (j / size) * P
    const bladeA = pValueNoise(u * 14, v * 52, P * 14, P * 52)
    const bladeB = pValueNoise(u * 48, v * 11, P * 48, P * 11)
    const clump = pFbm(u, v, P, P, 3)
    return bladeA * 0.62 + bladeB * 0.28 + clump * 0.1
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hl = h((x - 1 + size) % size, y)
      const hr = h((x + 1) % size, y)
      const hd = h(x, (y - 1 + size) % size)
      const hu = h(x, (y + 1) % size)
      let nx = (hl - hr) * 1.35
      let ny = (hd - hu) * 1.35
      let nz = 1
      const len = Math.hypot(nx, ny, nz) || 1
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

function rng(seed) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rgba(c, a = 1) {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`
}

function pick(rnd, list) {
  return list[(rnd() * list.length) | 0]
}

/** Einzelnes Blatt: Tropfenform mit Mittelrippe und leichter Lichtkante. */
function paintLeaf(ctx, x, y, angle, len, color, rnd) {
  const w = len * (0.14 + rnd() * 0.08)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(w, len * 0.22, w, len * 0.62, 0, len)
  ctx.bezierCurveTo(-w, len * 0.62, -w, len * 0.22, 0, 0)
  ctx.fillStyle = rgba(color, 0.94)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0, len * 0.08)
  ctx.bezierCurveTo(w * 0.4, len * 0.28, w * 0.32, len * 0.58, 0, len * 0.88)
  ctx.fillStyle = `rgba(255,255,255,${0.07 + rnd() * 0.08})`
  ctx.fill()
  ctx.strokeStyle = rgba(
    [Math.max(0, color[0] - 28), Math.max(0, color[1] - 28), Math.max(0, color[2] - 22)],
    0.35,
  )
  ctx.lineWidth = Math.max(0.6, len * 0.03)
  ctx.beginPath()
  ctx.moveTo(0, len * 0.06)
  ctx.lineTo(0, len * 0.92)
  ctx.stroke()
  ctx.restore()
}

const FOLIAGE = {
  oak: [
    [42, 98, 32],
    [58, 122, 40],
    [78, 142, 50],
    [36, 82, 28],
    [102, 158, 58],
    [48, 108, 36],
  ],
  maple: [
    [142, 58, 32],
    [176, 82, 38],
    [118, 46, 28],
    [196, 110, 48],
    [92, 38, 24],
    [158, 72, 36],
  ],
  birch: [
    [86, 138, 52],
    [110, 158, 64],
    [70, 118, 44],
    [132, 168, 78],
    [58, 98, 40],
  ],
  pine: [
    [28, 58, 32],
    [40, 74, 40],
    [22, 46, 28],
    [52, 86, 46],
    [34, 64, 36],
  ],
  boxwood: [
    [46, 92, 38],
    [62, 112, 48],
    [38, 78, 32],
    [78, 128, 56],
    [52, 98, 42],
  ],
}

function asFoliageTex(canvas) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.premultiplyAlpha = false
  return tex
}

/**
 * Volle Baumkrone als Alpha-Billboard: hunderte einzelne Blätter, unregelmässiger
 * Umriss, dunkler Kern. Wird auf gekreuzte Ebenen gelegt – so liest sich der Baum
 * aus der Distanz wie Laub, nicht wie eine Kugel.
 */
export function makeCanopyTexture(size = 768, kind = 'oak', seed = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const rnd = rng(seed * 9973 + kind.length * 17)
  const palette = FOLIAGE[kind] || FOLIAGE.oak
  const cx = size * 0.5
  const cy = size * 0.52

  if (kind === 'pine') {
    const layers = 8
    for (let L = 0; L < layers; L++) {
      const t = L / (layers - 1)
      const y0 = size * 0.08 + t * size * 0.78
      const half = size * (0.07 + t * 0.4)
      const h = size * (0.16 + (1 - t) * 0.04)
      ctx.fillStyle = rgba(palette[2], 0.55)
      ctx.beginPath()
      ctx.moveTo(cx, y0 - 4)
      ctx.lineTo(cx + half, y0 + h)
      ctx.lineTo(cx - half, y0 + h)
      ctx.closePath()
      ctx.fill()
      for (let n = 0; n < 180; n++) {
        const u = rnd()
        const v = rnd()
        const x = cx + (u - 0.5) * 2 * half * v
        const y = y0 + v * h
        paintLeaf(ctx, x, y, -0.15 + rnd() * 0.3 + (u - 0.5) * 0.8, 8 + rnd() * 16, pick(rnd, palette), rnd)
      }
    }
    return asFoliageTex(canvas)
  }

  const rx = size * (kind === 'birch' ? 0.36 : 0.42)
  const ry = size * (kind === 'maple' ? 0.38 : 0.42)
  ctx.fillStyle = rgba(palette[3], 0.82)
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx * 0.86, ry * 0.82, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = rgba(palette[0], 0.55)
  ctx.beginPath()
  ctx.ellipse(cx, cy + ry * 0.08, rx * 0.55, ry * 0.5, 0, 0, Math.PI * 2)
  ctx.fill()

  const count = 1400
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2
    const r = Math.pow(rnd(), 0.5)
    const wobble = 0.88 + fbm(Math.cos(a) * 2 + seed, Math.sin(a) * 2, 3) * 0.22
    const x = cx + Math.cos(a) * rx * r * wobble
    const y = cy + Math.sin(a) * ry * r * wobble * 0.95
    const len = (kind === 'maple' ? 12 : 10) + rnd() * 16
    const angle = a + (rnd() - 0.5) * 1.2 + 0.4
    paintLeaf(ctx, x, y, angle, len, pick(rnd, palette), rnd)
  }
  return asFoliageTex(canvas)
}

/**
 * Kleine Blattgruppe für Sträucher und Pflanzkübel – mehrere Karten ergeben
 * ein volumetrisches Gebüsch statt einer Kugel.
 */
export function makeFoliageCardTexture(size = 256, kind = 'boxwood') {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const rnd = rng(4200 + kind.length * 31)
  const palette = FOLIAGE[kind] || FOLIAGE.boxwood
  const cx = size * 0.5
  paintLeaf(ctx, cx, size * 0.9, -Math.PI, size * 0.78, palette[1], rnd)
  paintLeaf(ctx, cx - size * 0.08, size * 0.72, -Math.PI + 0.45, size * 0.5, palette[0], rnd)
  paintLeaf(ctx, cx + size * 0.1, size * 0.7, -Math.PI - 0.5, size * 0.46, palette[2], rnd)
  return asFoliageTex(canvas)
}

/** Nahtlos kachelbares Heckenlaub. */
export function makeHedgeFoliageTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const rnd = rng(8801)
  const palette = FOLIAGE.boxwood
  ctx.fillStyle = rgba([32, 62, 28], 1)
  ctx.fillRect(0, 0, size, size)
  const paintTiled = (x, y, angle, len, color) => {
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        paintLeaf(ctx, x + ox * size, y + oy * size, angle, len, color, rnd)
      }
    }
  }
  for (let i = 0; i < 420; i++) {
    paintTiled(rnd() * size, rnd() * size, rnd() * Math.PI * 2, 10 + rnd() * 18, pick(rnd, palette))
  }
  const tex = asFoliageTex(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Rinde: vertikale Risse, Mooseinschlag, grobe Schuppen. */
export function makeBarkTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ridges = pFbm((x / size) * 14, (y / size) * 3.2, 14, 3.2, 4)
      const crack = Math.pow(pValueNoise((x / size) * 28, (y / size) * 6, 28, 6), 3)
      const moss = pFbm((x / size) * 6 + 4, (y / size) * 6, 6, 6, 3)
      const v = 0.18 + ridges * 0.38 - crack * 0.28
      const idx = (y * size + x) * 4
      img.data[idx] = (v * 110 + moss * 12) | 0
      img.data[idx + 1] = (v * 82 + moss * 28) | 0
      img.data[idx + 2] = (v * 58 + moss * 8) | 0
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

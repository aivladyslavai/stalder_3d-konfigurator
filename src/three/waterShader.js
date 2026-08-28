import * as THREE from 'three'

/**
 * Gerstner-Wellen + Kapillar-Rauschen + Gegenstrom-Wake für die Pool-Oberfläche.
 * Wird in MeshTransmissionMaterial.onBeforeCompile eingehängt.
 */

export const WATER_GLSL = /* glsl */ `
// WATER_SHADER_BEGIN
uniform float uTime;
uniform vec2 uHalf;
uniform float uCornerR;
uniform float uJetOn;
uniform vec2 uJetOrigin;
uniform vec2 uJetDir;
varying vec2 vPoolXZ;
varying vec3 vWaveN;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm3(vec2 p) {
  return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.07) + 0.125 * vnoise(p * 4.19);
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void gerstner(
  vec2 xz, vec2 dir, float amp, float lambda, float steep, float phase,
  inout vec3 disp, inout vec3 nrm
) {
  dir = normalize(dir);
  float k = 6.28318530718 / lambda;
  float omega = sqrt(9.81 * k);
  float q = steep;
  float f = k * dot(dir, xz) - omega * uTime + phase;
  float s = sin(f);
  float c = cos(f);
  float wa = k * amp;
  disp.x += q * amp * dir.x * c;
  disp.z += q * amp * dir.y * c;
  disp.y += amp * s;
  nrm.x -= dir.x * wa * c;
  nrm.z -= dir.y * wa * c;
  nrm.y -= q * wa * s;
}

void jetEval(vec2 xz, out float env, out float foam, out vec3 disp, out vec3 nPerturb) {
  env = 0.0;
  foam = 0.0;
  disp = vec3(0.0);
  nPerturb = vec3(0.0);
  if (uJetOn < 0.001) return;

  vec2 dir = normalize(uJetDir);
  vec2 lat = vec2(-dir.y, dir.x);
  vec2 toP = xz - uJetOrigin;
  float along = dot(toP, dir);
  float across = dot(toP, lat);

  float pump = 0.92 + 0.08 * sin(uTime * 5.2);
  float width = mix(0.16, 0.46, pow(clamp(along / 2.8, 0.0, 1.0), 0.72));
  float radial = exp(-(across * across) / max(2.0 * width * width, 1e-4));
  float stream = smoothstep(-0.04, 0.18, along) * exp(-max(along, 0.0) * 0.28);
  env = radial * stream * pump;

  float phaseFast = along * 14.0 - uTime * 8.4;
  float phaseMid = along * 7.2 - uTime * 4.6;
  float phaseSlow = along * 3.4 - uTime * 2.2;
  float travel = sin(phaseFast + across * 3.2) * 0.42;
  travel += sin(phaseMid + across * 6.5) * 0.3;
  travel += sin(phaseSlow + across * 2.4) * 0.22;

  vec2 adv = vec2(along * 4.2 - uTime * 3.1, across * 11.0);
  float turb = fbm3(adv) - 0.44;
  turb += 0.36 * (fbm3(adv * 2.05 + vec2(uTime * 0.22, 5.0)) - 0.5);
  float near = exp(-max(along, 0.0) * 2.8) * exp(-across * across * 28.0) * smoothstep(-0.05, 0.14, along);

  disp.y = env * (travel * 0.018 + turb * 0.012);
  disp.y += near * max(turb, 0.0) * 0.01;
  disp.xz = dir * env * (0.012 + travel * 0.003);

  nPerturb.xz -= dir * env * travel * 0.42;
  nPerturb.xz -= lat * (across / max(width, 0.08)) * env * 0.28;
  nPerturb.xz += vec2(turb, fbm3(adv + 4.2) - 0.5) * (near * 0.22 + env * 0.12);

  foam = clamp(near * 0.1 + env * 0.05 * smoothstep(0.2, 0.7, abs(travel)), 0.0, 0.28);
}

vec3 waterFlowNormal(vec2 xz) {
  if (uJetOn < 0.001) return vec3(0.0, 1.0, 0.0);
  vec2 dir = normalize(uJetDir);
  vec2 lat = vec2(-dir.y, dir.x);
  vec2 toP = xz - uJetOrigin;
  vec2 p = vec2(dot(toP, dir) * 10.0 - uTime * 4.2, dot(toP, lat) * 24.0);
  float e = 0.04;
  float ha = (fbm3(p - vec2(e, 0.0)) - fbm3(p + vec2(e, 0.0))) / (2.0 * e);
  float hb = (fbm3(p - vec2(0.0, e)) - fbm3(p + vec2(0.0, e))) / (2.0 * e);
  vec2 g = dir * ha + lat * hb;
  return normalize(vec3(g.x, 1.0, g.y));
}

vec3 waterDisplace(vec2 xz, out vec3 normal) {
  vec3 disp = vec3(0.0);
  vec3 nrm = vec3(0.0, 1.0, 0.0);

  gerstner(xz, vec2(1.00, 0.18), 0.0125, 2.45, 0.16, 0.40, disp, nrm);
  gerstner(xz, vec2(0.72, 0.69), 0.0078, 1.48, 0.18, 1.70, disp, nrm);
  gerstner(xz, vec2(-0.28, 1.00), 0.0056, 0.92, 0.17, 2.90, disp, nrm);
  gerstner(xz, vec2(0.94, -0.38), 0.0040, 0.56, 0.20, 0.15, disp, nrm);
  gerstner(xz, vec2(-0.62, 0.78), 0.0026, 0.36, 0.22, 4.20, disp, nrm);
  gerstner(xz, vec2(0.48, 0.88), 0.0066, 1.98, 0.14, 3.60, disp, nrm);
  gerstner(xz, vec2(-0.88, 0.44), 0.0018, 0.24, 0.25, 5.10, disp, nrm);

  float inside = max(0.0, -sdRoundBox(xz, uHalf, uCornerR));
  float meniscus = exp(-inside * 52.0) * 0.008;
  float edgeRipple = sin(inside * 62.0 - uTime * 1.75) * exp(-inside * 15.0) * 0.0018;
  disp.y += meniscus + edgeRipple;

  float cap = (fbm3(xz * 12.0 + vec2(uTime * 0.1, -uTime * 0.065)) - 0.5) * 0.00135;
  cap += (fbm3(xz * 31.0 + vec2(-uTime * 0.16, uTime * 0.11)) - 0.5) * 0.0005;
  disp.y += cap;

  float env;
  float foam;
  vec3 jdisp;
  vec3 jn;
  jetEval(xz, env, foam, jdisp, jn);
  disp += jdisp;
  nrm.xz += jn.xz;

  normal = normalize(nrm);
  if (normal.y < 0.2) normal = vec3(0.0, 1.0, 0.0);
  return disp;
}

vec3 waterMicroNormal(vec2 xz) {
  float e = 0.035;
  vec2 p = xz * 7.2 + vec2(uTime * 0.07, -uTime * 0.048);
  float hx = (fbm3(p - vec2(e, 0.0)) - fbm3(p + vec2(e, 0.0))) / (2.0 * e);
  float hz = (fbm3(p - vec2(0.0, e)) - fbm3(p + vec2(0.0, e))) / (2.0 * e);
  vec3 n1 = normalize(vec3(hx, 1.0, hz));
  vec2 p2 = xz * 19.5 + vec2(-uTime * 0.13, uTime * 0.09);
  float hx2 = (fbm3(p2 - vec2(e, 0.0)) - fbm3(p2 + vec2(e, 0.0))) / (2.0 * e);
  float hz2 = (fbm3(p2 - vec2(0.0, e)) - fbm3(p2 + vec2(0.0, e))) / (2.0 * e);
  vec3 n2 = normalize(vec3(hx2, 1.0, hz2));
  return normalize(n1 * 0.78 + n2 * 0.22);
}
// WATER_SHADER_END
`

const BLOCK_RE = /\/\/ WATER_SHADER_BEGIN[\s\S]*?\/\/ WATER_SHADER_END\n?/

function prependWaterGLSL(src) {
  return WATER_GLSL + src.replace(BLOCK_RE, '')
}

export function injectWaterWaves(shader) {
  shader.uniforms.uTime = shader.uniforms.uTime || { value: 0 }
  shader.uniforms.uHalf = shader.uniforms.uHalf || { value: new THREE.Vector2(2.5, 1.25) }
  shader.uniforms.uCornerR = shader.uniforms.uCornerR || { value: 0 }
  shader.uniforms.uJetOn = shader.uniforms.uJetOn || { value: 0 }
  shader.uniforms.uJetOrigin = shader.uniforms.uJetOrigin || { value: new THREE.Vector2() }
  shader.uniforms.uJetDir = shader.uniforms.uJetDir || { value: new THREE.Vector2(1, 0) }

  shader.vertexShader = prependWaterGLSL(shader.vertexShader)
  if (!shader.vertexShader.includes('waveOff = waterDisplace')) {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      /* glsl */ `
      #include <beginnormal_vertex>
      vPoolXZ = position.xz;
      vec3 waveN;
      vec3 waveOff = waterDisplace(position.xz, waveN);
      objectNormal = waveN;
      vWaveN = waveN;
      `,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      /* glsl */ `
      #include <begin_vertex>
      transformed += waveOff;
      `,
    )
  }

  shader.fragmentShader = prependWaterGLSL(shader.fragmentShader)
  if (!shader.fragmentShader.includes('jetFoamAmt')) {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      /* glsl */ `
      #include <normal_fragment_maps>
      {
        float jetEnv;
        float jetFoamAmt;
        vec3 jetDisp;
        vec3 jetN;
        jetEval(vPoolXZ, jetEnv, jetFoamAmt, jetDisp, jetN);
        vec3 micro = waterMicroNormal(vPoolXZ);
        vec3 flowN = waterFlowNormal(vPoolXZ);
        vec3 nWorld = inverseTransformDirection(normal, viewMatrix);
        nWorld = normalize(mix(nWorld, micro, 0.26 + jetEnv * 0.12));
        nWorld = normalize(mix(nWorld, flowN, jetEnv * 0.18));
        nWorld = normalize(nWorld + vec3(jetN.xz * 0.22, 0.0));
        float inside = max(0.0, -sdRoundBox(vPoolXZ, uHalf, uCornerR));
        vec2 away = normalize(vPoolXZ + vec2(1e-5));
        nWorld = normalize(mix(nWorld, normalize(vec3(-away.x, 1.8, -away.y)), exp(-inside * 48.0) * 0.14));
        normal = normalize(transformDirection(nWorld, viewMatrix));
        roughnessFactor = mix(roughnessFactor, 0.08, jetFoamAmt * 0.22);
      }
      `,
    )
  }
}

/** Mit GLSL-Gerstner identisch – für Schwimmkörper auf der Oberfläche. */
const GERSTNER = [
  [1.0, 0.18, 0.0125, 2.45, 0.16, 0.4],
  [0.72, 0.69, 0.0078, 1.48, 0.18, 1.7],
  [-0.28, 1.0, 0.0056, 0.92, 0.17, 2.9],
  [0.94, -0.38, 0.004, 0.56, 0.2, 0.15],
  [-0.62, 0.78, 0.0026, 0.36, 0.22, 4.2],
  [0.48, 0.88, 0.0066, 1.98, 0.14, 3.6],
  [-0.88, 0.44, 0.0018, 0.24, 0.25, 5.1],
]

function fract(v) {
  return v - Math.floor(v)
}

function hash12(x, y) {
  let px = fract(x * 0.1031)
  let py = fract(y * 0.1031)
  let pz = fract(x * 0.1031)
  const d = px * (py + 33.33) + py * (pz + 33.33) + pz * (px + 33.33)
  px += d
  py += d
  pz += d
  return fract((px + py) * pz)
}

function vnoise(x, y) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  let fx = x - ix
  let fy = y - iy
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  const a = hash12(ix, iy)
  const b = hash12(ix + 1, iy)
  const c = hash12(ix, iy + 1)
  const d = hash12(ix + 1, iy + 1)
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy
}

function fbm3(x, y) {
  return 0.5 * vnoise(x, y) + 0.25 * vnoise(x * 2.07, y * 2.07) + 0.125 * vnoise(x * 4.19, y * 4.19)
}

function gerstnerJS(x, z, dirx, dirz, amp, lambda, steep, phase, t, disp, nrm) {
  const len = Math.hypot(dirx, dirz) || 1
  dirx /= len
  dirz /= len
  const k = (Math.PI * 2) / lambda
  const omega = Math.sqrt(9.81 * k)
  const f = k * (dirx * x + dirz * z) - omega * t + phase
  const s = Math.sin(f)
  const c = Math.cos(f)
  const wa = k * amp
  disp.x += steep * amp * dirx * c
  disp.z += steep * amp * dirz * c
  disp.y += amp * s
  nrm.x -= dirx * wa * c
  nrm.z -= dirz * wa * c
  nrm.y -= steep * wa * s
}

function jetDispAt(x, z, t, jet) {
  const out = { x: 0, y: 0, z: 0, nx: 0, nz: 0 }
  if (!jet) return out
  const dl = Math.hypot(jet.dir[0], jet.dir[1]) || 1
  const dirx = jet.dir[0] / dl
  const dirz = jet.dir[1] / dl
  const latx = -dirz
  const latz = dirx
  const ox = x - jet.origin[0]
  const oz = z - jet.origin[1]
  const along = ox * dirx + oz * dirz
  const across = ox * latx + oz * latz
  const pump = 0.92 + 0.08 * Math.sin(t * 5.2)
  const width = 0.16 + (0.46 - 0.16) * Math.pow(Math.min(1, Math.max(0, along / 2.8)), 0.72)
  const radial = Math.exp(-(across * across) / Math.max(2 * width * width, 1e-4))
  const along01 = along < -0.04 ? 0 : along > 0.18 ? 1 : (along + 0.04) / 0.22
  const env = radial * along01 * Math.exp(-Math.max(along, 0) * 0.28) * pump
  const travel =
    Math.sin(along * 14 - t * 8.4 + across * 3.2) * 0.42 +
    Math.sin(along * 7.2 - t * 4.6 + across * 6.5) * 0.3 +
    Math.sin(along * 3.4 - t * 2.2 + across * 2.4) * 0.22
  const advx = along * 4.2 - t * 3.1
  const advz = across * 11
  let turb = fbm3(advx, advz) - 0.44
  turb += 0.36 * (fbm3(advx * 2.05 + t * 0.22, advz * 2.05 + 5) - 0.5)
  const near01 = along < -0.05 ? 0 : along > 0.14 ? 1 : (along + 0.05) / 0.19
  const near = Math.exp(-Math.max(along, 0) * 2.8) * Math.exp(-across * across * 28) * near01
  out.y = env * (travel * 0.018 + turb * 0.012) + near * Math.max(turb, 0) * 0.01
  out.x = dirx * env * (0.012 + travel * 0.003)
  out.z = dirz * env * (0.012 + travel * 0.003)
  out.nx = -(dirx * env * travel * 0.42 + latx * (across / Math.max(width, 0.08)) * env * 0.28)
  out.nz = -(dirz * env * travel * 0.42 + latz * (across / Math.max(width, 0.08)) * env * 0.28)
  return out
}

/**
 * Wasserhöhe und -normale am Punkt (x, z) – gleiche Gerstner wie der Shader.
 * jet: { origin:[x,z], dir:[x,z] } | null
 */
export function sampleWaterSurface(x, z, t, jet = null) {
  const disp = { x: 0, y: 0, z: 0 }
  const nrm = { x: 0, y: 1, z: 0 }
  for (const w of GERSTNER) gerstnerJS(x, z, w[0], w[1], w[2], w[3], w[4], w[5], t, disp, nrm)
  disp.y += (fbm3(x * 12 + t * 0.1, z * 12 - t * 0.065) - 0.5) * 0.00135
  disp.y += (fbm3(x * 31 - t * 0.16, z * 31 + t * 0.11) - 0.5) * 0.0005
  const j = jetDispAt(x, z, t, jet)
  disp.x += j.x
  disp.y += j.y
  disp.z += j.z
  nrm.x += j.nx
  nrm.z += j.nz
  let nx = nrm.x
  let ny = nrm.y
  let nz = nrm.z
  const nl = Math.hypot(nx, ny, nz) || 1
  nx /= nl
  ny /= nl
  nz /= nl
  if (ny < 0.2) {
    nx = 0
    ny = 1
    nz = 0
  }
  return { y: disp.y, dx: disp.x, dz: disp.z, nx, ny, nz }
}

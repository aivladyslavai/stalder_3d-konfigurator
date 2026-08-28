import * as THREE from 'three'

/**
 * Gerstner-Wellen + Kapillar-Rauschen für die Pool-Oberfläche.
 * Wird in MeshTransmissionMaterial.onBeforeCompile eingehängt.
 */

export const WATER_GLSL = /* glsl */ `
uniform float uTime;
uniform vec2 uHalf;
uniform float uCornerR;
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

vec3 waterDisplace(vec2 xz, out vec3 normal) {
  vec3 disp = vec3(0.0);
  vec3 nrm = vec3(0.0, 1.0, 0.0);

  gerstner(xz, vec2(1.00, 0.18), 0.0085, 2.45, 0.16, 0.40, disp, nrm);
  gerstner(xz, vec2(0.72, 0.69), 0.0054, 1.48, 0.18, 1.70, disp, nrm);
  gerstner(xz, vec2(-0.28, 1.00), 0.0041, 0.92, 0.17, 2.90, disp, nrm);
  gerstner(xz, vec2(0.94, -0.38), 0.0029, 0.56, 0.20, 0.15, disp, nrm);
  gerstner(xz, vec2(-0.62, 0.78), 0.0019, 0.36, 0.22, 4.20, disp, nrm);
  gerstner(xz, vec2(0.48, 0.88), 0.0046, 1.98, 0.14, 3.60, disp, nrm);

  float inside = max(0.0, -sdRoundBox(xz, uHalf, uCornerR));
  float meniscus = exp(-inside * 52.0) * 0.008;
  float edgeRipple = sin(inside * 62.0 - uTime * 1.45) * exp(-inside * 15.0) * 0.0016;
  disp.y += meniscus + edgeRipple;

  float cap = (fbm3(xz * 12.0 + vec2(uTime * 0.07, -uTime * 0.045)) - 0.5) * 0.0012;
  cap += (fbm3(xz * 31.0 + vec2(-uTime * 0.11, uTime * 0.08)) - 0.5) * 0.00045;
  disp.y += cap;

  normal = normalize(nrm);
  if (normal.y < 0.2) normal = vec3(0.0, 1.0, 0.0);
  return disp;
}

vec3 waterMicroNormal(vec2 xz) {
  float e = 0.035;
  vec2 p = xz * 7.2 + vec2(uTime * 0.048, -uTime * 0.033);
  float hx = (fbm3(p - vec2(e, 0.0)) - fbm3(p + vec2(e, 0.0))) / (2.0 * e);
  float hz = (fbm3(p - vec2(0.0, e)) - fbm3(p + vec2(0.0, e))) / (2.0 * e);
  vec3 n1 = normalize(vec3(hx, 1.0, hz));
  vec2 p2 = xz * 19.5 + vec2(-uTime * 0.091, uTime * 0.062);
  float hx2 = (fbm3(p2 - vec2(e, 0.0)) - fbm3(p2 + vec2(e, 0.0))) / (2.0 * e);
  float hz2 = (fbm3(p2 - vec2(0.0, e)) - fbm3(p2 + vec2(0.0, e))) / (2.0 * e);
  vec3 n2 = normalize(vec3(hx2, 1.0, hz2));
  return normalize(n1 * 0.78 + n2 * 0.22);
}
`

export function injectWaterWaves(shader) {
  shader.uniforms.uTime = shader.uniforms.uTime || { value: 0 }
  shader.uniforms.uHalf = shader.uniforms.uHalf || { value: new THREE.Vector2(2.5, 1.25) }
  shader.uniforms.uCornerR = shader.uniforms.uCornerR || { value: 0 }

  if (!shader.vertexShader.includes('waterDisplace')) {
    shader.vertexShader = WATER_GLSL + shader.vertexShader
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

  if (!shader.fragmentShader.includes('waterMicroNormal')) {
    shader.fragmentShader = WATER_GLSL + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      /* glsl */ `
      #include <normal_fragment_maps>
      {
        vec3 micro = waterMicroNormal(vPoolXZ);
        vec3 nWorld = inverseTransformDirection(normal, viewMatrix);
        nWorld = normalize(mix(nWorld, micro, 0.24));
        float inside = max(0.0, -sdRoundBox(vPoolXZ, uHalf, uCornerR));
        vec2 away = normalize(vPoolXZ + vec2(1e-5));
        nWorld = normalize(mix(nWorld, normalize(vec3(-away.x, 1.8, -away.y)), exp(-inside * 48.0) * 0.14));
        normal = normalize(transformDirection(nWorld, viewMatrix));
      }
      `,
    )
  }
}

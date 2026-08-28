import React, { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { prepareGltf } from '../three/prepareGltf'

function visibleBox(root) {
  const box = new THREE.Box3()
  const tmp = new THREE.Box3()
  let found = false
  root.updateMatrixWorld(true)
  root.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.geometry) return
    tmp.setFromObject(o)
    if (!found) {
      box.copy(tmp)
      found = true
    } else {
      box.union(tmp)
    }
  })
  return found ? box : new THREE.Box3().setFromObject(root)
}

/**
 * Loft als Haus hinter der Terrasse. Nach dem Fit wird die sichtbare Unterkante
 * auf den Sockel gesetzt — sonst hängt der Holzrahmen in der Luft.
 */
function House() {
  const { scene } = useGLTF('/models/loft.glb')
  const object = useMemo(
    () =>
      prepareGltf(scene, {
        xz: 13.2,
        hideDomes: true,
        hideFloors: true,
        merge: true,
        sink: 0,
        receiveShadow: true,
      }),
    [scene],
  )

  useLayoutEffect(() => {
    const box = visibleBox(object)
    const targetY = 0.02
    object.position.y += targetY - box.min.y - 0.55
  }, [object])

  return (
    <group position={[-1.2, 0, -10.2]}>
      <mesh position={[0.2, -0.06, 0.3]} receiveShadow>
        <boxGeometry args={[13.6, 0.3, 10.8]} />
        <meshStandardMaterial color="#6f675c" roughness={0.95} metalness={0} envMapIntensity={0.15} />
      </mesh>
      <primitive object={object} />
    </group>
  )
}

export default React.memo(House)

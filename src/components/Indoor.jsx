import React from 'react'
import { GltfProp } from './GltfProp'

/**
 * Innenraum: Loft-GLB als Pavillon um das Becken. Der Boden des Modells wird
 * ausgeblendet, damit Terrasse und Wasser sichtbar bleiben.
 *
 * Props: { poolLength, poolWidth }
 */
function Indoor({ poolLength, poolWidth }) {
  const rz = poolWidth / 2 + 4
  const H = 3.6

  return (
    <group>
      <GltfProp
        url="/models/loft.glb"
        xz={Math.max(18, poolLength + 12)}
        sink={0.08}
        hideFloors
        hideDomes
        clearX={poolLength / 2 + 0.85}
        clearZ={poolWidth / 2 + 0.85}
        receiveShadow
      />

      {[-poolLength / 3, 0, poolLength / 3].map((x, i) => (
        <group key={`spot${i}`} position={[x, H - 0.12, poolWidth / 2 + 1.2]}>
          <mesh>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} />
            <meshBasicMaterial color="#fff1d8" toneMapped={false} />
          </mesh>
          <pointLight position={[0, -0.3, 0]} color="#ffe7c4" intensity={6} distance={9} decay={2} />
        </group>
      ))}
      <pointLight position={[0, H - 0.5, -rz + 1]} color="#fff0d8" intensity={4} distance={14} />
    </group>
  )
}

export default React.memo(Indoor)

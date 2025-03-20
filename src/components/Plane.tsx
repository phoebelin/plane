import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, Group } from 'three'

export function Plane() {
  const propellerRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (propellerRef.current) {
      propellerRef.current.rotation.z += delta * 10
    }
  })

  return (
    <>
      {/* Fuselage - octagonal prism for more angular shape */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 2, 8]} />
        <meshStandardMaterial color="#4a5940" />
      </mesh>

      {/* Cockpit - small cube on top center of fuselage */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.4, 0.2, 0.6]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Wings - with proper placement crossing through fuselage */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[4, 0.1, 0.8]} />
        <meshStandardMaterial color="#4a5940" />
      </mesh>

      {/* Tail Wing - horizontal stabilizer */}
      <mesh position={[0, 0, -1]}>
        <boxGeometry args={[1.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#4a5940" />
      </mesh>

      {/* Vertical Stabilizer */}
      <mesh position={[0, 0.5, -1]}>
        <boxGeometry args={[0.1, 1, 0.5]} />
        <meshStandardMaterial color="#4a5940" />
      </mesh>

      {/* Engine - small cylinder at front */}
      <mesh position={[0, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.3, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Propeller */}
      <group position={[0, 0, 1.2]} ref={propellerRef}>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[0.1, 1, 0.05]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.1, 1, 0.05]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
      </group>

      {/* Landing Gear - front */}
      <mesh position={[0, -0.4, 0.7]}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Landing Gear - wheels */}
      <mesh position={[0, -0.6, 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Landing Gear - sides under wings */}
      <mesh position={[0.8, -0.4, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      <mesh position={[-0.8, -0.4, 0]}>
        <boxGeometry args={[0.1, 0.3, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Landing Gear - wheel sides */}
      <mesh position={[0.8, -0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      <mesh position={[-0.8, -0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </>
  )
} 
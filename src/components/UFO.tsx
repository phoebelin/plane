import React from 'react';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

type UFOProps = {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function UFO({ position, rotation = [0, 0, 0], scale = 1 }: UFOProps) {
  const ufoRef = useRef<Group>(null);
  
  // Hovering effect - subtle up and down motion
  useFrame((_, delta) => {
    if (ufoRef.current) {
      // Hovering motion
      ufoRef.current.position.y += Math.sin(Date.now() * 0.001) * 0.01;
      
      // Subtle rotation
      ufoRef.current.rotation.y += delta * 0.2;
    }
  });
  
  return (
    <group ref={ufoRef} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {/* Main UFO Body - flattened dome for top */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[1, 24, 24, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#9c9c9c" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Main disc/saucer body */}
      <mesh castShadow>
        <cylinderGeometry args={[2, 2.5, 0.3, 32]} />
        <meshStandardMaterial color="#b8b8b8" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Bottom dome/protrusion */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <sphereGeometry args={[1, 24, 24, 0, Math.PI * 2, Math.PI * 2/3, Math.PI / 3]} />
        <meshStandardMaterial color="#9c9c9c" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Ring around the middle */}
      <mesh position={[0, 0, 0]} castShadow>
        <torusGeometry args={[2.3, 0.15, 16, 32]} />
        <meshStandardMaterial color="#787878" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Bottom glow effect */}
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI/2, 0, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#88ccff" transparent opacity={0.7} />
      </mesh>
      
      {/* Portholes/windows around the middle */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh 
          key={`porthole-${i}`} 
          position={[
            Math.sin(i * Math.PI / 4) * 2, 
            0, 
            Math.cos(i * Math.PI / 4) * 2
          ]}
          rotation={[Math.PI/2, 0, i * Math.PI / 4]}
        >
          <circleGeometry args={[0.15, 12]} />
          <meshBasicMaterial color="#88ffff" />
        </mesh>
      ))}
    </group>
  );
} 
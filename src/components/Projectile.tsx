import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group } from "three";

type ProjectileProps = {
  position: [number, number, number];
  direction: Vector3;
  speed?: number;
  onExpired?: () => void;
};

export function Projectile({ 
  position, 
  direction, 
  speed = 70, 
  onExpired 
}: ProjectileProps) {
  const projectileRef = useRef<Group>(null);
  const lifetime = useRef(0);
  const maxLifetime = 3; // 3 seconds before disappearing
  
  useFrame((_, delta) => {
    if (projectileRef.current) {
      // Move projectile forward
      const movement = direction.clone().multiplyScalar(speed * delta);
      projectileRef.current.position.add(movement);
      
      // Add lifetime tracker
      lifetime.current += delta;
      if (lifetime.current > maxLifetime && onExpired) {
        onExpired();
      }
    }
  });
  
  return (
    <group ref={projectileRef} position={position}>
      {/* Main projectile body */}
      <mesh castShadow>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#ff5500" emissive="#ff3300" emissiveIntensity={2} />
      </mesh>
      
      {/* Glowing trail effect */}
      <mesh scale={[1, 1, 3]} position={[0, 0, 0.5]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} />
      </mesh>
    </group>
  );
} 
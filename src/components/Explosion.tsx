import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color } from 'three';

type ExplosionProps = {
  position: [number, number, number];
  onComplete?: () => void;
  scale?: number;
};

export function Explosion({ position, onComplete, scale = 1 }: ExplosionProps) {
  const explosionRef = useRef<any>(null);
  const [particles, setParticles] = useState(() => {
    // Generate random particles for the explosion - start particles further out
    return Array.from({ length: 20 }).map(() => ({
      position: new Vector3(
        (Math.random() - 0.5) * 2.0, // Increased from 0.5 for immediate visual effect
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0
      ),
      velocity: new Vector3(
        (Math.random() - 0.5) * 10, // Doubled from 5 for faster movement
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ),
      size: Math.random() * 0.6 + 0.2, // Larger particles for more visibility
      color: new Color().setHSL(
        Math.random() * 0.1 + 0.05, // orange-red hue
        0.8, // saturation
        0.7 + Math.random() * 0.3 // increased lightness for more visibility
      ),
    }));
  });
  
  const lifetime = useRef(0);
  const maxLifetime = 0.6; // reduced from 1.5 seconds for faster completion
  
  // Start with maximum intensity
  useEffect(() => {
    if (explosionRef.current) {
      explosionRef.current.intensity = 5; // Higher initial intensity
    }
    
    // Call onComplete after timeout as a fallback
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, maxLifetime * 1000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  useFrame((_, delta) => {
    lifetime.current += delta;
    
    // Remove explosion after maxLifetime
    if (lifetime.current >= maxLifetime) {
      if (onComplete) onComplete();
      return;
    }
    
    // Update particles
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        // Update position based on velocity - faster movement
        particle.position.add(particle.velocity.clone().multiplyScalar(delta * 1.5));
        
        // Apply "gravity" - slow down over time
        particle.velocity.multiplyScalar(0.9); // Faster slowdown
        
        return particle;
      })
    );
    
    // Pulse the explosion light
    if (explosionRef.current) {
      const pulseIntensity = 5 * (1 - lifetime.current / maxLifetime);
      explosionRef.current.intensity = pulseIntensity;
    }
  });
  
  return (
    <group 
      position={position} 
      scale={[scale, scale, scale]}
      matrixAutoUpdate={true}
      renderOrder={1000}
    >
      {/* Explosion light */}
      <pointLight 
        ref={explosionRef}
        color="#ff5500" 
        intensity={5} 
        distance={15}
        decay={1}
        castShadow={false}
      />
      
      {/* Explosion particles */}
      {particles.map((particle, i) => (
        <mesh 
          key={`particle-${i}`} 
          position={particle.position}
          matrixAutoUpdate={true}
          renderOrder={1001}
        >
          <sphereGeometry args={[particle.size, 8, 8]} />
          <meshBasicMaterial color={particle.color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
} 
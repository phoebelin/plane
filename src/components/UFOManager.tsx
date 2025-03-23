import React, { useState, useRef, useEffect, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { UFO } from './UFO';
import { GameContext } from './GameManager';
import { Explosion } from './Explosion';

// UFO movement parameters
const FOLLOW_SPEED = 0.08; // How quickly UFOs follow the player
const RANDOM_FACTOR = 0.4; // How much randomness to add to movement
const MINIMUM_UFO_DISTANCE = 8; // Minimum distance UFOs maintain from each other
const UPDATE_FREQUENCY = 0.3; // How often (in seconds) to recalculate random direction
const ALTITUDE_VARIATION = 10; // How much height variation to allow
const MIN_ALTITUDE = 30; // Minimum flight altitude
const SPAWN_DISTANCE = 200; // Distance from player to spawn new UFOs

type UFOData = {
  id: string;
  position: Vector3;
  scale: number;
  targetPosition: Vector3;
  lastUpdateTime: number;
  randomDirection: Vector3;
};

type ExplosionData = {
  id: string;
  position: [number, number, number];
  scale: number;
};

export function UFOManager() {
  const { gameState, registerUFO, unregisterUFO, reportUFOHit } = useContext(GameContext);
  const [ufos, setUfos] = useState<UFOData[]>([]);
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);
  const playerPositionRef = useRef(new Vector3(0, 30, 0));
  const timeSinceLastSpawn = useRef(0);
  const ufoCount = useRef(10); // Initial UFO count

  // Set up initial UFOs
  useEffect(() => {
    // Create global UFO registry for collision detection
    if (typeof window !== 'undefined') {
      (window as any).UFO_REGISTRY = new Map();
      // Set up global handler for UFO hits
      (window as any).handleUFOHit = (ufoId: string, position: Vector3) => {
        handleUFOHit(ufoId, position);
      };
    }
    
    const initialUfos = Array.from({ length: ufoCount.current }).map((_, index) => {
      // Generate random position around but not too close to player
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      const xPos = Math.cos(angle) * distance;
      const zPos = Math.sin(angle) * distance;
      const yPos = MIN_ALTITUDE + Math.random() * ALTITUDE_VARIATION;
      
      // Create UFO
      const position = new Vector3(xPos, yPos, zPos);
      const scale = 1.5 + Math.random() * 0.6;
      const id = `ufo-${index}`;
      
      // Register with game manager
      registerUFO(id, position);
      
      return {
        id,
        position,
        scale,
        targetPosition: position.clone(),
        lastUpdateTime: 0,
        randomDirection: new Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5),
          (Math.random() - 0.5) * 2
        ).normalize(),
      };
    });
    
    setUfos(initialUfos);
    
    // Cleanup when component unmounts
    return () => {
      initialUfos.forEach(ufo => unregisterUFO(ufo.id));
      // Clean up global handlers
      if (typeof window !== 'undefined') {
        (window as any).handleUFOHit = undefined;
      }
    };
  }, []);

  // Handle collisions with projectiles
  const handleUFOHit = (ufoId: string, position: Vector3) => {
    // Create a stable copy of the hit position
    const explosionPosition = [position.x, position.y, position.z] as [number, number, number];
    
    // First immediately remove UFO from registry and local state to prevent double hits
    if (typeof window !== 'undefined' && (window as any).UFO_REGISTRY) {
      (window as any).UFO_REGISTRY.delete(ufoId);
    }
    
    // Report hit to game manager
    reportUFOHit(ufoId);
    
    // Remove UFO from local state first
    setUfos(prev => prev.filter(ufo => ufo.id !== ufoId));
    
    // Add explosion AFTER removing UFO to prevent render conflicts
    // Use a small delay to ensure the UFO is completely removed first
    setTimeout(() => {
      setExplosions(prev => [
        ...prev,
        {
          id: `explosion-${Date.now()}-${ufoId}`,
          position: explosionPosition,
          scale: 1 + Math.random() * 0.5,
        }
      ]);
    }, 10);
  };

  // Remove explosion after animation completes
  const handleExplosionComplete = (explosionId: string) => {
    setExplosions(prev => prev.filter(exp => exp.id !== explosionId));
  };

  // Follow the player and update UFO positions
  useFrame(({ camera }, delta) => {
    // Track player position (based on camera)
    const newPlayerPosition = new Vector3(
      camera.position.x, 
      0, // We only care about x/z for following
      camera.position.z
    );
    playerPositionRef.current = newPlayerPosition;
    
    // Possibly spawn new UFOs if too few remain
    timeSinceLastSpawn.current += delta;
    if (ufos.length < 5 && timeSinceLastSpawn.current > 2) {
      timeSinceLastSpawn.current = 0;
      
      // Spawn position - far from player
      const angle = Math.random() * Math.PI * 2;
      const spawnDist = SPAWN_DISTANCE;
      const xPos = newPlayerPosition.x + Math.cos(angle) * spawnDist;
      const zPos = newPlayerPosition.z + Math.sin(angle) * spawnDist;
      const yPos = MIN_ALTITUDE + Math.random() * ALTITUDE_VARIATION;
      
      const position = new Vector3(xPos, yPos, zPos);
      const id = `ufo-${Date.now()}`;
      const scale = 1.5 + Math.random() * 0.6;
      
      // Register with game manager
      registerUFO(id, position);
      
      // Add to local state
      setUfos(prev => [
        ...prev,
        {
          id,
          position,
          scale,
          targetPosition: position.clone(),
          lastUpdateTime: 0,
          randomDirection: new Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5),
            (Math.random() - 0.5) * 2
          ).normalize(),
        }
      ]);
    }
    
    // Update UFO positions with player following and randomization
    setUfos(prevUfos => {
      const updatedUfos = prevUfos.map(ufo => {
        // Update random direction periodically
        const timeSinceLastUpdate = ufo.lastUpdateTime + delta;
        let randomDir = ufo.randomDirection;
        
        if (timeSinceLastUpdate > UPDATE_FREQUENCY) {
          randomDir = new Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 0.5, // Less vertical variation
            (Math.random() - 0.5) * 2
          ).normalize();
        }
        
        // Calculate direction to player (in x-z plane)
        const dirToPlayer = new Vector3(
          newPlayerPosition.x - ufo.position.x,
          0,
          newPlayerPosition.z - ufo.position.z
        ).normalize();
        
        // Add random factor to movement direction
        const moveDirection = new Vector3()
          .addVectors(
            dirToPlayer.multiplyScalar(1 - RANDOM_FACTOR),
            randomDir.multiplyScalar(RANDOM_FACTOR)
          )
          .normalize();
        
        // Keep some height variation but maintain minimum altitude
        const targetY = Math.max(
          MIN_ALTITUDE + (Math.sin(Date.now() * 0.001 + ufo.id.charCodeAt(0)) * ALTITUDE_VARIATION * 0.5),
          MIN_ALTITUDE
        );
        
        // Calculate new position with smooth movement
        const newPosition = ufo.position.clone();
        newPosition.x += moveDirection.x * FOLLOW_SPEED * (60 * delta);
        newPosition.z += moveDirection.z * FOLLOW_SPEED * (60 * delta);
        newPosition.y += (targetY - newPosition.y) * 0.01 * (60 * delta);
        
        // Check for minimum distance from other UFOs
        let tooClose = false;
        for (const otherUfo of prevUfos) {
          if (otherUfo.id !== ufo.id) {
            const distance = newPosition.distanceTo(otherUfo.position);
            if (distance < MINIMUM_UFO_DISTANCE) {
              tooClose = true;
              // Add repulsion vector to move away
              const repulsion = new Vector3()
                .subVectors(newPosition, otherUfo.position)
                .normalize()
                .multiplyScalar(0.2 * (60 * delta));
              newPosition.add(repulsion);
            }
          }
        }
        
        // Update global UFO registry with new positions
        if (typeof window !== 'undefined' && (window as any).UFO_REGISTRY) {
          (window as any).UFO_REGISTRY.set(ufo.id, { position: newPosition });
        }
        
        return {
          ...ufo,
          position: newPosition,
          lastUpdateTime: tooClose ? ufo.lastUpdateTime : (timeSinceLastUpdate > UPDATE_FREQUENCY ? 0 : timeSinceLastUpdate),
          randomDirection: randomDir,
        };
      });
      
      return updatedUfos;
    });
    
    // Check for collisions with projectiles (will be implemented in a later step)
    // This is a placeholder for the future collision detection system
  });
  
  return (
    <group>
      {/* Render UFOs */}
      {ufos.map((ufo) => (
        <UFO 
          key={ufo.id}
          position={[ufo.position.x, ufo.position.y, ufo.position.z]}
          scale={ufo.scale}
        />
      ))}
      
      {/* Render explosions */}
      {explosions.map((explosion) => (
        <Explosion
          key={explosion.id}
          position={explosion.position}
          scale={explosion.scale}
          onComplete={() => handleExplosionComplete(explosion.id)}
        />
      ))}
    </group>
  );
} 
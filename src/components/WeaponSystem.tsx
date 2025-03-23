import React, { useState, useRef, useEffect, useContext } from 'react';
import { Vector3, Group, Object3D, Sphere } from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Projectile } from './Projectile';
import { GameContext } from './GameManager';

// Constants
const PROJECTILE_RADIUS = 0.3; // Collision radius for projectiles
const UFO_RADIUS = 8.0; // Collision radius for UFOs (significantly increased for easier hits)

type ProjectileData = {
  id: string;
  position: Vector3;
  direction: Vector3;
  collider: Sphere;
};

type WeaponSystemProps = {
  planeRef: React.RefObject<Group | null>;
};

export function WeaponSystem({ planeRef }: WeaponSystemProps) {
  const { registerProjectile, unregisterProjectile } = useContext(GameContext);
  const [projectiles, setProjectiles] = useState<ProjectileData[]>([]);
  const lastFireTime = useRef(0);
  const cooldownPeriod = 200; // milliseconds between shots
  const { camera } = useThree();
  
  // Track all UFO positions in the scene
  const ufoRegistry = useRef<Map<string, { position: Vector3 }>>(new Map());
  
  // Get UFO registry from global context
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).UFO_REGISTRY) {
      ufoRegistry.current = (window as any).UFO_REGISTRY;
    } else {
      // Create local registry if global one is not available
      ufoRegistry.current = new Map();
      if (typeof window !== 'undefined') {
        (window as any).UFO_REGISTRY = ufoRegistry.current;
      }
    }
  }, []);
  
  // Set up keyboard listener for firing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        fireProjectile();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Check for collisions with UFOs
  useFrame(() => {
    if (!ufoRegistry.current) return;
    
    const projectilesToRemove = new Set<string>();
    const hitUFOs = new Set<string>();
    
    // Check each projectile for collision with UFOs
    projectiles.forEach(projectile => {
      ufoRegistry.current?.forEach((ufo, ufoId) => {
        // Skip if this projectile already hit something or if this UFO was already hit
        if (projectilesToRemove.has(projectile.id) || hitUFOs.has(ufoId)) return;
        
        // Check distance between projectile and UFO
        const distance = projectile.position.distanceTo(ufo.position);
        
        // If collision detected
        if (distance < (PROJECTILE_RADIUS + UFO_RADIUS)) {
          // Mark projectile for removal
          projectilesToRemove.add(projectile.id);
          
          // Mark UFO as hit
          hitUFOs.add(ufoId);
          
          // Call global handler with a clone of the position to avoid reference issues
          if (typeof window !== 'undefined' && (window as any).handleUFOHit) {
            const hitPosition = ufo.position.clone();
            
            // Use a zero-timeout to defer the handler call to the next event loop
            // This helps prevent camera interruptions by separating the render cycles
            setTimeout(() => {
              (window as any).handleUFOHit(ufoId, hitPosition);
            }, 0);
          }
          
          // Remove this projectile
          unregisterProjectile(projectile.id);
        }
      });
    });
    
    // Remove hit projectiles
    if (projectilesToRemove.size > 0) {
      setProjectiles(prev => 
        prev.filter(p => !projectilesToRemove.has(p.id))
      );
    }
  });
  
  const fireProjectile = () => {
    // Check if cooldown has elapsed
    const now = Date.now();
    if (now - lastFireTime.current < cooldownPeriod) return;
    lastFireTime.current = now;
    
    if (!planeRef.current) return;
    
    // Get plane position and direction
    const planePosition = planeRef.current.position.clone();
    
    // Get forward direction from the plane's quaternion
    const forwardDirection = new Vector3(0, 0, -1);
    forwardDirection.applyQuaternion(planeRef.current.quaternion);
    forwardDirection.normalize();
    
    // Create slightly offset positions for twin guns
    const offsetRight = new Vector3(0.5, 0, 0);
    offsetRight.applyQuaternion(planeRef.current.quaternion);
    
    const offsetLeft = new Vector3(-0.5, 0, 0);
    offsetLeft.applyQuaternion(planeRef.current.quaternion);
    
    // Create new projectiles
    const rightPosition = planePosition.clone().add(offsetRight);
    const leftPosition = planePosition.clone().add(offsetLeft);
    
    // Add new projectiles
    const rightProjectileId = `projectile-${Date.now()}-right`;
    const leftProjectileId = `projectile-${Date.now()}-left`;
    
    const rightCollider = new Sphere(rightPosition.clone(), PROJECTILE_RADIUS);
    const leftCollider = new Sphere(leftPosition.clone(), PROJECTILE_RADIUS);
    
    const newProjectiles = [
      {
        id: rightProjectileId,
        position: rightPosition.clone(),
        direction: forwardDirection.clone(),
        collider: rightCollider
      },
      {
        id: leftProjectileId,
        position: leftPosition.clone(),
        direction: forwardDirection.clone(),
        collider: leftCollider
      }
    ];
    
    // Register with game manager
    newProjectiles.forEach(p => {
      registerProjectile(p.id, p.position);
    });
    
    setProjectiles(prev => [...prev, ...newProjectiles]);
  };
  
  // Remove expired projectiles
  const removeProjectile = (id: string) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
    unregisterProjectile(id);
  };
  
  // Update projectile positions and colliders
  useFrame((_, delta) => {
    setProjectiles(prev => 
      prev.map(projectile => {
        const newPosition = projectile.position.clone().add(
          projectile.direction.clone().multiplyScalar(70 * delta)
        );
        
        // Update collider position
        projectile.collider.center.copy(newPosition);
        
        return {
          ...projectile,
          position: newPosition
        };
      })
    );
  });
  
  return (
    <group>
      {projectiles.map((projectile) => (
        <Projectile
          key={projectile.id}
          position={[projectile.position.x, projectile.position.y, projectile.position.z]}
          direction={projectile.direction}
          onExpired={() => removeProjectile(projectile.id)}
        />
      ))}
    </group>
  );
} 
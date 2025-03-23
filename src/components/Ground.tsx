import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector2, Vector3, RepeatWrapping, TextureLoader, MeshStandardMaterial } from 'three';

// Ground chunk size
const CHUNK_SIZE = 200;
const GRID_SIZE = 4;

// Constants for the ground
const ROAD_WIDTH = 6;
const ROAD_COLOR = '#333333'; // Dark gray for roads
const GRASS_COLOR = '#7BA05B'; // Green for grass
const ROAD_SPACING = 48; // Space between roads

export function Ground() {
  // Reference to the player position
  const playerPosRef = useRef(new Vector3(0, 0, 0));
  
  // Reference to the chunks to render
  const [visibleChunks, setVisibleChunks] = React.useState<[number, number][]>([
    [0, 0] // Initial center chunk
  ]);
  
  // Follow the camera position for infinite ground generation
  useFrame(({ camera }) => {
    const cameraX = Math.floor(camera.position.x / CHUNK_SIZE) * CHUNK_SIZE;
    const cameraZ = Math.floor(camera.position.z / CHUNK_SIZE) * CHUNK_SIZE;
    
    // Check if we need to update chunks
    if (
      Math.abs(cameraX - playerPosRef.current.x) >= CHUNK_SIZE / 2 ||
      Math.abs(cameraZ - playerPosRef.current.z) >= CHUNK_SIZE / 2
    ) {
      playerPosRef.current.set(cameraX, 0, cameraZ);
      
      // Generate visible ground chunks around the player
      const newChunks: [number, number][] = [];
      for (let x = -GRID_SIZE; x <= GRID_SIZE; x++) {
        for (let z = -GRID_SIZE; z <= GRID_SIZE; z++) {
          newChunks.push([
            cameraX + x * CHUNK_SIZE,
            cameraZ + z * CHUNK_SIZE
          ]);
        }
      }
      
      setVisibleChunks(newChunks);
    }
  });

  return (
    <group>
      {visibleChunks.map(([x, z]) => (
        <GroundChunk key={`ground-${x}-${z}`} position={[x, 0, z]} chunkSize={CHUNK_SIZE} />
      ))}
    </group>
  );
}

type GroundChunkProps = {
  position: [number, number, number];
  chunkSize: number;
};

function GroundChunk({ position, chunkSize }: GroundChunkProps) {
  // Generate the ground geometry for this chunk
  const groundGeometry = useMemo(() => {
    // Use a deterministic random generator based on chunk position
    const seed = position[0] * 10000 + position[2];
    const pseudoRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };
    
    // Determine which roads should go through this chunk
    const roads: React.ReactNode[] = [];
    
    // Calculate road positions based on a grid
    const chunkX = position[0];
    const chunkZ = position[2];
    
    // Check if this chunk contains horizontal road segments (along Z axis)
    for (let x = chunkX - chunkSize/2; x <= chunkX + chunkSize/2; x += ROAD_SPACING) {
      if (Math.round(x / ROAD_SPACING) * ROAD_SPACING === x) {
        roads.push(
          <mesh 
            key={`road-h-${x}`} 
            position={[x - chunkX, 0.01, 0]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            receiveShadow
          >
            <planeGeometry args={[ROAD_WIDTH, chunkSize]} />
            <meshStandardMaterial color={ROAD_COLOR} />
          </mesh>
        );
      }
    }
    
    // Check if this chunk contains vertical road segments (along X axis)
    for (let z = chunkZ - chunkSize/2; z <= chunkZ + chunkSize/2; z += ROAD_SPACING) {
      if (Math.round(z / ROAD_SPACING) * ROAD_SPACING === z) {
        roads.push(
          <mesh 
            key={`road-v-${z}`} 
            position={[0, 0.01, z - chunkZ]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            receiveShadow
          >
            <planeGeometry args={[chunkSize, ROAD_WIDTH]} />
            <meshStandardMaterial color={ROAD_COLOR} />
          </mesh>
        );
      }
    }
    
    return roads;
  }, [position, chunkSize]);

  return (
    <group position={position}>
      {/* Base grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[chunkSize, chunkSize]} />
        <meshStandardMaterial color={GRASS_COLOR} />
      </mesh>
      
      {/* Roads overlay */}
      {groundGeometry}
    </group>
  );
} 
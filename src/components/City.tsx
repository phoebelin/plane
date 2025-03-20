import React, { useMemo, useRef } from 'react';
import { Color, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

// Building props type
type BuildingProps = {
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
  color: string;
}

// Single building component
const Building: React.FC<BuildingProps> = ({ position, width, height, depth, color }) => {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// City Chunk component that creates a section of the city
type CityChunkProps = {
  position: [number, number, number];
  chunkSize: number;
}

const CityChunk: React.FC<CityChunkProps> = ({ position, chunkSize }) => {
  // Generate a grid of buildings with random heights
  const buildings = useMemo(() => {
    const buildingArray: JSX.Element[] = [];
    const gridSize = chunkSize / 2; // Half the chunk size determines grid size
    const spacing = 3; // Space between buildings
    
    // Use position as seed for consistent generation
    const seed = position[0] * 10000 + position[2];
    const pseudoRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };
    
    const colors = [
      '#6e7f80', // Gray blue
      '#7d8a91', // Light gray
      '#5c6670', // Dark gray
      '#adbdc5', // Pale blue
      '#8d9ca8', // Steel blue
    ];
    
    let buildingIndex = 0;
    
    for (let x = -gridSize; x <= gridSize; x += 2) {
      for (let z = -gridSize; z <= gridSize; z += 2) {
        buildingIndex++;
        
        // Skip some positions to create streets
        if ((x % 4 === 0 && Math.abs(z) < gridSize) || 
            (z % 4 === 0 && Math.abs(x) < gridSize)) {
          continue;
        }
        
        // Deterministic random building properties based on position
        const height = pseudoRandom(buildingIndex) * 4 + 1; // Height between 1 and 5
        const width = pseudoRandom(buildingIndex + 1) * 0.5 + 1.2; // Width between 1.2 and 1.7
        const depth = pseudoRandom(buildingIndex + 2) * 0.5 + 1.2; // Depth between 1.2 and 1.7
        const colorIndex = Math.floor(pseudoRandom(buildingIndex + 3) * colors.length);
        
        const worldX = position[0] + x * spacing;
        const worldZ = position[2] + z * spacing;
        
        buildingArray.push(
          <Building
            key={`building-${worldX}-${worldZ}`}
            position={[x * spacing, height / 2, z * spacing]}
            width={width}
            height={height}
            depth={depth}
            color={colors[colorIndex]}
          />
        );
        
        // Add some small buildings/structures next to larger ones
        if (pseudoRandom(buildingIndex + 4) > 0.7) {
          const smallHeight = pseudoRandom(buildingIndex + 5) * 0.5 + 0.5; // Small height between 0.5 and 1
          buildingArray.push(
            <Building
              key={`building-small-${worldX}-${worldZ}`}
              position={[x * spacing + width, smallHeight / 2, z * spacing + depth / 2]}
              width={0.6}
              height={smallHeight}
              depth={0.6}
              color={colors[Math.floor(pseudoRandom(buildingIndex + 6) * colors.length)]}
            />
          );
        }
      }
    }
    
    return buildingArray;
  }, [position, chunkSize]);
  
  return (
    <group position={position}>
      {buildings}
    </group>
  );
};

export function City() {
  const chunkSize = 36; // Size of a city chunk
  const renderDistance = 3; // Number of chunks to render in each direction
  const playerPositionRef = useRef(new Vector3(0, 0, 0));
  
  // Track chunks that are currently rendered
  const [chunksToRender, setChunksToRender] = React.useState<[number, number, number][]>([
    [0, 0, 0] // Initial center chunk
  ]);
  
  // Track the player's position and update chunks
  useFrame(({ camera }) => {
    // Get the camera position but ignore height (y)
    const cameraX = Math.round(camera.position.x / chunkSize) * chunkSize;
    const cameraZ = Math.round(camera.position.z / chunkSize) * chunkSize;
    
    // Check if we've moved to a new chunk
    if (
      Math.abs(cameraX - playerPositionRef.current.x) >= chunkSize / 2 ||
      Math.abs(cameraZ - playerPositionRef.current.z) >= chunkSize / 2
    ) {
      // Update player position
      playerPositionRef.current.set(cameraX, 0, cameraZ);
      
      // Generate new chunks based on player position
      const newChunks: [number, number, number][] = [];
      
      for (let x = -renderDistance; x <= renderDistance; x++) {
        for (let z = -renderDistance; z <= renderDistance; z++) {
          const chunkX = cameraX + x * chunkSize;
          const chunkZ = cameraZ + z * chunkSize;
          newChunks.push([chunkX, 0, chunkZ]);
        }
      }
      
      setChunksToRender(newChunks);
    }
  });
  
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#7BA05B" /> {/* Green for grass */}
      </mesh>
      
      {/* City Chunks */}
      {chunksToRender.map((position) => (
        <CityChunk 
          key={`chunk-${position[0]}-${position[2]}`}
          position={position as [number, number, number]} 
          chunkSize={chunkSize}
        />
      ))}
    </group>
  );
} 
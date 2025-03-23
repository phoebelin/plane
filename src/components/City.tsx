import React, { useMemo, useRef, useEffect } from 'react';
import { Color, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

// Building props type
type BuildingProps = {
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
  color: string;
  buildingType?: 'standard' | 'modern' | 'landmark' | 'skyscraper';
  registerBuilding?: (position: Vector3, size: Vector3, id: string) => void;
  unregisterBuilding?: (id: string) => void;
}

// Tree props type
type TreeProps = {
  position: [number, number, number];
  scale?: number;
  type?: 'pine' | 'oak' | 'bush';
}

// Single building component
const Building: React.FC<BuildingProps> = ({ position, width, height, depth, color, buildingType = 'standard', registerBuilding, unregisterBuilding }) => {
  const buildingId = useRef(`building-${position[0]}-${position[1]}-${position[2]}-${Math.random()}`);

  // Register this building with the collision system when mounted
  useEffect(() => {
    if (registerBuilding) {
      const buildingPosition = new Vector3(position[0], position[1], position[2]);
      const buildingSize = new Vector3(width, height, depth);
      registerBuilding(buildingPosition, buildingSize, buildingId.current);
    }
    
    // Unregister when component unmounts
    return () => {
      if (unregisterBuilding) {
        unregisterBuilding(buildingId.current);
      }
    };
  }, [position, width, height, depth, registerBuilding, unregisterBuilding]);

  // Standard building
  if (buildingType === 'standard') {
    return (
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }

  // Modern glass building (taller with a different material)
  if (buildingType === 'modern') {
    return (
      <group position={position}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshPhysicalMaterial 
            color={color} 
            metalness={0.9} 
            roughness={0.1} 
            reflectivity={1}
            opacity={0.7}
            transparent={true}
          />
        </mesh>
        {/* Horizontal stripes for windows */}
        {Array(Math.floor(height / 0.5)).fill(0).map((_, i) => (
          <mesh 
            key={`stripe-${i}`} 
            position={[0, -height/2 + 0.25 + i * 0.5, depth/2 + 0.01]}
            receiveShadow
          >
            <planeGeometry args={[width * 0.8, 0.1]} />
            <meshStandardMaterial color="#a0d8ef" emissive="#304d6d" emissiveIntensity={0.2} />
          </mesh>
        ))}
      </group>
    );
  }

  // Landmark building (more complex shape)
  if (buildingType === 'landmark') {
    // Base of the landmark
    return (
      <group position={position}>
        {/* Main base of the landmark */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width, height * 0.7, depth]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Middle section */}
        <mesh position={[0, height * 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.8, height * 0.2, depth * 0.8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Top spire */}
        <mesh position={[0, height * 0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0, width * 0.2, height * 0.5, 4]} />
          <meshStandardMaterial color="#d0d0d0" />
        </mesh>
      </group>
    );
  }
  
  // Skyscraper (very tall with a more sophisticated shape)
  if (buildingType === 'skyscraper') {
    return (
      <group position={position}>
        {/* Main body of the skyscraper */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Top section of the skyscraper */}
        <mesh position={[0, height/2 + height*0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.7, height * 0.2, depth * 0.7]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Antenna on top */}
        <mesh position={[0, height/2 + height*0.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, height * 0.3, 8]} />
          <meshStandardMaterial color="#707070" />
        </mesh>
      </group>
    );
  }

  // Default to standard building if buildingType is not recognized
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Tree component
const Tree: React.FC<TreeProps> = ({ position, scale = 1, type = 'pine' }) => {
  if (type === 'pine') {
    return (
      <group position={position} scale={[scale, scale, scale]}>
        {/* Tree trunk */}
        <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.1, 0.15, 0.8, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Tree foliage - cone shape for pine */}
        <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
          <coneGeometry args={[0.5, 1.6, 8]} />
          <meshStandardMaterial color="#2E8B57" />
        </mesh>
      </group>
    );
  }
  
  if (type === 'oak') {
    return (
      <group position={position} scale={[scale, scale, scale]}>
        {/* Tree trunk */}
        <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Tree foliage - sphere shape for oak */}
        <mesh castShadow receiveShadow position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
      </group>
    );
  }
  
  if (type === 'bush') {
    return (
      <group position={position} scale={[scale, scale, scale]}>
        {/* Bush foliage - multiple smaller spheres */}
        <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.4, 8, 8]} />
          <meshStandardMaterial color="#3CB371" />
        </mesh>
        <mesh castShadow receiveShadow position={[0.3, 0.25, 0.1]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#3CB371" />
        </mesh>
        <mesh castShadow receiveShadow position={[-0.25, 0.2, -0.1]}>
          <sphereGeometry args={[0.35, 8, 8]} />
          <meshStandardMaterial color="#3CB371" />
        </mesh>
      </group>
    );
  }
  
  // Default to pine if type is not recognized
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.8, 8]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
        <coneGeometry args={[0.5, 1.6, 8]} />
        <meshStandardMaterial color="#2E8B57" />
      </mesh>
    </group>
  );
};

// City Chunk component that creates a section of the city
type CityChunkProps = {
  position: [number, number, number];
  chunkSize: number;
  registerBuilding?: (position: Vector3, size: Vector3, id: string) => void;
  unregisterBuilding?: (id: string) => void;
}

const CityChunk: React.FC<CityChunkProps> = ({ position, chunkSize, registerBuilding, unregisterBuilding }) => {
  // Generate a grid of buildings with random heights
  const elements = useMemo(() => {
    const buildingArray: React.ReactNode[] = [];
    const treeArray: React.ReactNode[] = [];
    const gridSize = chunkSize / 2; // Half the chunk size determines grid size
    const spacing = 3; // Space between buildings
    
    // Use position as seed for consistent generation
    const seed = position[0] * 10000 + position[2];
    const pseudoRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };
    
    // Colors for different building types
    const buildingColors = {
      standard: [
        '#6e7f80', // Gray blue
        '#7d8a91', // Light gray
        '#5c6670', // Dark gray
        '#adbdc5', // Pale blue
        '#8d9ca8', // Steel blue
      ],
      modern: [
        '#a0cfec', // Light blue glass
        '#b0e0e6', // Powder blue
        '#add8e6', // Light blue
        '#6495ed', // Cornflower blue
        '#87ceeb', // Sky blue
      ],
      landmark: [
        '#f5f5f5', // White smoke
        '#e8e8e8', // Platinum
        '#d3d3d3', // Light gray
        '#c0c0c0', // Silver
        '#a9a9a9', // Dark gray
      ],
      skyscraper: [
        '#2f4f4f', // Dark slate gray
        '#708090', // Slate gray
        '#778899', // Light slate gray
        '#696969', // Dim gray
        '#808080', // Gray
      ]
    };

    // Tree types
    const treeTypes = ['pine', 'oak', 'bush'] as const;
    
    let buildingIndex = 0;
    
    // Park locations - create parks in some areas
    const parkPositions: {x: number, z: number}[] = [];
    const parkCount = Math.floor(pseudoRandom(9999) * 2) + 1; // 1-2 parks per chunk
    
    for (let i = 0; i < parkCount; i++) {
      parkPositions.push({
        x: Math.floor(pseudoRandom(i + 1000) * gridSize * 2) - gridSize,
        z: Math.floor(pseudoRandom(i + 2000) * gridSize * 2) - gridSize,
      });
    }
    
    const isParkLocation = (x: number, z: number, radius: number = 5) => {
      return parkPositions.some(park => 
        Math.sqrt(Math.pow(x - park.x, 2) + Math.pow(z - park.z, 2)) < radius
      );
    };
    
    for (let x = -gridSize; x <= gridSize; x += 2) {
      for (let z = -gridSize; z <= gridSize; z += 2) {
        buildingIndex++;
        
        // Check if this is a park location
        if (isParkLocation(x, z)) {
          // Place trees instead of buildings in park areas
          if (pseudoRandom(buildingIndex + 7000) > 0.4) {
            const treeType = treeTypes[Math.floor(pseudoRandom(buildingIndex + 8000) * treeTypes.length)];
            const treeScale = pseudoRandom(buildingIndex + 9000) * 0.5 + 0.7; // Scale between 0.7 and 1.2
            
            const worldX = position[0] + x * spacing + (pseudoRandom(buildingIndex + 300) * 2 - 1);
            const worldZ = position[2] + z * spacing + (pseudoRandom(buildingIndex + 400) * 2 - 1);
            
            treeArray.push(
              <Tree
                key={`tree-${worldX}-${worldZ}`}
                position={[x * spacing + (pseudoRandom(buildingIndex + 300) * 2 - 1), 0, z * spacing + (pseudoRandom(buildingIndex + 400) * 2 - 1)]}
                scale={treeScale}
                type={treeType}
              />
            );
          }
          continue;
        }
        
        // Skip some positions to create streets
        if ((x % 4 === 0 && Math.abs(z) < gridSize) || 
            (z % 4 === 0 && Math.abs(x) < gridSize)) {
          continue;
        }
        
        // Determine building type based on pseudo-random number
        const buildingTypeRandom = pseudoRandom(buildingIndex + 5000);
        let buildingType: 'standard' | 'modern' | 'landmark' | 'skyscraper' = 'standard';
        
        if (buildingTypeRandom > 0.95) {
          buildingType = 'landmark'; // 5% chance
        } else if (buildingTypeRandom > 0.85) {
          buildingType = 'skyscraper'; // 10% chance
        } else if (buildingTypeRandom > 0.65) {
          buildingType = 'modern'; // 20% chance
        }
        
        // Deterministic random building properties based on position
        let height = pseudoRandom(buildingIndex) * 4 + 1; // Height between 1 and 5
        
        // Make some building types taller
        if (buildingType === 'skyscraper') {
          height *= 2.5; // Much taller for skyscrapers
        } else if (buildingType === 'modern') {
          height *= 1.8; // Taller for modern buildings
        } else if (buildingType === 'landmark') {
          height *= 1.5; // Slightly taller for landmarks
        }
        
        const width = pseudoRandom(buildingIndex + 1) * 0.5 + 1.2; // Width between 1.2 and 1.7
        const depth = pseudoRandom(buildingIndex + 2) * 0.5 + 1.2; // Depth between 1.2 and 1.7
        
        // Select color based on building type
        const colorSet = buildingColors[buildingType];
        const colorIndex = Math.floor(pseudoRandom(buildingIndex + 3) * colorSet.length);
        
        const worldX = position[0] + x * spacing;
        const worldZ = position[2] + z * spacing;
        
        buildingArray.push(
          <Building
            key={`building-${worldX}-${worldZ}`}
            position={[x * spacing, height / 2, z * spacing]}
            width={width}
            height={height}
            depth={depth}
            color={colorSet[colorIndex]}
            buildingType={buildingType}
            registerBuilding={registerBuilding}
            unregisterBuilding={unregisterBuilding}
          />
        );
        
        // Add some small buildings/structures next to main buildings (but not next to landmarks or skyscrapers)
        if (buildingType !== 'landmark' && buildingType !== 'skyscraper' && pseudoRandom(buildingIndex + 4) > 0.7) {
          const smallHeight = pseudoRandom(buildingIndex + 5) * 0.5 + 0.5; // Small height between 0.5 and 1
          buildingArray.push(
            <Building
              key={`building-small-${worldX}-${worldZ}`}
              position={[x * spacing + width, smallHeight / 2, z * spacing + depth / 2]}
              width={0.6}
              height={smallHeight}
              depth={0.6}
              color={buildingColors.standard[Math.floor(pseudoRandom(buildingIndex + 6) * buildingColors.standard.length)]}
              registerBuilding={registerBuilding}
              unregisterBuilding={unregisterBuilding}
            />
          );
        }
        
        // Add trees along some streets and between buildings
        if (((x % 4 === 0 || z % 4 === 0) && pseudoRandom(buildingIndex + 7) > 0.8) ||
            (pseudoRandom(buildingIndex + 8) > 0.95)) {
          const treeType = treeTypes[Math.floor(pseudoRandom(buildingIndex + 9) * treeTypes.length)];
          const treeScale = pseudoRandom(buildingIndex + 10) * 0.3 + 0.7; // Scale between 0.7 and 1.0
          
          // Position tree along street or between buildings
          const treeX = x % 4 === 0 ? x * spacing : x * spacing + (pseudoRandom(buildingIndex + 11) * width) - width/2;
          const treeZ = z % 4 === 0 ? z * spacing : z * spacing + (pseudoRandom(buildingIndex + 12) * depth) - depth/2;
          
          treeArray.push(
            <Tree
              key={`street-tree-${worldX}-${treeZ}`}
              position={[treeX, 0, treeZ]}
              scale={treeScale}
              type={treeType}
            />
          );
        }
      }
    }
    
    // Add some additional scattered trees in random positions
    for (let i = 0; i < 20; i++) {
      const x = (pseudoRandom(i + 500) * 2 - 1) * gridSize * spacing;
      const z = (pseudoRandom(i + 600) * 2 - 1) * gridSize * spacing;
      
      // Skip if it's in a road area
      if ((Math.round(x / spacing) % 4 === 0) || (Math.round(z / spacing) % 4 === 0)) {
        continue;
      }
      
      // Only place if not colliding with buildings (simple check)
      if (pseudoRandom(i + 700) > 0.7) {
        const treeType = treeTypes[Math.floor(pseudoRandom(i + 800) * treeTypes.length)];
        const treeScale = pseudoRandom(i + 900) * 0.5 + 0.7; // Scale between 0.7 and 1.2
        
        treeArray.push(
          <Tree
            key={`random-tree-${i}-${position[0]}-${position[2]}`}
            position={[x, 0, z]}
            scale={treeScale}
            type={treeType}
          />
        );
      }
    }
    
    return [...buildingArray, ...treeArray];
  }, [position, chunkSize]);
  
  return (
    <group position={position}>
      {elements}
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
  
  // Get functions from the plane controller context or props
  const registerBuilding = (position: Vector3, size: Vector3, id: string) => {
    // Access the BUILDING_REGISTRY from the global scope
    if (typeof window !== 'undefined' && (window as any).BUILDING_REGISTRY) {
      (window as any).BUILDING_REGISTRY.set(id, { position, size });
    }
  };

  const unregisterBuilding = (id: string) => {
    if (typeof window !== 'undefined' && (window as any).BUILDING_REGISTRY) {
      (window as any).BUILDING_REGISTRY.delete(id);
    }
  };
  
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
      {/* City Chunks */}
      {chunksToRender.map((position) => (
        <CityChunk 
          key={`chunk-${position[0]}-${position[2]}`}
          position={position as [number, number, number]} 
          chunkSize={chunkSize}
          registerBuilding={registerBuilding}
          unregisterBuilding={unregisterBuilding}
        />
      ))}
    </group>
  );
} 
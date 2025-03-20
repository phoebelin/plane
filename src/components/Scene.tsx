import React, { Suspense } from 'react';
import { Sky, Stars, Loader } from '@react-three/drei';
import { City } from './City';
import { PlaneController } from './PlaneController';

const Scene: React.FC = () => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[50, 50, 25]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <hemisphereLight
        args={['#87CEEB', '#6e7f80', 0.4]} // Sky color, ground color, intensity
      />
      
      {/* Fog to create depth */}
      <fog attach="fog" args={['#e6f0f4', 30, 100]} />
      
      {/* Environment */}
      <Suspense fallback={null}>
        <Sky 
          distance={450000} 
          sunPosition={[50, 25, 10]} 
          inclination={0.6}
          azimuth={0.25}
        />
        <Stars radius={300} depth={50} count={1000} factor={4} />
        
        {/* Infinite city */}
        <City />
        
        {/* Plane with controller */}
        <PlaneController />
      </Suspense>
      
      {/* External loader component */}
      <Loader />
    </>
  );
};

export default Scene; 
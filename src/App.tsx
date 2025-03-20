import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import './App.css';

function App() {
  return (
    <div className="App">
      <Canvas shadows>
        <Scene />
      </Canvas>
    </div>
  );
}

export default App; 
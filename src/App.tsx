import React from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import { GameManager } from './components/GameManager';
import { GameHUD } from './components/GameHUD';
import './App.css';

function App() {
  return (
    <div className="App">
      <GameManager>
        <Canvas shadows>
          <Scene />
        </Canvas>
        <GameHUD />
      </GameManager>
    </div>
  );
}

export default App; 
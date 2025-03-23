import React, { useState, useEffect, useRef } from 'react';
import { Vector3 } from 'three';

// Placeholder for future game state management
export type GameState = {
  score: number;
  level: number;
  ufoCount: number;
  playerHealth: number;
  gameStatus: 'playing' | 'victory' | 'defeat' | 'paused';
};

// Context to provide game state across components
export const GameContext = React.createContext<{
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  registerUFO: (id: string, position: Vector3) => void;
  unregisterUFO: (id: string) => void;
  registerProjectile: (id: string, position: Vector3) => void;
  unregisterProjectile: (id: string) => void;
  reportUFOHit: (ufoId: string) => void;
}>({
  gameState: {
    score: 0,
    level: 1,
    ufoCount: 0,
    playerHealth: 100,
    gameStatus: 'playing',
  },
  setGameState: () => {},
  registerUFO: () => {},
  unregisterUFO: () => {},
  registerProjectile: () => {},
  unregisterProjectile: () => {},
  reportUFOHit: () => {},
});

// Type definitions for our registry objects
type ObjectRegistry = Map<string, { position: Vector3 }>;

export function GameManager({ children }: { children: React.ReactNode }) {
  // Core game state
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    ufoCount: 0,
    playerHealth: 100,
    gameStatus: 'playing',
  });
  
  // Registry for tracking objects in the game world
  const ufoRegistry = useRef<ObjectRegistry>(new Map());
  const projectileRegistry = useRef<ObjectRegistry>(new Map());
  
  // Object registration functions
  const registerUFO = (id: string, position: Vector3) => {
    ufoRegistry.current.set(id, { position });
    setGameState(prev => ({ ...prev, ufoCount: ufoRegistry.current.size }));
  };
  
  const unregisterUFO = (id: string) => {
    ufoRegistry.current.delete(id);
    setGameState(prev => ({ ...prev, ufoCount: ufoRegistry.current.size }));
  };
  
  const registerProjectile = (id: string, position: Vector3) => {
    projectileRegistry.current.set(id, { position });
  };
  
  const unregisterProjectile = (id: string) => {
    projectileRegistry.current.delete(id);
  };
  
  // Collision reporting
  const reportUFOHit = (ufoId: string) => {
    // Increase score when a UFO is hit
    setGameState(prev => ({ 
      ...prev, 
      score: prev.score + 100
    }));
    
    // Unregister the UFO (it will be removed in the UFOManager)
    unregisterUFO(ufoId);
  };
  
  return (
    <GameContext.Provider 
      value={{ 
        gameState, 
        setGameState,
        registerUFO,
        unregisterUFO,
        registerProjectile,
        unregisterProjectile,
        reportUFOHit
      }}
    >
      {children}
    </GameContext.Provider>
  );
} 
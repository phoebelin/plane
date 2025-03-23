import React, { useContext } from 'react';
import { GameContext } from './GameManager';

export function GameHUD() {
  const { gameState } = useContext(GameContext);
  
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        borderRadius: '10px',
        zIndex: 100,
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: '150px',
      }}
    >
      <div>
        <span style={{ fontWeight: 'bold' }}>SCORE: </span>
        <span>{gameState.score}</span>
      </div>
      
      <div>
        <span style={{ fontWeight: 'bold' }}>UFOS: </span>
        <span>{gameState.ufoCount}</span>
      </div>
      
      <div>
        <span style={{ fontWeight: 'bold' }}>LEVEL: </span>
        <span>{gameState.level}</span>
      </div>
    </div>
  );
} 
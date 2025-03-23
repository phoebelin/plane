import React from 'react';
import { Html } from '@react-three/drei';

interface ControlsUIProps {
  speedPercentage: number;
  showCameraMode?: boolean;
}

export function ControlsUI({ speedPercentage, showCameraMode = false }: ControlsUIProps) {
  return (
    <Html
      fullscreen
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        transform: 'none',
        pointerEvents: 'none'
      }}
    >
      <div style={{
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '10px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        zIndex: 100,
        userSelect: 'none',
        maxWidth: '250px',
        pointerEvents: 'auto'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>CONTROLS</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px' }}>
          <div><span style={{ fontWeight: 'bold' }}>W/S</span>: Pitch Up/Down</div>
          <div><span style={{ fontWeight: 'bold' }}>A/D</span>: Roll Right/Left</div>
          <div><span style={{ fontWeight: 'bold' }}>Q/E</span>: Speed Up/Down</div>
          <div><span style={{ fontWeight: 'bold' }}>SPACE</span>: Fire Weapons</div>
          <div><span style={{ fontWeight: 'bold' }}>C</span>: Toggle Camera</div>
          <div><span style={{ fontWeight: 'bold' }}>R</span>: Reset Plane</div>
        </div>
        
        <div style={{ marginTop: '15px' }}>
          <div style={{ marginBottom: '5px', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>SPEED: {speedPercentage}%</span>
            {showCameraMode && <span style={{ color: '#FFD700' }}>FREE CAM</span>}
          </div>
          
          {/* Speed bar */}
          <div style={{ 
            width: '100%', 
            height: '10px', 
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${speedPercentage}%`, 
              backgroundColor: getSpeedColor(speedPercentage),
              transition: 'width 0.2s ease, background-color 0.3s ease'
            }} />
          </div>
        </div>
      </div>
    </Html>
  );
}

// Helper function to get color based on speed percentage
function getSpeedColor(percentage: number): string {
  if (percentage < 30) return '#4CAF50'; // Green for low speed
  if (percentage < 70) return '#FFC107'; // Yellow for medium speed
  return '#FF5722'; // Orange/Red for high speed
} 
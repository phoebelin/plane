import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler, Object3D, MathUtils, Group } from 'three';
import { Plane } from './Plane';
import { ControlsUI } from './ControlsUI';

// Physics constants
const MAX_SPEED = 50;
const MIN_SPEED = 5;
const ACCELERATION = 5;
const TURN_SPEED = 1.5;
const PITCH_SPEED = 1.2;
const AUTO_LEVEL_SPEED = 2;
const DAMPING = 0.95;

export function PlaneController() {
  // References
  const planeRef = useRef<Group>(null);
  const cameraRef = useRef(new Object3D());
  
  // State for plane physics
  const [speed, setSpeed] = useState(15);
  const [speedPercentage, setSpeedPercentage] = useState(30); // 30% of max speed
  const velocityRef = useRef(new Vector3(0, 0, 1));
  const targetQuaternionRef = useRef(new Quaternion());
  const currentQuaternionRef = useRef(new Quaternion());
  
  // Input state
  const keysPressed = useRef({
    w: false, // pitch up
    s: false, // pitch down
    a: false, // turn left
    d: false, // turn right
    q: false, // speed up
    e: false, // slow down
  });
  
  // Get camera from Three.js context
  const { camera } = useThree();
  
  // Set up key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() in keysPressed.current) {
        keysPressed.current[e.key.toLowerCase() as keyof typeof keysPressed.current] = true;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() in keysPressed.current) {
        keysPressed.current[e.key.toLowerCase() as keyof typeof keysPressed.current] = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Animation and physics update
  useFrame((_, delta) => {
    if (!planeRef.current) return;
    
    // Get current plane orientation
    const currentRotation = planeRef.current.quaternion.clone();
    const rotationEuler = new Euler().setFromQuaternion(currentRotation);
    
    // Initialize target rotation based on current
    let targetRotationEuler = new Euler(
      rotationEuler.x,
      rotationEuler.y,
      rotationEuler.z
    );
    
    // Apply inputs with damping
    let pitchInput = 0;
    let turnInput = 0;
    let speedInput = 0;
    
    // Process inputs
    if (keysPressed.current.w) pitchInput -= PITCH_SPEED * delta;
    if (keysPressed.current.s) pitchInput += PITCH_SPEED * delta;
    if (keysPressed.current.a) turnInput -= TURN_SPEED * delta;
    if (keysPressed.current.d) turnInput += TURN_SPEED * delta;
    if (keysPressed.current.q) speedInput += ACCELERATION * delta;
    if (keysPressed.current.e) speedInput -= ACCELERATION * delta;
    
    // Update speed with limits
    const newSpeed = MathUtils.clamp(
      speed + speedInput,
      MIN_SPEED,
      MAX_SPEED
    );
    setSpeed(newSpeed);
    setSpeedPercentage(Math.round((newSpeed / MAX_SPEED) * 100));
    
    // Calculate banking when turning (roll + yaw)
    if (turnInput !== 0) {
      // Apply yaw (turning)
      targetRotationEuler.y += turnInput;
      
      // Apply roll (banking) - roll in the direction of turn
      targetRotationEuler.z = MathUtils.lerp(
        targetRotationEuler.z,
        turnInput * 0.7, // Banking angle proportional to turn
        0.2 // Smooth transition
      );
    } else {
      // Auto-level the roll when not turning
      targetRotationEuler.z = MathUtils.lerp(
        targetRotationEuler.z,
        0,
        AUTO_LEVEL_SPEED * delta
      );
    }
    
    // Apply pitch input
    if (pitchInput !== 0) {
      targetRotationEuler.x += pitchInput;
    } else {
      // Auto-level pitch when not pitching
      targetRotationEuler.x = MathUtils.lerp(
        targetRotationEuler.x,
        0,
        AUTO_LEVEL_SPEED * delta
      );
    }
    
    // Convert Euler back to Quaternion
    targetQuaternionRef.current.setFromEuler(targetRotationEuler);
    
    // Smoothly interpolate current rotation towards target
    planeRef.current.quaternion.slerp(
      targetQuaternionRef.current,
      DAMPING * delta * 10
    );
    
    // Update velocity direction based on plane's orientation
    velocityRef.current.set(0, 0, -1).applyQuaternion(planeRef.current.quaternion);
    velocityRef.current.normalize().multiplyScalar(newSpeed * delta);
    
    // Move plane based on velocity
    planeRef.current.position.add(velocityRef.current);
    
    // Position camera behind and slightly above plane
    const cameraOffset = new Vector3(0, 2, 8); // Behind and above
    cameraOffset.applyQuaternion(planeRef.current.quaternion);
    
    // Make camera position follow plane with smooth damping
    camera.position.lerp(
      planeRef.current.position.clone().add(cameraOffset),
      0.05
    );
    
    // Make camera look at plane
    camera.lookAt(planeRef.current.position);
  });
  
  return (
    <>
      <group ref={planeRef} position={[0, 20, 0]}>
        <Plane />
      </group>
      <ControlsUI speedPercentage={speedPercentage} />
    </>
  );
} 
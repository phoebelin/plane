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
const VERTICAL_SPEED = 15; // Direct vertical movement speed

// Angle constraints
const MAX_PITCH_ANGLE = Math.PI / 4; // Increased to ~45 degrees for more noticeable tilting
const MAX_ROLL_ANGLE = Math.PI / 4;  // ~45 degrees

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
  
  // Current rotation state
  const rotationStateRef = useRef({
    pitch: 0,
    yaw: 0,
    roll: 0
  });
  
  // Separate state for vertical position to allow direct control
  const verticalPositionRef = useRef(20); // Start at y=20
  
  // Input state
  const keysPressed = useRef({
    w: false, // move up
    s: false, // move down
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
  
  // Normalizes an angle to the range [-π, π]
  const normalizeAngle = (angle: number): number => {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  };
  
  // Animation and physics update
  useFrame((_, delta) => {
    // Clamp delta time to prevent large jumps when frame rate drops
    const clampedDelta = Math.min(delta, 0.1);
    
    if (!planeRef.current) return;
    
    // Get current plane orientation
    const currentRotation = planeRef.current.quaternion.clone();
    const rotationEuler = new Euler().setFromQuaternion(currentRotation);
    
    // Update our rotation state from the current euler angles
    rotationStateRef.current.pitch = rotationEuler.x;
    rotationStateRef.current.yaw = rotationEuler.y;
    rotationStateRef.current.roll = rotationEuler.z;
    
    // Apply inputs with damping
    let pitchInput = 0;
    let turnInput = 0;
    let speedInput = 0;
    let verticalInput = 0;
    
    // Process inputs - W/S control vertical movement directly AND apply visual pitch
    if (keysPressed.current.w) {
      verticalInput += VERTICAL_SPEED * clampedDelta;
      // Apply full pitch for visual feedback, but keep vertical movement separate
      pitchInput += PITCH_SPEED * clampedDelta; // REVERSED: Now positive pitch for going up (nose up)
    }
    if (keysPressed.current.s) {
      verticalInput -= VERTICAL_SPEED * clampedDelta;
      // Apply full pitch for visual feedback, but keep vertical movement separate
      pitchInput -= PITCH_SPEED * clampedDelta; // REVERSED: Now negative pitch for going down (nose down)
    }
    if (keysPressed.current.a) turnInput += TURN_SPEED * clampedDelta; // Now turn right
    if (keysPressed.current.d) turnInput -= TURN_SPEED * clampedDelta; // Now turn left
    if (keysPressed.current.q) speedInput += ACCELERATION * clampedDelta;
    if (keysPressed.current.e) speedInput -= ACCELERATION * clampedDelta;
    
    // Update speed with limits
    const newSpeed = MathUtils.clamp(
      speed + speedInput,
      MIN_SPEED,
      MAX_SPEED
    );
    setSpeed(newSpeed);
    setSpeedPercentage(Math.round((newSpeed / MAX_SPEED) * 100));
    
    // Process direct vertical movement
    verticalPositionRef.current += verticalInput;
    // Add a minimum and maximum altitude
    verticalPositionRef.current = MathUtils.clamp(
      verticalPositionRef.current,
      5, // Minimum altitude
      100 // Maximum altitude
    );
    
    // Apply pitch with constraints - now with full pitch visual feedback
    if (pitchInput !== 0) {
      rotationStateRef.current.pitch += pitchInput;
      // Constrain pitch to prevent loops
      rotationStateRef.current.pitch = MathUtils.clamp(
        rotationStateRef.current.pitch,
        -MAX_PITCH_ANGLE,
        MAX_PITCH_ANGLE
      );
    } else {
      // Auto-level pitch when not pitching
      rotationStateRef.current.pitch = MathUtils.lerp(
        rotationStateRef.current.pitch,
        0,
        AUTO_LEVEL_SPEED * clampedDelta
      );
    }
    
    // Apply turn (yaw) and calculate banking (roll)
    if (turnInput !== 0) {
      // Apply yaw (turning) - normalize to prevent overflow
      rotationStateRef.current.yaw = normalizeAngle(rotationStateRef.current.yaw + turnInput);
      
      // Calculate target roll based on turn input (banking into turns)
      const targetRoll = -turnInput * 0.7; // Banking angle proportional and opposite to turn
      
      // Smoothly interpolate current roll towards target roll
      rotationStateRef.current.roll = MathUtils.lerp(
        rotationStateRef.current.roll,
        targetRoll,
        0.2 // Smooth transition factor
      );
      
      // Constrain roll to prevent extreme banking
      rotationStateRef.current.roll = MathUtils.clamp(
        rotationStateRef.current.roll,
        -MAX_ROLL_ANGLE,
        MAX_ROLL_ANGLE
      );
    } else {
      // Auto-level the roll when not turning
      rotationStateRef.current.roll = MathUtils.lerp(
        rotationStateRef.current.roll,
        0,
        AUTO_LEVEL_SPEED * clampedDelta
      );
    }
    
    // Create new target rotation from our constrained and normalized values
    const targetRotationEuler = new Euler(
      rotationStateRef.current.pitch,
      rotationStateRef.current.yaw,
      rotationStateRef.current.roll,
      'XYZ' // Explicitly set the order to avoid issues
    );
    
    // Convert Euler back to Quaternion
    targetQuaternionRef.current.setFromEuler(targetRotationEuler);
    
    // Smoothly interpolate current rotation towards target
    planeRef.current.quaternion.slerp(
      targetQuaternionRef.current,
      DAMPING * clampedDelta * 10
    );
    
    // Calculate direction from plane's orientation (horizontal movement only)
    const forwardDirection = new Vector3(0, 0, -1).applyQuaternion(planeRef.current.quaternion);
    // Flatten the y component for more level flight - horizontal movement is based on yaw, not pitch
    forwardDirection.y = 0; // Completely remove vertical influence from orientation
    forwardDirection.normalize();
    
    // Set velocity based on direction and speed
    velocityRef.current.copy(forwardDirection);
    velocityRef.current.multiplyScalar(newSpeed * clampedDelta);
    
    // Update plane position based on velocity (horizontal movement)
    const newPosition = planeRef.current.position.clone().add(velocityRef.current);
    // Set y position directly from our vertical position reference
    newPosition.y = verticalPositionRef.current;
    planeRef.current.position.copy(newPosition);
    
    // Position camera behind and above plane - birds-eye view
    // Apply yaw for horizontal rotation, but reduce the effect of pitch on camera
    const cameraYaw = new Euler(0, rotationStateRef.current.yaw, 0);
    const horizontalOffset = new Vector3(0, 0, 15); // Further back for wider view
    horizontalOffset.applyQuaternion(new Quaternion().setFromEuler(cameraYaw));
    
    // Create a camera position that's more overhead but still follows the plane's orientation
    const cameraPosition = planeRef.current.position.clone()
      .add(horizontalOffset)
      .add(new Vector3(0, 12, 0)); // Higher up for birds-eye view
    
    // Make camera position follow plane with smooth damping
    camera.position.lerp(cameraPosition, 0.05);
    
    // Create a look target that's ahead of the plane to keep it in frame
    // The target is offset based on pitch to show more of what's ahead when nose is down
    const pitchOffset = Math.max(0, -rotationStateRef.current.pitch * 5); // More forward offset when pitching down
    const lookTarget = planeRef.current.position.clone()
      .add(new Vector3(0, -1, -pitchOffset)); // Look ahead based on pitch
    
    // Make camera look at plane/forward position
    camera.lookAt(lookTarget);
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
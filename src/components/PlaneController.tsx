import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Quaternion, Euler, Object3D, MathUtils, Group, Box3, Sphere } from 'three';
import { Plane } from './Plane';
import { ControlsUI } from './ControlsUI';
import { Html, OrbitControls } from '@react-three/drei';

// Physics constants
const MAX_SPEED = 50;
const MIN_SPEED = 10;
const ACCELERATION = 10;
const PITCH_SENSITIVITY = 0.8;
const ROLL_SENSITIVITY = 2.0;
const TURN_SENSITIVITY = 1.5;
const AUTO_LEVEL_SPEED = 2;
const DAMPING = 0.95;
const CAMERA_DAMPING = 0.03;

// Angle constraints
const MAX_PITCH_ANGLE = Math.PI / 3; // 60 degrees
const MAX_ROLL_ANGLE = Math.PI / 4;  // 45 degrees
const MAX_TURN_RATE = Math.PI / 30; // Maximum turn rate per frame (prevents extreme turns)

// Collision constants
const PLANE_COLLISION_RADIUS = 2; // Size of collision sphere around the plane
const GROUND_LEVEL = 1; // Height of the ground
const BUILDING_REGISTRY = new Map(); // Registry to store building positions and sizes
const COLLISION_COOLDOWN = 1000; // Cooldown in ms to prevent multiple collisions

// Expose building registry to the global window object for access by other components
if (typeof window !== 'undefined') {
  (window as any).BUILDING_REGISTRY = BUILDING_REGISTRY;
}

export function PlaneController() {
  // References
  const planeRef = useRef<Group>(null);
  const cameraRef = useRef(new Object3D());
  const orbitControlsRef = useRef<any>(null);
  
  // State for plane physics
  const [speed, setSpeed] = useState(30); // Start at 30 units of speed
  const [speedPercentage, setSpeedPercentage] = useState(60); // 60% of max speed
  const velocityRef = useRef(new Vector3(0, 0, 1));
  const targetQuaternionRef = useRef(new Quaternion());
  const currentQuaternionRef = useRef(new Quaternion());
  
  // Camera mode
  const [freeCamMode, setFreeCamMode] = useState(false);
  
  // Collision state
  const [isColliding, setIsColliding] = useState(false);
  const [collisionMessage, setCollisionMessage] = useState('');
  const lastCollisionTime = useRef(0);
  const planeCollider = useRef(new Sphere(new Vector3(), PLANE_COLLISION_RADIUS));
  
  // Current rotation state
  const rotationStateRef = useRef({
    pitch: -0.1, // Start with slight nose-down attitude
    yaw: 0,
    roll: 0
  });
  
  // Input state (normalized from -1 to 1)
  const inputStateRef = useRef({
    pitch: 0,
    roll: 0,
    speed: 0
  });
  
  // Start position - outside city approaching inward
  const startPosition = useRef(new Vector3(0, 30, -50));
  
  // Input state
  const keysPressed = useRef({
    w: false, // pitch down
    s: false, // pitch up
    a: false, // roll left
    d: false, // roll right
    q: false, // speed up
    e: false, // slow down
    c: false, // toggle camera mode
  });
  
  // Get camera from Three.js context
  const { camera, scene } = useThree();
  
  // Set up key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() in keysPressed.current) {
        keysPressed.current[e.key.toLowerCase() as keyof typeof keysPressed.current] = true;
      }
      
      // Add reset key (R) to recover from collision
      if (e.key.toLowerCase() === 'r') {
        resetPlane();
      }
      
      // Toggle camera mode
      if (e.key.toLowerCase() === 'c' && !keysPressed.current.c) {
        setFreeCamMode(!freeCamMode);
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
  }, [freeCamMode]);
  
  // Toggle orbit controls based on camera mode
  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = freeCamMode;
    }
  }, [freeCamMode]);
  
  // Function to reset plane after collision
  const resetPlane = () => {
    if (planeRef.current) {
      planeRef.current.position.copy(startPosition.current);
      planeRef.current.quaternion.set(0, 0, 0, 1);
      rotationStateRef.current = { pitch: -0.1, yaw: 0, roll: 0 };
      setSpeed(30);
      setSpeedPercentage(60);
      setIsColliding(false);
      setCollisionMessage('');
    }
  };
  
  // Register a building for collision detection
  const registerBuilding = (position: Vector3, size: Vector3, id: string) => {
    BUILDING_REGISTRY.set(id, { position, size });
  };
  
  // Unregister a building
  const unregisterBuilding = (id: string) => {
    BUILDING_REGISTRY.delete(id);
  };
  
  // Check for collision with buildings
  const checkBuildingCollisions = (planePosition: Vector3) => {
    // Update plane collider position
    planeCollider.current.center.copy(planePosition);
    
    // Check all registered buildings
    for (const [id, building] of BUILDING_REGISTRY.entries()) {
      // Create a bounding box for the building
      const buildingBox = new Box3(
        new Vector3(
          building.position.x - building.size.x / 2,
          building.position.y - building.size.y / 2,
          building.position.z - building.size.z / 2
        ),
        new Vector3(
          building.position.x + building.size.x / 2,
          building.position.y + building.size.y / 2,
          building.position.z + building.size.z / 2
        )
      );
      
      // Check if plane's sphere intersects with building's box
      if (buildingBox.intersectsSphere(planeCollider.current)) {
        return true;
      }
    }
    return false;
  };
  
  // Check for collision with ground
  const checkGroundCollision = (planePosition: Vector3) => {
    return planePosition.y - PLANE_COLLISION_RADIUS < GROUND_LEVEL;
  };
  
  // Handle collision 
  const handleCollision = (type: 'building' | 'ground') => {
    const now = Date.now();
    if (now - lastCollisionTime.current < COLLISION_COOLDOWN) return;
    
    lastCollisionTime.current = now;
    setIsColliding(true);
    
    if (type === 'building') {
      setCollisionMessage('Crashed into a building! Press R to reset');
    } else {
      setCollisionMessage('Crashed into the ground! Press R to reset');
    }
    
    // Reduce speed significantly on collision
    setSpeed(Math.max(MIN_SPEED, speed * 0.3));
    setSpeedPercentage(Math.round((Math.max(MIN_SPEED, speed * 0.3) / MAX_SPEED) * 100));
  };
  
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
    currentRotation.normalize(); // Normalize the quaternion to prevent drift
    const rotationEuler = new Euler().setFromQuaternion(currentRotation, 'YXZ');
    
    // Update our rotation state from the current euler angles
    rotationStateRef.current.pitch = rotationEuler.x;
    rotationStateRef.current.yaw = normalizeAngle(rotationEuler.y); // Ensure yaw stays normalized
    rotationStateRef.current.roll = rotationEuler.z;
    
    // Skip input processing if colliding
    if (!isColliding) {
      // Reset input state
      inputStateRef.current = {
        pitch: 0,
        roll: 0,
        speed: 0
      };
      
      // Process inputs - normalize to range [-1, 1]
      if (keysPressed.current.w) inputStateRef.current.pitch += 1;
      if (keysPressed.current.s) inputStateRef.current.pitch -= 1;
      if (keysPressed.current.a) inputStateRef.current.roll += 1;
      if (keysPressed.current.d) inputStateRef.current.roll -= 1;
      if (keysPressed.current.q) inputStateRef.current.speed += 1;
      if (keysPressed.current.e) inputStateRef.current.speed -= 1;
      
      // Apply sensitivity
      const pitchInput = inputStateRef.current.pitch * PITCH_SENSITIVITY * clampedDelta;
      const rollInput = inputStateRef.current.roll * ROLL_SENSITIVITY * clampedDelta;
      const speedInput = inputStateRef.current.speed * ACCELERATION * clampedDelta;
      
      // Update speed with limits
      const newSpeed = MathUtils.clamp(
        speed + speedInput,
        MIN_SPEED,
        MAX_SPEED
      );
      setSpeed(newSpeed);
      setSpeedPercentage(Math.round((newSpeed / MAX_SPEED) * 100));
      
      // Apply pitch with constraints
      if (pitchInput !== 0) {
        rotationStateRef.current.pitch += pitchInput;
        // Constrain pitch to prevent loops
        rotationStateRef.current.pitch = MathUtils.clamp(
          rotationStateRef.current.pitch,
          -MAX_PITCH_ANGLE,
          MAX_PITCH_ANGLE
        );
      } else {
        // Auto-level pitch when no inputs are detected
        rotationStateRef.current.pitch = MathUtils.lerp(
          rotationStateRef.current.pitch,
          0,
          AUTO_LEVEL_SPEED * clampedDelta
        );
      }
      
      // Apply roll and calculate yaw coupling
      if (rollInput !== 0) {
        rotationStateRef.current.roll += rollInput;
        
        // Constrain roll to prevent extreme banking
        rotationStateRef.current.roll = MathUtils.clamp(
          rotationStateRef.current.roll,
          -MAX_ROLL_ANGLE,
          MAX_ROLL_ANGLE
        );
        
        // Apply bank-proportional turning (negative sign in yaw calculation)
        rotationStateRef.current.yaw += -rotationStateRef.current.roll * TURN_SENSITIVITY * clampedDelta;
      } else {
        // Auto-level roll when no inputs are detected
        rotationStateRef.current.roll = MathUtils.lerp(
          rotationStateRef.current.roll,
          0,
          AUTO_LEVEL_SPEED * clampedDelta
        );
      }
      
      // Normalize yaw angle
      rotationStateRef.current.yaw = normalizeAngle(rotationStateRef.current.yaw);
      
      // Calculate new quaternion rotation in YXZ order
      const targetEuler = new Euler(
        rotationStateRef.current.pitch,
        rotationStateRef.current.yaw,
        rotationStateRef.current.roll,
        'YXZ'
      );
      targetQuaternionRef.current.setFromEuler(targetEuler);
      
      // Apply the rotation to the plane
      planeRef.current.quaternion.copy(targetQuaternionRef.current);
      
      // Calculate forward movement direction based on orientation and speed
      const forwardDirection = new Vector3(0, 0, -1);
      forwardDirection.applyQuaternion(planeRef.current.quaternion);
      forwardDirection.normalize();
      
      // Calculate new position
      const movement = forwardDirection.multiplyScalar(newSpeed * clampedDelta);
      const newPosition = planeRef.current.position.clone().add(movement);
      
      // Check for collisions before applying new position
      if (checkGroundCollision(newPosition)) {
        handleCollision('ground');
      } else if (checkBuildingCollisions(newPosition)) {
        handleCollision('building');
      }
      
      // Update position if no collision (or already in colliding state)
      planeRef.current.position.copy(newPosition);
    }
    
    // Handle camera position if not in free cam mode
    if (!freeCamMode) {
      // Create a stable camera reference based on the plane's quaternion
      const cameraQuat = planeRef.current.quaternion.clone();
      
      // Use a fixed distance vector for more stable following
      const horizontalOffset = new Vector3(0, 0, 25); // Further back for wider view
      horizontalOffset.applyQuaternion(cameraQuat);
      
      // Create a final camera position with height offset
      const targetCameraPosition = planeRef.current.position.clone()
        .add(horizontalOffset)
        .add(new Vector3(0, 8, 0)); // Camera height
      
      // Apply damping for camera movement
      camera.position.lerp(targetCameraPosition, CAMERA_DAMPING);
      
      // Create a stable look target at the plane
      const lookTarget = planeRef.current.position.clone();
      
      // Make camera look at plane
      camera.lookAt(lookTarget);
      camera.quaternion.normalize();
    }
  });
  
  return (
    <>
      <group ref={planeRef} position={startPosition.current.clone()}>
        <Plane />
      </group>
      
      {freeCamMode && (
        <OrbitControls ref={orbitControlsRef} target={planeRef.current?.position || new Vector3()} />
      )}
      
      <ControlsUI speedPercentage={speedPercentage} showCameraMode={freeCamMode} />
      
      {/* Collision message overlay */}
      {isColliding && (
        <Html fullscreen>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 0, 0, 0.7)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {collisionMessage}
          </div>
        </Html>
      )}
    </>
  );
} 
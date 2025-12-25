
import React, { useRef } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Polaroids } from './Polaroids';
import { TreeElementProps } from '../types';

// Augment the JSX namespace for React Three Fiber intrinsic elements to fix property existence errors
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

export const Experience: React.FC<TreeElementProps> = ({ isFormed, gestureX, gestureY, userPhotos = [] }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));

  useFrame((state, delta) => {
    if (groupRef.current) {
      const lerpFactor = 0.05;
      targetRotation.current.y += 0.002;
      
      const xRot = (gestureY - 0.5) * 0.4;
      const yRot = (gestureX - 0.5) * 0.4;
      
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, xRot, lerpFactor);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotation.current.y + yRot, lerpFactor);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, -5.5, 0]}>
        <cylinderGeometry args={[0.5, 0.8, 4, 12]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.8} />
      </mesh>

      <Foliage isFormed={isFormed} />
      <Ornaments isFormed={isFormed} />
      <Polaroids isFormed={isFormed} userPhotos={userPhotos} />
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#010a07" roughness={1} />
      </mesh>
      
      <pointLight position={[0, 5, 0]} intensity={20} color="#FFD700" />
      <spotLight position={[0, 15, 10]} angle={0.3} penumbra={1} intensity={15} color="#D4AF37" castShadow />
    </group>
  );
};

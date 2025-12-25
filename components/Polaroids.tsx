
import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

// Augment the JSX namespace for React Three Fiber intrinsic elements to fix property existence errors
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

const Polaroid: React.FC<{ 
  index: number; 
  total: number;
  isFormed: boolean;
  texture: THREE.Texture;
}> = ({ index, total, isFormed, texture }) => {
  const meshRef = useRef<THREE.Group>(null);
  const transitionRef = useRef(1);

  const { chaosPos, targetPos, targetRot } = useMemo(() => {
    const angle = (index / total) * Math.PI * 2;
    const h = 1.5 + Math.random() * 8.5; // 分布在树身
    const r = 3.5 + Math.random() * 2.5;
    
    return {
      chaosPos: new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      ),
      targetPos: new THREE.Vector3(
        r * Math.cos(angle),
        h - 6.0,
        r * Math.sin(angle)
      ),
      targetRot: new THREE.Euler(0, -angle + Math.PI / 2, 0)
    };
  }, [index, total]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    transitionRef.current = THREE.MathUtils.lerp(
      transitionRef.current,
      isFormed ? 1 : 0,
      delta * 1.2
    );

    meshRef.current.position.lerpVectors(chaosPos, targetPos, transitionRef.current);
    
    if (isFormed) {
      meshRef.current.rotation.set(
        targetRot.x,
        targetRot.y + Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.1,
        targetRot.z
      );
    } else {
      meshRef.current.rotation.y += delta;
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime + index) * 0.05;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <planeGeometry args={[1.2, 1.4]} />
        <meshStandardMaterial color="white" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.1, 0.01]}>
        <planeGeometry args={[1.0, 1.0]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const Polaroids: React.FC<{ isFormed: boolean, userPhotos: string[] }> = ({ isFormed, userPhotos }) => {
  // 仅在有照片时加载
  if (userPhotos.length === 0) return null;

  const textures = useLoader(THREE.TextureLoader, userPhotos);

  return (
    <group>
      {(Array.isArray(textures) ? textures : [textures]).map((tex, i) => (
        <Polaroid 
          key={userPhotos[i]} 
          index={i} 
          total={userPhotos.length}
          isFormed={isFormed} 
          texture={tex} 
        />
      ))}
    </group>
  );
};


import React, { useMemo, useRef } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { OrnamentData } from '../types';

// Augment the JSX namespace for React Three Fiber intrinsic elements to fix property existence errors
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// 显著增加装饰品数量
const BALL_COUNT = 150; 
const GIFT_COUNT = 60;
const LIGHT_COUNT = 300;

export const Ornaments: React.FC<{ isFormed: boolean }> = ({ isFormed }) => {
  const ballRef = useRef<THREE.InstancedMesh>(null);
  const giftRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const transitionRef = useRef(1);

  const generateOrnaments = (count: number, type: 'ball' | 'gift' | 'light'): OrnamentData[] => {
    const data: OrnamentData[] = [];
    for (let i = 0; i < count; i++) {
      const chaosPos: [number, number, number] = [
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      ];
      
      // 优化算法：使高度分布集中在底部 (0-11)
      // 使用 Math.pow(x, 1.8) 会让数值更多地出现在 0 附近
      const hBase = Math.pow(Math.random(), 1.8); 
      const height = hBase * 11.5; 
      
      const radiusAtHeight = (12.5 - height) * 0.42;
      const angle = Math.random() * Math.PI * 2;
      const targetPos: [number, number, number] = [
        radiusAtHeight * Math.cos(angle),
        height - 6.0,
        radiusAtHeight * Math.sin(angle)
      ];

      const weight = type === 'gift' ? 3.0 : type === 'ball' ? 1.0 : 0.2;
      const colors = ['#D4AF37', '#043927', '#8b0000', '#ffffff', '#FFD700'];
      
      data.push({
        type,
        color: type === 'light' ? '#FFD700' : colors[Math.floor(Math.random() * colors.length)],
        weight,
        chaosPos,
        targetPos,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: type === 'light' ? 0.04 : type === 'gift' ? 0.3 : 0.2
      });
    }
    return data;
  };

  const balls = useMemo(() => generateOrnaments(BALL_COUNT, 'ball'), []);
  const gifts = useMemo(() => generateOrnaments(GIFT_COUNT, 'gift'), []);
  const lights = useMemo(() => generateOrnaments(LIGHT_COUNT, 'light'), []);

  const tempObj = new THREE.Object3D();

  useFrame((state, delta) => {
    transitionRef.current = THREE.MathUtils.lerp(
      transitionRef.current,
      isFormed ? 1 : 0,
      delta * 1.5
    );

    const updateMesh = (mesh: THREE.InstancedMesh | null, data: OrnamentData[]) => {
      if (!mesh) return;
      data.forEach((orn, i) => {
        const t = Math.max(0, Math.min(1, transitionRef.current * (1 + orn.weight * 0.1) - (orn.weight * 0.05)));
        
        tempObj.position.set(
          THREE.MathUtils.lerp(orn.chaosPos[0], orn.targetPos[0], t),
          THREE.MathUtils.lerp(orn.chaosPos[1], orn.targetPos[1], t),
          THREE.MathUtils.lerp(orn.chaosPos[2], orn.targetPos[2], t)
        );
        
        if (!isFormed) {
          tempObj.position.y += Math.sin(state.clock.elapsedTime + i) * 0.2;
        }

        tempObj.rotation.set(
          orn.rotation[0] * (1 - t),
          orn.rotation[1] + (isFormed ? 0 : state.clock.elapsedTime),
          orn.rotation[2]
        );
        
        tempObj.scale.setScalar(orn.scale);
        tempObj.updateMatrix();
        mesh.setMatrixAt(i, tempObj.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateMesh(ballRef.current, balls);
    updateMesh(giftRef.current, gifts);
    updateMesh(lightRef.current, lights);
  });

  return (
    <>
      <instancedMesh ref={ballRef} args={[undefined, undefined, BALL_COUNT]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial metalness={0.9} roughness={0.1} color="#D4AF37" />
      </instancedMesh>
      
      <instancedMesh ref={giftRef} args={[undefined, undefined, GIFT_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8b0000" metalness={0.5} roughness={0.5} />
      </instancedMesh>

      <instancedMesh ref={lightRef} args={[undefined, undefined, LIGHT_COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#FFD700" />
      </instancedMesh>
    </>
  );
};

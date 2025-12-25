
import React, { useMemo, useRef } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

// Augment the JSX namespace for React Three Fiber intrinsic elements to fix property existence errors
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

const COUNT = 12000;

export const Foliage: React.FC<{ isFormed: boolean }> = ({ isFormed }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const transitionRef = useRef(1);

  const particles = useMemo(() => {
    const chaos = new Float32Array(COUNT * 3);
    const target = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Chaos position: Random in a large sphere
      const r = 10 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      chaos[i * 3 + 2] = r * Math.cos(phi);

      // Target position: Conical tree shape
      const height = Math.random() * 12; // 0 to 12
      const radiusAtHeight = (12 - height) * 0.45;
      const angle = Math.random() * Math.PI * 2;
      const spread = (Math.random() - 0.5) * 0.5;
      
      target[i * 3] = (radiusAtHeight + spread) * Math.cos(angle);
      target[i * 3 + 1] = height - 6; // Center vertically
      target[i * 3 + 2] = (radiusAtHeight + spread) * Math.sin(angle);

      sizes[i] = Math.random() * 0.15 + 0.05;
    }

    return { chaos, target, sizes };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    // Smooth transition between Chaos and Formed
    const speed = delta * 1.5;
    transitionRef.current = THREE.MathUtils.lerp(
      transitionRef.current, 
      isFormed ? 1 : 0, 
      speed
    );

    const material = pointsRef.current.material as THREE.ShaderMaterial;
    material.uniforms.uTransition.value = transitionRef.current;
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const shader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uTransition: { value: 1.0 },
      uColor: { value: new THREE.Color('#043927') },
      uGold: { value: new THREE.Color('#D4AF37') }
    },
    vertexShader: `
      attribute vec3 aTarget;
      attribute float aSize;
      uniform float uTransition;
      uniform float uTime;
      varying float vDistance;

      void main() {
        vec3 pos = mix(position, aTarget, uTransition);
        
        // Add some noise movement
        pos.x += sin(uTime * 1.5 + position.y) * 0.05 * (1.0 - uTransition);
        pos.y += cos(uTime * 1.2 + position.x) * 0.05 * (1.0 - uTransition);
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (400.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        vDistance = length(pos);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uGold;
      varying float vDistance;
      
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        
        float alpha = smoothstep(0.5, 0.4, dist);
        vec3 finalColor = mix(uColor, uGold, 0.2 + 0.3 * sin(vDistance * 0.5));
        gl_FragColor = vec4(finalColor, alpha);
      }
    `
  }), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={particles.chaos}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTarget"
          count={COUNT}
          array={particles.target}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={COUNT}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial 
        transparent 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        args={[shader]}
      />
    </points>
  );
};

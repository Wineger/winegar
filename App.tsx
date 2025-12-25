
import React, { useState, Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useLoader, ThreeElements } from '@react-three/fiber';
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- 类型定义 ---
// Augment the JSX namespace for React Three Fiber intrinsic elements to fix property existence errors
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

interface OrnamentData {
  type: 'ball' | 'gift' | 'light';
  color: string;
  weight: number;
  chaosPos: [number, number, number];
  targetPos: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

// --- 3D 组件：叶片粒子 ---
const Foliage: React.FC<{ isFormed: boolean }> = ({ isFormed }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const transitionRef = useRef(1);
  const COUNT = 12000;

  const particles = useMemo(() => {
    const chaos = new Float32Array(COUNT * 3);
    const target = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 10 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      chaos[i * 3 + 2] = r * Math.cos(phi);
      const height = Math.random() * 12;
      const radiusAtHeight = (12 - height) * 0.45;
      const angle = Math.random() * Math.PI * 2;
      target[i * 3] = radiusAtHeight * Math.cos(angle);
      target[i * 3 + 1] = height - 6;
      target[i * 3 + 2] = radiusAtHeight * Math.sin(angle);
      sizes[i] = Math.random() * 0.15 + 0.05;
    }
    return { chaos, target, sizes };
  }, []);

  const shader = useMemo(() => ({
    uniforms: { uTime: { value: 0 }, uTransition: { value: 1.0 }, uColor: { value: new THREE.Color('#043927') }, uGold: { value: new THREE.Color('#D4AF37') } },
    vertexShader: `
      attribute vec3 aTarget; attribute float aSize; uniform float uTransition; uniform float uTime; varying float vDistance;
      void main() {
        vec3 pos = mix(position, aTarget, uTransition);
        pos.x += sin(uTime * 1.5 + position.y) * 0.05 * (1.0 - uTransition);
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (400.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        vDistance = length(pos);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor; uniform vec3 uGold; varying float vDistance;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        vec3 finalColor = mix(uColor, uGold, 0.2 + 0.3 * sin(vDistance * 0.5));
        gl_FragColor = vec4(finalColor, smoothstep(0.5, 0.4, dist));
      }
    `
  }), []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    transitionRef.current = THREE.MathUtils.lerp(transitionRef.current, isFormed ? 1 : 0, delta * 1.5);
    (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTransition.value = transitionRef.current;
    (pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={particles.chaos} itemSize={3} />
        <bufferAttribute attach="attributes-aTarget" count={COUNT} array={particles.target} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={COUNT} array={particles.sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} args={[shader]} />
    </points>
  );
};

// --- 3D 组件：装饰品 ---
const Ornaments: React.FC<{ isFormed: boolean }> = ({ isFormed }) => {
  const ballRef = useRef<THREE.InstancedMesh>(null);
  const giftRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  const transitionRef = useRef(1);

  const BALL_COUNT = 180; 
  const GIFT_COUNT = 70;
  const LIGHT_COUNT = 350;

  const data = useMemo(() => {
    const gen = (count: number, type: 'ball' | 'gift' | 'light'): OrnamentData[] => {
      const arr: OrnamentData[] = [];
      for (let i = 0; i < count; i++) {
        const hBase = Math.pow(Math.random(), 2.2); // 更密集的底部分布
        const height = hBase * 11.5;
        const radiusAtHeight = (12.5 - height) * 0.42;
        const angle = Math.random() * Math.PI * 2;
        arr.push({
          type,
          color: type === 'light' ? '#FFD700' : ['#D4AF37', '#043927', '#8b0000', '#ffffff'][Math.floor(Math.random() * 4)],
          weight: Math.random(),
          chaosPos: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40],
          targetPos: [radiusAtHeight * Math.cos(angle), height - 6.0, radiusAtHeight * Math.sin(angle)],
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
          scale: type === 'light' ? 0.04 : type === 'gift' ? 0.35 : 0.22
        });
      }
      return arr;
    };
    return { balls: gen(BALL_COUNT, 'ball'), gifts: gen(GIFT_COUNT, 'gift'), lights: gen(LIGHT_COUNT, 'light') };
  }, []);

  const tempObj = new THREE.Object3D();
  useFrame((state, delta) => {
    transitionRef.current = THREE.MathUtils.lerp(transitionRef.current, isFormed ? 1 : 0, delta * 1.5);
    const update = (mesh: THREE.InstancedMesh | null, items: OrnamentData[]) => {
      if (!mesh) return;
      items.forEach((orn, i) => {
        const t = Math.max(0, Math.min(1, transitionRef.current * 1.2 - orn.weight * 0.2));
        tempObj.position.set(
          THREE.MathUtils.lerp(orn.chaosPos[0], orn.targetPos[0], t),
          THREE.MathUtils.lerp(orn.chaosPos[1], orn.targetPos[1], t),
          THREE.MathUtils.lerp(orn.chaosPos[2], orn.targetPos[2], t)
        );
        if (!isFormed) tempObj.position.y += Math.sin(state.clock.elapsedTime + i) * 0.1;
        tempObj.rotation.set(orn.rotation[0], orn.rotation[1] + (isFormed ? 0 : state.clock.elapsedTime), orn.rotation[2]);
        tempObj.scale.setScalar(orn.scale);
        tempObj.updateMatrix();
        mesh.setMatrixAt(i, tempObj.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    update(ballRef.current, data.balls);
    update(giftRef.current, data.gifts);
    update(lightRef.current, data.lights);
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

// --- 3D 组件：照片墙 ---
const Polaroids: React.FC<{ isFormed: boolean, userPhotos: string[] }> = ({ isFormed, userPhotos }) => {
  if (userPhotos.length === 0) return null;
  const textures = useLoader(THREE.TextureLoader, userPhotos);

  return (
    <group>
      {(Array.isArray(textures) ? textures : [textures]).map((tex, i) => (
        <PolaroidItem key={userPhotos[i]} index={i} total={userPhotos.length} isFormed={isFormed} texture={tex} />
      ))}
    </group>
  );
};

const PolaroidItem: React.FC<{ index: number, total: number, isFormed: boolean, texture: THREE.Texture }> = ({ index, total, isFormed, texture }) => {
  const meshRef = useRef<THREE.Group>(null);
  const transitionRef = useRef(1);
  const config = useMemo(() => {
    const angle = (index / total) * Math.PI * 2;
    const h = 1.5 + Math.random() * 8.5;
    const r = 3.5 + Math.random() * 2.5;
    return {
      chaos: new THREE.Vector3((Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50),
      target: new THREE.Vector3(r * Math.cos(angle), h - 6.0, r * Math.sin(angle)),
      rot: new THREE.Euler(0, -angle + Math.PI / 2, 0)
    };
  }, [index, total]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    transitionRef.current = THREE.MathUtils.lerp(transitionRef.current, isFormed ? 1 : 0, delta * 1.2);
    meshRef.current.position.lerpVectors(config.chaos, config.target, transitionRef.current);
    if (isFormed) {
      meshRef.current.rotation.set(config.rot.x, config.rot.y + Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.1, config.rot.z);
    } else {
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh><planeGeometry args={[1.2, 1.4]} /><meshStandardMaterial color="white" side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.1, 0.01]}><planeGeometry args={[1.0, 1.0]} /><meshBasicMaterial map={texture} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

// --- UI 组件：视觉分析器 ---
const VisionHandler: React.FC<{ onGestureUpdate: (f: boolean, x: number, y: number) => void }> = ({ onGestureUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120 } }).then(s => {
      if (videoRef.current) videoRef.current.srcObject = s;
    });
    const itv = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0, 160, 120);
      const data = ctx.getImageData(0, 0, 160, 120).data;
      let tx = 0, ty = 0, c = 0, minX = 160, maxX = 0, minY = 120, maxY = 0;
      for (let i = 0; i < data.length; i += 4) {
        if ((data[i] + data[i+1] + data[i+2]) / 3 > 190) {
          const x = (i/4)%160, y = Math.floor((i/4)/160);
          tx += x; ty += y; c++;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
      if (c > 50) onGestureUpdate(!((maxX-minX)*(maxY-minY) > 1800), 1 - (tx/c)/160, (ty/c)/120);
    }, 100);
    return () => clearInterval(itv);
  }, [onGestureUpdate]);

  return (
    <div className="fixed top-8 right-8 z-50 flex flex-col items-end gap-2">
      <div className="w-40 h-28 border-2 border-[#D4AF37]/60 rounded overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1] opacity-70" />
        <canvas ref={canvasRef} width={160} height={120} className="hidden" />
      </div>
      <p className="text-[9px] text-[#D4AF37]/40 font-luxury uppercase tracking-widest">Vision Hand Tracking</p>
    </div>
  );
};

// --- 主应用组件 ---
const App: React.FC = () => {
  const [isFormed, setIsFormed] = useState(true);
  const [gesture, setGesture] = useState({ x: 0, y: 0 });
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full h-screen relative bg-black">
      <Canvas shadows gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={45} />
          <group rotation={[gesture.y * 0.4, gesture.x * 0.4, 0]}>
            <mesh position={[0, -5.5, 0]}><cylinderGeometry args={[0.5, 0.8, 4, 12]} /><meshStandardMaterial color="#3d2b1f" /></mesh>
            <Foliage isFormed={isFormed} />
            <Ornaments isFormed={isFormed} />
            <Polaroids isFormed={isFormed} userPhotos={userPhotos} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.5, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} /><meshStandardMaterial color="#000" />
            </mesh>
          </group>
          <Environment preset="lobby" />
          <EffectComposer multisampling={4}>
            <Bloom luminanceThreshold={0.8} mipmapBlur intensity={1.5} />
            <Vignette darkness={1.2} />
          </EffectComposer>
        </Suspense>
        <OrbitControls enablePan={false} minDistance={10} maxDistance={30} />
      </Canvas>

      <VisionHandler onGestureUpdate={(f, x, y) => { setIsFormed(f); setGesture({ x: x - 0.5, y: y - 0.5 }); }} />

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-12 text-[#D4AF37]">
        <header className="animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-luxury font-black tracking-tighter mb-2">圣诞快乐</h1>
          <p className="text-lg uppercase tracking-[0.4em] font-luxury opacity-60">Memory Tree 2024</p>
        </header>

        <footer className="pointer-events-auto flex flex-col items-start gap-4">
          <div className="flex flex-wrap gap-2 max-w-full">
            {userPhotos.map((url, i) => (
              <div key={i} className="relative w-14 h-14 border border-[#D4AF37]/40">
                <img src={url} className="w-full h-full object-cover" />
                <button onClick={() => setUserPhotos(p => p.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-red-600 text-white w-4 h-4 text-[8px] flex items-center justify-center">✕</button>
              </div>
            ))}
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="bg-[#D4AF37] text-black px-8 py-4 font-luxury font-bold uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95">上传照片</button>
          <input type="file" ref={fileInputRef} multiple accept="image/*" className="hidden" onChange={e => {
            if (e.target.files) setUserPhotos(p => [...p, ...Array.from(e.target.files!).map(f => URL.createObjectURL(f))]);
          }} />
        </footer>
      </div>
    </div>
  );
};

export default App;

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';

// This component runs inside Canvas
function AvatarScene() {
  const { scene } = useGLTF('/models/68bc44744b2306b86e39ec94.glb');
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const mixer = useRef();

  useEffect(() => {
    const loader = new FBXLoader();
    loader.load('/animations/Pointing.fbx', (anim) => {
      mixer.current = new THREE.AnimationMixer(clone);
      const action = mixer.current.clipAction(anim.animations[0]);
      action.play();
      action.setLoop(THREE.LoopRepeat, Infinity);
    });
  }, [clone]);

  useFrame((state, delta) => {
    if (mixer.current) mixer.current.update(delta);
  });

  return <primitive object={clone} scale={[2.2, 2.2, 1.8]} position={[0, -2.3, 0]} />;
}

// Wrapper component that includes Canvas
export default function Avatar() {
  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[0, 5, 5]} intensity={1} />
        <AvatarScene />
        <OrbitControls enableRotate={false} enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/68bc44744b2306b86e39ec94.glb');

'use client';

/**
 * WelcomeModelViewer - Simplified 3D model viewer for onboarding
 *
 * A streamlined version of MonsterViewer specifically for the welcome/onboarding
 * experience. Features:
 * - No control panel (auto-rotate only)
 * - Transparent background (shader shows through)
 * - Sized for hero display
 * - Orbit controls for user interaction
 */

import { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface ModelProps {
  url: string;
}

function Model({ url }: ModelProps) {
  const ref = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, url);
  const { viewport } = useThree();

  // Animation state for scaling
  const [animatedScale, setAnimatedScale] = useState(0);
  const [targetScale, setTargetScale] = useState(1);

  // Calculate optimal scale based on model bounding box and viewport
  // Target 50% of viewport height for hero display
  const optimalScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    const targetHeight = viewport.height * 0.5;
    return targetHeight / maxDimension;
  }, [gltf.scene, viewport.height]);

  useEffect(() => {
    setTargetScale(optimalScale);
  }, [optimalScale]);

  useFrame((state, delta) => {
    // Smooth scale animation
    if (animatedScale < targetScale) {
      const newScale = Math.min(targetScale, animatedScale + delta * 6);
      setAnimatedScale(newScale);
    }

    // Slow auto-rotation for ambient effect
    if (ref.current) {
      ref.current.rotation.y += delta * 0.15;
    }
  });

  // Clone scene and apply default material properties
  const processedScene = useMemo(() => {
    const clonedScene = gltf.scene.clone();
    // Keep original materials - no color override for welcome display
    return clonedScene;
  }, [gltf.scene]);

  return (
    <group
      ref={ref}
      scale={[animatedScale, animatedScale, animatedScale]}
      rotation={[0, -Math.PI / 2, 0]}
    >
      <primitive object={processedScene} />
    </group>
  );
}

interface WelcomeModelViewerProps {
  modelUrl: string;
  className?: string;
}

export function WelcomeModelViewer({
  modelUrl,
  className = '',
}: WelcomeModelViewerProps) {
  return (
    <div className={`${className} w-full h-full`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={5}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={2.5} />

        {/* No fallback - model is preloaded during NarrativeLoadingScreen */}
        <Suspense fallback={null}>
          <Model url={modelUrl} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          autoRotate={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}

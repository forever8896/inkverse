'use client';

import { Suspense, useRef, useMemo, useState, Component } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface MiniModelProps {
  url: string;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  ModelErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ModelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function MiniModel({ url }: MiniModelProps) {
  const ref = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, url);
  const { viewport } = useThree();

  // Clone the scene to avoid sharing issues between multiple instances
  const clonedScene = useMemo(() => {
    return gltf.scene.clone(true);
  }, [gltf.scene]);

  // Calculate optimal scale based on model bounding box
  const optimalScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const targetHeight = viewport.height * 0.7;
    return targetHeight / maxDimension;
  }, [clonedScene, viewport.height]);

  // Auto-rotation
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={ref} scale={[optimalScale, optimalScale, optimalScale]} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

function MiniLoader() {
  return (
    <Html center>
      <div className="w-5 h-5 border-2 border-[var(--mi-mint)] border-t-transparent rounded-full animate-spin" />
    </Html>
  );
}

interface MiniMonsterViewerProps {
  modelUrl: string;
  onError?: () => void;
  isVisible?: boolean;
}

export function MiniMonsterViewer({ modelUrl, onError, isVisible = true }: MiniMonsterViewerProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError || !isVisible) {
    return null;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        powerPreference: 'default',
        alpha: true,
      }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={2.5} />
      <directionalLight position={[5, 5, 5]} intensity={3} />
      <directionalLight position={[-3, 2, -3]} intensity={1.5} />

      <Suspense fallback={<MiniLoader />}>
        <ModelErrorBoundary onError={handleError}>
          <MiniModel url={modelUrl} />
        </ModelErrorBoundary>
      </Suspense>
    </Canvas>
  );
}

'use client';

import {
  Suspense,
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
  Component,
} from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  ContactShadows,
  Html,
  useProgress,
} from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { RotateCcw, Loader2 } from 'lucide-react';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="mb-4">
          <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="text-sm">Loading monster... {Math.round(progress)}%</p>
      </div>
    </Html>
  );
}

interface ModelProps {
  url: string;
  color: string;
  metallic: number;
  roughness: number;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ModelErrorBoundary extends Component<
  { children: React.ReactNode; onError: (error: Error) => void },
  ModelErrorBoundaryState
> {
  constructor(props: {
    children: React.ReactNode;
    onError: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ModelErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Html center>
          <div className="text-white text-center p-8 bg-red-800/80 rounded-lg backdrop-blur-sm">
            <div className="mb-4 text-6xl">❌</div>
            <h2 className="text-xl font-semibold mb-2">Model Loading Error</h2>
            <p className="text-red-200 mb-4">
              Could not load the 3D model. This could be due to:
            </p>
            <ul className="text-red-200 text-sm space-y-1 mb-4">
              <li>• Model is still being processed</li>
              <li>• Network connectivity issues</li>
              <li>• Invalid model file format</li>
            </ul>
            <div className="text-xs text-red-300 mt-2 p-2 bg-red-900/50 rounded">
              Error: {this.state.error?.message}
            </div>
          </div>
        </Html>
      );
    }

    return this.props.children;
  }
}

function Model({ url, color, metallic, roughness }: ModelProps) {
  const ref = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, url);
  const { viewport } = useThree();

  // Animation state for scaling
  const [animatedScale, setAnimatedScale] = useState(0);
  const [targetScale, setTargetScale] = useState(1);

  // Calculate optimal scale based on model bounding box and viewport
  const optimalScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Target 65% of viewport height
    const targetHeight = viewport.height * 0.65;
    return targetHeight / maxDimension;
  }, [gltf.scene, viewport.height]);

  // Set target scale when optimal scale changes
  useEffect(() => {
    setTargetScale(optimalScale);
  }, [optimalScale]);

  useFrame((state, delta) => {
    // Smooth scale animation
    if (animatedScale < targetScale) {
      const newScale = Math.min(targetScale, animatedScale + delta * 8);
      setAnimatedScale(newScale);
    }

    // Gentle auto-rotation
    if (ref.current) {
      ref.current.rotation.y += delta * 0.2;
    }
  });

  // Memoize the scene with applied material properties
  const processedScene = useMemo(() => {
    const clonedScene = gltf.scene.clone();

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map((mat) => {
            const newMat = mat.clone();
            if (newMat instanceof THREE.MeshStandardMaterial) {
              newMat.color = new THREE.Color(color);
              newMat.metalness = metallic;
              newMat.roughness = roughness;
            }
            return newMat;
          });
        } else {
          const newMat = child.material.clone();
          if (newMat instanceof THREE.MeshStandardMaterial) {
            newMat.color = new THREE.Color(color);
            newMat.metalness = metallic;
            newMat.roughness = roughness;
          }
          child.material = newMat;
        }
      }
    });
    return clonedScene;
  }, [gltf.scene, color, metallic, roughness]);

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

interface MonsterViewerProps {
  modelUrl?: string;
  className?: string;
  height?: string;
  showControls?: boolean;
  autoRotate?: boolean;
  minimal?: boolean; // No border, background, or container styling
  enableZoom?: boolean; // Allow zooming with scroll wheel
}

export default function MonsterViewer({
  modelUrl,
  className = "",
  height = "h-96",
  showControls = true,
  autoRotate = true,
  minimal = false,
  enableZoom = true,
}: MonsterViewerProps) {
  const [modelExists, setModelExists] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [color, setColor] = useState('#8B5CF6');
  const [metallic, setMetallic] = useState(0.2);
  const [roughness, setRoughness] = useState(0.8);
  const [lightIntensity, setLightIntensity] = useState(6);

  const handleReset = () => {
    setColor('#8B5CF6');
    setMetallic(0.2);
    setRoughness(0.8);
    setLightIntensity(6);
    setModelError(null);
  };

  const handleModelError = useCallback((error: Error) => {
    setModelError(error.message);
    setModelExists(false);
  }, []);

  const containerClasses = minimal
    ? `${className} ${height} relative overflow-hidden`
    : `${className} ${height} relative bg-slate-900 rounded-xl border border-slate-600 overflow-hidden`;

  if (!modelUrl) {
    return (
      <div className={minimal ? `${className} ${height} flex items-center justify-center` : `${className} ${height} bg-slate-900 rounded-xl border border-slate-600 flex items-center justify-center`}>
        <div className="text-center text-slate-400">
          <div className="text-4xl mb-4">🎮</div>
          <p>3D Model not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        shadows
        className={minimal ? "" : "bg-gradient-to-b from-slate-900 to-slate-800"}
      >
        <ambientLight intensity={0.6 * lightIntensity} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={lightIntensity}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5 * lightIntensity}
        />

        <Suspense fallback={<Loader />}>
          {modelExists ? (
            <>
              <ModelErrorBoundary onError={handleModelError}>
                <Model
                  url={modelUrl}
                  color={color}
                  metallic={metallic}
                  roughness={roughness}
                />
              </ModelErrorBoundary>
              <ContactShadows
                rotation-x={Math.PI / 2}
                position={[0, -2, 0]}
                opacity={0.8}
                width={10}
                height={10}
                blur={2.5}
                far={4}
              />
            </>
          ) : (
            <Html center>
              <div className="text-white text-center p-8 bg-gray-800/80 rounded-lg backdrop-blur-sm">
                <div className="mb-4 text-6xl">🦖</div>
                <h2 className="text-xl font-semibold mb-2">
                  3D Model Loading Failed
                </h2>
                <p className="text-gray-300 mb-4 max-w-sm">
                  The 3D model couldn't be loaded. This might be temporary.
                </p>
                {modelError && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                    <strong>Error:</strong> {modelError}
                  </div>
                )}
                <button
                  onClick={() => {
                    setModelExists(true);
                    setModelError(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            </Html>
          )}
        </Suspense>

        <OrbitControls
          enablePan={enableZoom}
          enableZoom={enableZoom}
          enableRotate={true}
          minDistance={1}
          maxDistance={20}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Controls */}
      {showControls && (
        <>
          {/* Reset Button */}
          <div className="absolute top-4 left-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>

          {/* Quick Controls Panel */}
          <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-600">
            <div className="space-y-2">
              {/* Color Control */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-300 w-12">Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-6 rounded border border-gray-600 cursor-pointer bg-transparent"
                />
              </div>

              {/* Light Control */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-300 w-12">Light</label>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                  className="w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* Metallic Control */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-300 w-12">Metal</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={metallic}
                  onChange={(e) => setMetallic(parseFloat(e.target.value))}
                  className="w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          background: #475569;
          height: 6px;
          border-radius: 3px;
          cursor: pointer;
          outline: none;
        }

        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          border: 1px solid #1e40af;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
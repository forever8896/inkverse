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
  Environment,
  ContactShadows,
  Html,
  useProgress,
} from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { RotateCcw, Camera, Loader2, Image } from 'lucide-react';

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
              Could not load the 3D model. Please check:
            </p>
            <ul className="text-red-200 text-sm space-y-1 mb-4">
              <li>• File exists in the /public directory</li>
              <li>• File path is correct</li>
              <li>• File format is valid GLB/GLTF</li>
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

    // Target 65% of viewport height (5% less than 70%)
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
      const newScale = Math.min(targetScale, animatedScale + delta * 8); // 0.5 second animation (4x faster)
      setAnimatedScale(newScale);
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

interface BackgroundProps {
  backdrop: 'gradient' | 'polkadot' | 'web3' | 'snowden';
}

function Background({ backdrop }: BackgroundProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (backdrop === 'gradient') {
      // Remove any existing background and environment
      scene.background = null;
      scene.environment = null;
    } else {
      // Load and set the image background
      const textureLoader = new THREE.TextureLoader();
      // Determine file extension based on backdrop
      let extension = 'jpg'; // default
      if (backdrop === 'polkadot' || backdrop === 'web3') {
        extension = 'webp';
      }
      const backgroundTexture = textureLoader.load(
        `/backdrops/${backdrop}.${extension}`
      );

      // Set as background
      scene.background = backgroundTexture;

      // Also set as environment map for reflections
      backgroundTexture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = backgroundTexture;
    }
  }, [backdrop, scene]);

  return null;
}

export default function MonsterViewer() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [lightIntensity, setLightIntensity] = useState(6);
  const [modelUrl, setModelUrl] = useState('/models/monster1.glb');
  const [modelExists, setModelExists] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [color, setColor] = useState('#8B5CF6');
  const [metallic, setMetallic] = useState(0.2);
  const [roughness, setRoughness] = useState(0.8);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showShutter, setShowShutter] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [backdrop, setBackdrop] = useState<
    'gradient' | 'polkadot' | 'web3' | 'snowden'
  >('gradient');

  const handleReset = () => {
    setLightIntensity(6);
    setColor('#8B5CF6');
    setMetallic(0.2);
    setRoughness(0.8);
    setBackdrop('gradient');
    setModelError(null);
  };

  const handleModelError = useCallback((error: Error) => {
    setModelError(error.message);
    setModelExists(false);
  }, []);

  const handleBackdropChange = useCallback(
    (newBackdrop: 'gradient' | 'polkadot' | 'web3' | 'snowden') => {
      setBackdrop(newBackdrop);
      // Set complementary colors for each backdrop
      switch (newBackdrop) {
        case 'gradient':
          // Keep current color for gradient
          setColor('#ffffff');
          break;
        case 'polkadot':
          setColor('#ff38a2'); // Magenta color matching Polkadot logo
          break;
        case 'web3':
          setColor('#ed8aff'); // Purple color for web3
          break;
        case 'snowden':
          setColor('#ff9100'); // Brown/beige color for snowden
          break;
      }
    },
    []
  );

  const captureNFT = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsCapturing(true);
    setShowShutter(true);

    // Shutter effect timing - longer for dramatic iris effect
    setTimeout(() => setShowShutter(false), 800);

    try {
      // Get the Three.js canvas
      const canvas = canvasRef.current.querySelector('canvas');
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      // Create a new canvas with NFT dimensions (1024x1024)
      const nftCanvas = document.createElement('canvas');
      const nftSize = 1024;
      nftCanvas.width = nftSize;
      nftCanvas.height = nftSize;

      const ctx = nftCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get 2D context');
      }

      // Fill background based on selected backdrop
      if (backdrop === 'gradient') {
        const gradient = ctx.createLinearGradient(0, 0, 0, nftSize);
        gradient.addColorStop(0, '#1e293b'); // slate-800
        gradient.addColorStop(1, '#0f172a'); // slate-900
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, nftSize, nftSize);
      } else {
        // For image backdrops, we'll fill with a dark color as fallback
        // The actual backdrop will be captured from the 3D canvas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, nftSize, nftSize);
      }

      // Calculate dimensions to fit the 3D render in the center
      const sourceSize = Math.min(canvas.width, canvas.height);
      const padding = nftSize * 0.1; // 10% padding
      const targetSize = nftSize - padding * 2;

      // Center the image
      ctx.drawImage(
        canvas,
        (canvas.width - sourceSize) / 2,
        (canvas.height - sourceSize) / 2,
        sourceSize,
        sourceSize,
        padding,
        padding,
        targetSize,
        targetSize
      );

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        nftCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      // Send to backend
      const formData = new FormData();
      formData.append('image', blob, 'monster-nft.png');

      const response = await fetch('/api/nft-snapshot', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Show success overlay
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        console.log('NFT saved:', result);
      } else {
        throw new Error(result.error || 'Failed to save NFT');
      }
    } catch (error) {
      console.error('Error creating NFT:', error);
      // Show error - you could create a similar overlay for errors if needed
      alert('❌ Failed to create NFT snapshot. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [backdrop]);

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Main 3D Viewport */}
      <div className="flex-1 relative" ref={canvasRef}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          shadows
          gl={{ preserveDrawingBuffer: true }}
          className="bg-gradient-to-b from-slate-900 to-slate-800"
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
                <Background backdrop={backdrop} />
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
                    No 3D Model Found
                  </h2>
                  <p className="text-gray-300 mb-4">
                    Place a{' '}
                    <code className="bg-gray-700 px-2 py-1 rounded">
                      monster.glb
                    </code>{' '}
                    file in the{' '}
                    <code className="bg-gray-700 px-2 py-1 rounded">
                      /public
                    </code>{' '}
                    directory
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
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={20}
          />
        </Canvas>

        {/* Floating Controls */}
        <div className="absolute top-4 left-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* NFT Capture Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={captureNFT}
            disabled={isCapturing || !modelExists || modelError !== null}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              isCapturing || !modelExists || modelError !== null
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/30 hover:scale-105'
            }`}
          >
            {isCapturing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating NFT...
              </>
            ) : (
              <>
                <Camera size={18} />
                Create NFT
              </>
            )}
          </button>
        </div>

        {/* Camera Shutter Effect */}
        {showShutter && (
          <div className="absolute inset-0 z-50 pointer-events-none">
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <div className="camera-shutter">
                {/* Multiple shutter blades for realistic effect */}
                <div className="shutter-blade blade-1"></div>
                <div className="shutter-blade blade-2"></div>
                <div className="shutter-blade blade-3"></div>
                <div className="shutter-blade blade-4"></div>
                <div className="shutter-blade blade-5"></div>
                <div className="shutter-blade blade-6"></div>
                <div className="shutter-blade blade-7"></div>
                <div className="shutter-blade blade-8"></div>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Circular Gradient Overlay */}
        <div className="absolute inset-0 z-30 pointer-events-none circular-gradient-overlay"></div>

        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-6 rounded-2xl shadow-2xl animate-bounce-in">
              <div className="text-center">
                <div className="text-4xl mb-2">📸</div>
                <h3 className="text-xl font-bold mb-1">NFT Created!</h3>
                <p className="text-green-100 text-sm">
                  Your monster has been captured
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Control Panel */}
      <div className="w-[420px] p-8 border-l border-slate-600/50 overflow-y-auto shadow-2xl relative">
        {/* Animated Shader Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="shader-bg h-full w-full"></div>
        </div>

        {/* Content overlay */}
        <div className="relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-1">
              MONSTER VIEWER
            </h1>
          </div>

          {/* Model Controls */}
          <div className="mb-4 p-4 bg-slate-700/30 backdrop-blur-sm rounded-xl border border-slate-600/30">
            {/* Model Selection */}
            <div className="mb-0">
              <div className="grid grid-cols-5 gap-1">
                {[1, 2, 3, 4, 5].map((modelNumber) => (
                  <button
                    key={modelNumber}
                    onClick={() => {
                      setModelUrl(`/models/monster${modelNumber}.glb`);
                      setModelExists(true);
                      setModelError(null);
                    }}
                    className={`relative group overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                      modelUrl === `/models/monster${modelNumber}.glb`
                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {/* Thumbnail image */}
                    <img
                      src={`/models/${modelNumber}.png`}
                      alt={`Monster ${modelNumber}`}
                      className="w-full aspect-square object-cover"
                    />

                    {/* Selection indicator */}
                    {modelUrl === `/models/monster${modelNumber}.glb` && (
                      <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Material Controls */}
          <div className="mb-4 p-4 bg-slate-700/30 backdrop-blur-sm rounded-xl border border-slate-600/30">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <span className="text-emerald-400 text-xs">🎨</span>
              Material
            </h3>

            {/* Color Control */}
            <div className="mb-3">
              <label className="flex items-center justify-between text-xs font-medium text-gray-300 mb-1.5">
                <span>Color</span>
                <span className="text-blue-400" style={{ color }}>
                  {color}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-8 rounded border-2 border-gray-600 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-3 py-1 bg-gray-600 text-white rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="#8B5CF6"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="flex items-center justify-between text-xs font-medium text-gray-300 mb-1.5">
                <span>Intensity</span>
                <span className="text-blue-400">
                  {lightIntensity.toFixed(1)}x
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={lightIntensity}
                onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Metallic Control */}
            <div className="mb-3">
              <label className="flex items-center justify-between text-xs font-medium text-gray-300 mb-1.5">
                <span>Metallic</span>
                <span className="text-blue-400">
                  {Math.round(metallic * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={metallic}
                onChange={(e) => setMetallic(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Roughness Control */}
            <div className="mb-3">
              <label className="flex items-center justify-between text-xs font-medium text-gray-300 mb-1.5">
                <span>Roughness</span>
                <span className="text-blue-400">
                  {Math.round(roughness * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={roughness}
                onChange={(e) => setRoughness(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Backdrop Controls */}
          <div className="mb-3 p-4 bg-slate-700/30 backdrop-blur-sm rounded-xl border border-slate-600/30">
            <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <span className="text-amber-400 text-xs">🖼️</span>
              Backdrop
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleBackdropChange('gradient')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  backdrop === 'gradient'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                <div className="w-8 h-8 rounded bg-gradient-to-br from-slate-700 to-slate-900 border border-gray-500"></div>
                <span>Default Gradient</span>
              </button>

              <button
                onClick={() => handleBackdropChange('polkadot')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  backdrop === 'polkadot'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                <div className="w-8 h-8 rounded bg-pink-500 border border-gray-500 flex items-center justify-center">
                  <span className="text-xs">🔗</span>
                </div>
                <span>Polkadot Theme</span>
              </button>

              <button
                onClick={() => handleBackdropChange('web3')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  backdrop === 'web3'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                <div className="w-8 h-8 rounded bg-purple-500 border border-gray-500 flex items-center justify-center">
                  <span className="text-xs">🌐</span>
                </div>
                <span>Web3 Theme</span>
              </button>

              <button
                onClick={() => handleBackdropChange('snowden')}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  backdrop === 'snowden'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                <div className="w-8 h-8 rounded bg-amber-600 border border-gray-500 flex items-center justify-center">
                  <span className="text-xs">🕵️</span>
                </div>
                <span>Snowden Theme</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .shader-bg {
          background:
            radial-gradient(
              circle at 20% 80%,
              rgba(120, 119, 198, 0.3) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 20%,
              rgba(255, 119, 198, 0.3) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 40% 40%,
              rgba(120, 219, 255, 0.2) 0%,
              transparent 50%
            );
          animation: shaderMove 20s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)
            forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0px);
          }
        }

        .circular-gradient-overlay {
          background: radial-gradient(
            circle at center,
            transparent 0%,
            transparent 30%,
            rgba(0, 0, 0, 0.1) 50%,
            rgba(0, 0, 0, 0.3) 70%,
            rgba(0, 0, 0, 0.5) 100%
          );
        }

        .camera-shutter {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }

        .shutter-blade {
          position: absolute;
          background: #1a1a1a;
          border: 2px solid #333;
          transform-origin: center;
          opacity: 0.95;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
        }

        /* Individual blade positioning and animations */
        .blade-1 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 100% 0%, 100% 25%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade1 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-2 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 100% 25%, 100% 50%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade2 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-3 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 100% 50%, 100% 75%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade3 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-4 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 100% 75%, 100% 100%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade4 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-5 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 75% 100%, 50% 100%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade5 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-6 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 25% 100%, 0% 100%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade6 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-7 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 0% 75%, 0% 25%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade7 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .blade-8 {
          width: 60vw;
          height: 60vh;
          top: 50%;
          left: 50%;
          clip-path: polygon(50% 50%, 0% 25%, 0% 0%, 25% 0%);
          transform: translate(-50%, -50%) rotate(0deg);
          animation: shutterBlade8 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Blade animations - each closes and opens at slightly different times */
        @keyframes shutterBlade1 {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
          30% {
            transform: translate(-50%, -50%) rotate(5deg) scale(1.2);
          }
          70% {
            transform: translate(-50%, -50%) rotate(-2deg) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
        }

        @keyframes shutterBlade2 {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
          35% {
            transform: translate(-50%, -50%) rotate(-3deg) scale(1.2);
          }
          65% {
            transform: translate(-50%, -50%) rotate(4deg) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
        }

        @keyframes shutterBlade3 {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
          40% {
            transform: translate(-50%, -50%) rotate(2deg) scale(1.2);
          }
          60% {
            transform: translate(-50%, -50%) rotate(-5deg) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
        }

        @keyframes shutterBlade4 {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
          45% {
            transform: translate(-50%, -50%) rotate(-4deg) scale(1.2);
          }
          55% {
            transform: translate(-50%, -50%) rotate(3deg) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
        }

        @keyframes shutterBlade5 {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
          50% {
            transform: translate(-50%, -50%) rotate(1deg) scale(1.2);
          }
          50% {
            transform: translate(-50%, -50%) rotate(-1deg) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
        }

        @keyframes shutterBlade6 {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
          45% {
            transform: translate(-50%, -50%) rotate(4deg) scale(1.2);
          }
          55% {
            transform: translate(-50%, -50%) rotate(-2deg) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
        }

        @keyframes shutterBlade7 {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
          40% {
            transform: translate(-50%, -50%) rotate(-1deg) scale(1.2);
          }
          60% {
            transform: translate(-50%, -50%) rotate(5deg) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
        }

        @keyframes shutterBlade8 {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
          35% {
            transform: translate(-50%, -50%) rotate(3deg) scale(1.2);
          }
          65% {
            transform: translate(-50%, -50%) rotate(-4deg) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(0);
          }
        }

        @keyframes shaderMove {
          0%,
          100% {
            background:
              radial-gradient(
                circle at 20% 80%,
                rgba(120, 119, 198, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 80% 20%,
                rgba(255, 119, 198, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 40% 40%,
                rgba(120, 219, 255, 0.2) 0%,
                transparent 50%
              );
          }
          25% {
            background:
              radial-gradient(
                circle at 60% 60%,
                rgba(120, 119, 198, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 30% 70%,
                rgba(255, 119, 198, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 70% 30%,
                rgba(120, 219, 255, 0.2) 0%,
                transparent 50%
              );
          }
          50% {
            background:
              radial-gradient(
                circle at 80% 20%,
                rgba(120, 119, 198, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 20% 80%,
                rgba(255, 119, 198, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 50% 70%,
                rgba(120, 219, 255, 0.2) 0%,
                transparent 50%
              );
          }
          75% {
            background:
              radial-gradient(
                circle at 40% 30%,
                rgba(120, 119, 198, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 70% 60%,
                rgba(255, 119, 198, 0.3) 0%,
                transparent 50%
              ),
              radial-gradient(
                circle at 30% 50%,
                rgba(120, 219, 255, 0.2) 0%,
                transparent 50%
              );
          }
        }

        input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          background: #475569;
          height: 8px;
          border-radius: 4px;
          cursor: pointer;
          outline: none;
        }

        input[type='range']::-webkit-slider-track {
          background: #475569;
          height: 8px;
          border-radius: 4px;
          border: none;
        }

        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          border: 2px solid #1e40af;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        input[type='range']::-moz-range-track {
          background: #475569;
          height: 8px;
          border-radius: 4px;
          border: none;
        }

        input[type='range']::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1e40af);
          border: 2px solid #1e40af;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        input[type='range']::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

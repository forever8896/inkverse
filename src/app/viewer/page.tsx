'use client';

import { Suspense, useRef, useState, useMemo, useCallback, useEffect, Component } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Sun, Moon, Camera, Loader2, Image } from 'lucide-react';

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
        <p className="text-sm">Loading 3D Model... {Math.round(progress)}%</p>
      </div>
    </Html>
  );
}

interface ModelProps {
  url: string;
  autoRotate: boolean;
  scale: number;
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
  constructor(props: { children: React.ReactNode; onError: (error: Error) => void }) {
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

function Model({ url, autoRotate, scale, color, metallic, roughness }: ModelProps) {
  const ref = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, url);
  
  useFrame((state, delta) => {
    if (ref.current && autoRotate) {
      ref.current.rotation.y += delta * 0.5;
    }
  });

  // Memoize the scene with applied material properties
  const processedScene = useMemo(() => {
    const clonedScene = gltf.scene.clone();
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(mat => {
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
    <group ref={ref} scale={[scale, scale, scale]}>
      <primitive object={processedScene} />
    </group>
  );
}

interface BackgroundProps {
  backdrop: 'gradient' | 'polkadot' | 'web3';
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
      const backgroundTexture = textureLoader.load(`/backdrops/${backdrop}.${backdrop === 'polkadot' ? 'webp' : 'jpg'}`);
      
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
  const [autoRotate, setAutoRotate] = useState(true);
  const [scale, setScale] = useState(1);
  const [lightIntensity, setLightIntensity] = useState(1);
  const [modelUrl, setModelUrl] = useState('/monster.glb');
  const [modelExists, setModelExists] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [color, setColor] = useState('#8B5CF6');
  const [metallic, setMetallic] = useState(0.2);
  const [roughness, setRoughness] = useState(0.8);
  const [isCapturing, setIsCapturing] = useState(false);
  const [backdrop, setBackdrop] = useState<'gradient' | 'polkadot' | 'web3'>('gradient');

  const handleReset = () => {
    setScale(1);
    setAutoRotate(true);
    setLightIntensity(1);
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

  const captureNFT = useCallback(async () => {
    if (!canvasRef.current) return;

    setIsCapturing(true);
    
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
      const targetSize = nftSize - (padding * 2);
      
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
        alert(`🎉 NFT snapshot created! Saved as: ${result.filename}`);
        console.log('NFT saved:', result);
      } else {
        throw new Error(result.error || 'Failed to save NFT');
      }

    } catch (error) {
      console.error('Error creating NFT:', error);
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
          <ambientLight intensity={0.4 * lightIntensity} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={lightIntensity}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5 * lightIntensity} />
          
          <Suspense fallback={<Loader />}>
            {modelExists ? (
              <>
                <ModelErrorBoundary onError={handleModelError}>
                  <Model 
                    url={modelUrl} 
                    autoRotate={autoRotate} 
                    scale={scale}
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
                  <h2 className="text-xl font-semibold mb-2">No 3D Model Found</h2>
                  <p className="text-gray-300 mb-4">
                    Place a <code className="bg-gray-700 px-2 py-1 rounded">monster.glb</code> file in the <code className="bg-gray-700 px-2 py-1 rounded">/public</code> directory
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
            autoRotate={autoRotate}
            autoRotateSpeed={2}
          />
        </Canvas>

        {/* Floating Controls */}
        <div className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              autoRotate
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {autoRotate ? <Pause size={16} /> : <Play size={16} />}
            {autoRotate ? 'Pause' : 'Rotate'}
          </button>
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md text-sm font-medium transition-colors"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* NFT Capture Button */}
        <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3">
          <button
            onClick={captureNFT}
            disabled={isCapturing || !modelExists || modelError !== null}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isCapturing || !modelExists || modelError !== null
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/25'
            }`}
          >
            {isCapturing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating NFT...
              </>
            ) : (
              <>
                <Camera size={16} />
                Create NFT
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Control Panel */}
      <div className="w-80 bg-gray-800 p-6 border-l border-gray-700 overflow-y-auto">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          🦖 Monster Viewer
        </h1>

        {/* Model Controls */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Model Controls</h3>
          
          {/* Scale Control */}
          <div className="mb-4">
            <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Scale</span>
              <span className="text-blue-400">{scale.toFixed(2)}x</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between mt-1">
              <button
                onClick={() => setScale(Math.max(0.1, scale - 0.1))}
                className="p-1 text-gray-400 hover:text-white"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={() => setScale(Math.min(3, scale + 0.1))}
                className="p-1 text-gray-400 hover:text-white"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>

          {/* Model URL Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Model Path
            </label>
            <input
              type="text"
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              onBlur={() => {
                setModelExists(true);
                setModelError(null);
              }}
              placeholder="/monster.glb"
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Relative to /public directory
            </p>
          </div>
        </div>

        {/* Material Controls */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Material Properties</h3>
          
          {/* Color Control */}
          <div className="mb-4">
            <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Color</span>
              <span className="text-blue-400" style={{ color }}>{color}</span>
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

          {/* Metallic Control */}
          <div className="mb-4">
            <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Metallic</span>
              <span className="text-blue-400">{Math.round(metallic * 100)}%</span>
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
          <div className="mb-4">
            <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Roughness</span>
              <span className="text-blue-400">{Math.round(roughness * 100)}%</span>
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

          {/* Quick Material Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Material Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setMetallic(0.9); setRoughness(0.1); }}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-md text-sm transition-colors"
              >
                🪙 Metal
              </button>
              <button
                onClick={() => { setMetallic(0.0); setRoughness(0.9); }}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-md text-sm transition-colors"
              >
                🧱 Matte
              </button>
              <button
                onClick={() => { setMetallic(0.1); setRoughness(0.2); }}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-md text-sm transition-colors"
              >
                💎 Glossy
              </button>
              <button
                onClick={() => { setMetallic(0.2); setRoughness(0.8); }}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-md text-sm transition-colors"
              >
                🔄 Default
              </button>
            </div>
          </div>
        </div>

        {/* Backdrop Controls */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">🖼️ Backdrop</h3>
          
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setBackdrop('gradient')}
              className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                backdrop === 'gradient'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              <div className="w-8 h-8 rounded bg-gradient-to-br from-slate-700 to-slate-900 border border-gray-500"></div>
              <span>Default Gradient</span>
            </button>
            
            <button
              onClick={() => setBackdrop('polkadot')}
              className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
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
              onClick={() => setBackdrop('web3')}
              className={`flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
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
          </div>
          
          <div className="mt-3 p-2 bg-gray-600/30 rounded text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Image size={12} />
              <span>Current: {backdrop === 'gradient' ? 'Default Gradient' : backdrop === 'polkadot' ? 'Polkadot Theme' : 'Web3 Theme'}</span>
            </div>
          </div>
        </div>

        {/* Lighting Controls */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Lighting</h3>
          
          <div className="mb-4">
            <label className="flex items-center justify-between text-sm font-medium text-gray-300 mb-2">
              <span>Intensity</span>
              <span className="text-blue-400">{Math.round(lightIntensity * 100)}%</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={lightIntensity}
              onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">Controls</h3>
          <ul className="text-xs text-blue-200 space-y-1">
            <li>• <strong>Left click + drag:</strong> Rotate</li>
            <li>• <strong>Right click + drag:</strong> Pan</li>
            <li>• <strong>Mouse wheel:</strong> Zoom</li>
            <li>• <strong>Auto-rotate:</strong> Toggle rotation</li>
          </ul>
        </div>

        {/* NFT Info */}
        <div className="mt-4 p-4 bg-purple-900/30 border border-purple-700/50 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-300 mb-2">🎨 NFT Creation</h3>
          <div className="text-xs text-purple-200 space-y-1">
            <div>• Captures current 3D scene as PNG</div>
            <div>• Optimized 1024×1024 square format</div>
            <div>• Includes custom materials & lighting</div>
            <div>• Ready for blockchain minting</div>
          </div>
          <div className="mt-3 pt-2 border-t border-purple-700/30">
            <div className="text-xs text-purple-300">
              <strong>Current Settings:</strong>
            </div>
            <div className="text-xs text-purple-200 space-y-1 mt-1">
              <div>Color: {color}</div>
              <div>Metallic: {Math.round(metallic * 100)}%</div>
              <div>Roughness: {Math.round(roughness * 100)}%</div>
              <div>Backdrop: {backdrop === 'gradient' ? 'Gradient' : backdrop === 'polkadot' ? 'Polkadot' : 'Web3'}</div>
            </div>
          </div>
        </div>

        {/* Model Info */}
        <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Model Info</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Format: GLB/GLTF</div>
            <div>Supports: Textures, Animations, PBR</div>
            <div>Path: {modelUrl}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        input[type='range']::-webkit-slider-track {
          background: #4b5563;
          height: 8px;
          border-radius: 4px;
        }

        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #1e40af;
          cursor: pointer;
        }

        input[type='range']::-moz-range-track {
          background: #4b5563;
          height: 8px;
          border-radius: 4px;
        }

        input[type='range']::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #1e40af;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
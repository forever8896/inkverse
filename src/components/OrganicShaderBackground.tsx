'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// Vertex shader - simple pass-through
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader - organic flowing noise
const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColorDeep;
  uniform vec3 uColorMid;
  uniform vec3 uColorAccent;
  varying vec2 vUv;

  // Simplex 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Fractional Brownian Motion for more organic feel
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for(int i = 0; i < 5; i++) {
      value += amplitude * snoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 3.0;

    // Slower, more subtle time factor
    float t = uTime * 0.08;

    // Multiple layers of flowing noise
    float n1 = fbm(p + vec2(t * 0.3, t * 0.2));
    float n2 = fbm(p * 1.5 + vec2(-t * 0.2, t * 0.15) + n1 * 0.3);
    float n3 = fbm(p * 0.8 + vec2(t * 0.1, -t * 0.25) + n2 * 0.2);

    // Combine noise layers
    float combined = (n1 + n2 * 0.7 + n3 * 0.5) / 2.2;
    combined = combined * 0.5 + 0.5; // Normalize to 0-1

    // Create soft radial gradient (vignette)
    vec2 center = uv - 0.5;
    float vignette = 1.0 - length(center) * 0.8;
    vignette = smoothstep(0.0, 1.0, vignette);

    // Color mixing based on noise
    vec3 baseColor = mix(uColorDeep, uColorMid, combined * 0.6);

    // Add accent color in brighter areas
    float accentMask = smoothstep(0.55, 0.75, combined) * 0.15;
    baseColor = mix(baseColor, uColorAccent, accentMask * vignette);

    // Apply vignette
    baseColor *= vignette * 0.9 + 0.1;

    // Subtle brightness variation
    baseColor *= 0.85 + combined * 0.15;

    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

function ShaderPlane() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    // Deep violet: #240B4D -> RGB normalized
    uColorDeep: { value: new THREE.Vector3(0.04, 0.01, 0.12) },
    // Mid purple: #1a0a3a -> RGB normalized
    uColorMid: { value: new THREE.Vector3(0.10, 0.04, 0.23) },
    // Accent (subtle cyan/mint): #4FFFB0 -> RGB normalized but dimmed
    uColorAccent: { value: new THREE.Vector3(0.15, 0.35, 0.30) },
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function OrganicShaderBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'low-power'
        }}
        dpr={[1, 1.5]} // Limit DPR for performance
      >
        <ShaderPlane />
      </Canvas>
    </div>
  );
}

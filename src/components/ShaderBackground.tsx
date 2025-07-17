"use client";

import { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  
  // Simple noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // Smoothed noise
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  // Fractal noise
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 4; i++) {
      value += amplitude * smoothNoise(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    
    return value;
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 3.0;
    
    // More dynamic time movement
    float time = u_time * 0.15;
    
    // Mouse position normalized to screen coordinates
    vec2 mouse = u_mouse / u_resolution.xy;
    
    // Create moving noise layers with more movement
    float noise1 = fbm(p + time * 0.3);
    float noise2 = fbm(p * 1.5 + time * 0.25);
    float noise3 = fbm(p * 2.0 - time * 0.2);
    
    // Add dynamic wave movement
    vec2 wave = vec2(
      sin(uv.x * 6.28318 + time * 0.8) * 0.15,
      cos(uv.y * 6.28318 + time * 0.6) * 0.15
    );
    float waveNoise = fbm(p + wave);
    
    // Mouse-based ripple effect
    float mouseDist = distance(uv, mouse);
    float ripple = sin(mouseDist * 15.0 - time * 3.0) * exp(-mouseDist * 3.0);
    
    // Secondary ripple for more complex effect
    float ripple2 = sin(mouseDist * 25.0 - time * 4.0) * exp(-mouseDist * 5.0);
    
    // Combine noise layers with ripple effects
    float combined = noise1 * 0.4 + noise2 * 0.3 + noise3 * 0.2 + waveNoise * 0.1;
    combined += ripple * 0.3 + ripple2 * 0.2;
    
    // Create darker color palette
    vec3 color1 = vec3(0.02, 0.015, 0.06); // Much darker base
    vec3 color2 = vec3(0.06, 0.04, 0.12); // Darker purple
    vec3 color3 = vec3(0.1, 0.05, 0.15); // Subtle accent
    
    // Mix colors based on noise and position
    vec3 color = mix(color1, color2, combined);
    color = mix(color, color3, combined * 0.2);
    
    // Add dynamic gradient movement
    float gradient = sin(uv.x * 4.0 + time * 0.6) * 0.1 + 
                    cos(uv.y * 3.0 + time * 0.4) * 0.1;
    color += gradient * 0.03;
    
    // Mouse influence on color
    float mouseInfluence = 1.0 - smoothstep(0.0, 0.5, mouseDist);
    color += mouseInfluence * 0.02;
    
    // Flowing movement effect
    vec2 flow = vec2(
      sin(uv.x * 4.0 + time * 0.5) * 0.1,
      cos(uv.y * 4.0 + time * 0.3) * 0.1
    );
    float flowNoise = fbm(p + flow);
    color += flowNoise * 0.02;
    
    // Stronger vignette effect for darker edges
    float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 1.2;
    color *= vignette;
    
    // Reduce overall brightness variation
    color += combined * 0.05;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0.5, y: 0.5 }); // Initialize to center

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.warn("WebGL not supported");
      return;
    }

    // Create shader function
    const createShader = (
      gl: WebGLRenderingContext,
      type: number,
      source: string
    ) => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    // Create program
    const createProgram = (
      gl: WebGLRenderingContext,
      vertexShader: WebGLShader,
      fragmentShader: WebGLShader
    ) => {
      const program = gl.createProgram();
      if (!program) return null;

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }

      return program;
    };

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    // Get attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(
      program,
      "a_position"
    );
    const resolutionUniformLocation = gl.getUniformLocation(
      program,
      "u_resolution"
    );
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");
    const mouseUniformLocation = gl.getUniformLocation(program, "u_mouse");

    // Create buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Define full-screen quad
    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Resize canvas
    const resizeCanvas = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    // Animation loop
    const animate = (time: number) => {
      resizeCanvas();

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      // Set uniforms
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(timeUniformLocation, time * 0.001);

      // Set mouse uniform with proper normalization
      if (mouseUniformLocation) {
        gl.uniform2f(
          mouseUniformLocation,
          mouseRef.current.x * canvas.width,
          mouseRef.current.y * canvas.height
        );
      } else {
        // Debug: log if mouse uniform is missing
        console.warn("Mouse uniform location not found");
      }

      // Set up attributes
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(
        positionAttributeLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
      );

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Mouse tracking
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (event.clientX - rect.left) / canvas.width,
        y: 1.0 - (event.clientY - rect.top) / canvas.height, // Flip Y and normalize
      };
      // Debug: log mouse position
      console.log("Mouse:", mouseRef.current);
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

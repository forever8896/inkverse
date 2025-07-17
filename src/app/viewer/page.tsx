"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ShaderBackground from "@/components/ShaderBackground";

// Character data based on public/creatures/ directory
const characters: Character[] = [
  {
    id: "egg",
    name: "Inkception",
    src: "/creatures/egg.png",
    type: "image",
  },
  {
    id: "egg_cracks",
    name: "Crack in the matrix",
    src: "/creatures/egg_cracks.png",
    type: "image",
  },
  {
    id: "first_awake",
    name: "First Awake",
    src: "/creatures/first_awake.png",
    type: "image",
  },
  {
    id: "first_sleeping",
    name: "First Sleeping",
    src: "/creatures/first_sleeping.png",
    type: "image",
  },
  {
    id: "second_body",
    name: "Second Body",
    src: "/creatures/second_body.png",
    type: "image",
  },
  {
    id: "video_character",
    name: "Animated Being",
    src: "/creatures/output.webm",
    type: "video",
  },
];

interface Star {
  id: number;
  width: number;
  height: number;
  left: number;
  top: number;
  animationDelay: number;
  animationDuration: number;
}

interface Character {
  id: string;
  name: string;
  src: string;
  type: "image" | "video";
}

export default function CharacterViewer() {
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [stars, setStars] = useState<Star[]>([]);
  const [hslValues, setHslValues] = useState({
    hue: 0,
    saturation: 0,
    lightness: 0,
  });

  useEffect(() => {
    // Generate stars only on client side to avoid hydration mismatch
    const generatedStars = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: Math.random() * 2 + 1,
    }));
    setStars(generatedStars);
  }, []);

  // Generate CSS filter string from HSL values
  const getImageFilter = () => {
    const { hue, saturation, lightness } = hslValues;
    return `hue-rotate(${hue}deg) saturate(${100 + saturation}%) brightness(${
      100 + lightness
    }%)`;
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Pane - Character Display */}
      <div className="flex-1 relative overflow-hidden">
        {/* Shader Background */}
        <ShaderBackground />

        {/* Twinkling Stars */}
        <div className="absolute inset-0">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white opacity-30 animate-pulse"
              style={{
                width: star.width + "px",
                height: star.height + "px",
                left: star.left + "%",
                top: star.top + "%",
                animationDelay: star.animationDelay + "s",
                animationDuration: star.animationDuration + "s",
              }}
            />
          ))}
        </div>

        {/* Selected Character Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-bounce-gentle">
            {selectedCharacter.type === "video" ? (
              <video
                src={selectedCharacter.src}
                autoPlay
                loop
                muted
                width={300}
                height={300}
                className="object-contain"
                style={{
                  filter: getImageFilter(),
                }}
              />
            ) : (
              <Image
                src={selectedCharacter.src}
                alt={selectedCharacter.name}
                width={300}
                height={300}
                className="object-contain"
                style={{ filter: getImageFilter() }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Pane - Character Selection */}
      <div className="w-80 bg-gray-800 p-6 border-l border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Select Character
        </h2>

        {/* Color Controls */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">
            Color Customization
          </h3>

          {/* Hue Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hue: {hslValues.hue}°
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              value={hslValues.hue}
              onChange={(e) =>
                setHslValues((prev) => ({
                  ...prev,
                  hue: parseInt(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-hue"
            />
          </div>

          {/* Saturation Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Saturation: {hslValues.saturation}%
            </label>
            <input
              type="range"
              min="-100"
              max="100"
              value={hslValues.saturation}
              onChange={(e) =>
                setHslValues((prev) => ({
                  ...prev,
                  saturation: parseInt(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Lightness Slider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lightness: {hslValues.lightness}%
            </label>
            <input
              type="range"
              min="-50"
              max="50"
              value={hslValues.lightness}
              onChange={(e) =>
                setHslValues((prev) => ({
                  ...prev,
                  lightness: parseInt(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={() =>
              setHslValues({ hue: 0, saturation: 0, lightness: 0 })
            }
            className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-colors"
          >
            Reset Colors
          </button>
        </div>

        <div className="space-y-4">
          {characters.map((character) => (
            <div
              key={character.id}
              className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                selectedCharacter.id === character.id
                  ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/50"
                  : "border-gray-600 bg-gray-700/50 hover:border-gray-500"
              }`}
              onClick={() => setSelectedCharacter(character)}
            >
              <div className="p-4 flex items-center space-x-4">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-600">
                  {character.type === "video" ? (
                    <video
                      src={character.src}
                      autoPlay
                      loop
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        filter: getImageFilter(),
                      }}
                    />
                  ) : (
                    <Image
                      src={character.src}
                      alt={character.name}
                      fill
                      className="object-cover"
                      style={{ filter: getImageFilter() }}
                    />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{character.name}</h3>
                  <p className="text-gray-400 text-sm">Character</p>
                </div>
              </div>

              {selectedCharacter.id === character.id && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-gentle {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }

        /* Custom slider styling */
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-track {
          background: #4b5563;
          height: 8px;
          border-radius: 4px;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #1e40af;
          cursor: pointer;
        }

        input[type="range"]::-moz-range-track {
          background: #4b5563;
          height: 8px;
          border-radius: 4px;
        }

        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #1e40af;
          cursor: pointer;
        }

        /* Rainbow gradient for hue slider */
        .slider-hue::-webkit-slider-track {
          background: linear-gradient(
            to right,
            #ff0000 0%,
            #ffff00 16.66%,
            #00ff00 33.33%,
            #00ffff 50%,
            #0000ff 66.66%,
            #ff00ff 83.33%,
            #ff0000 100%
          );
        }

        .slider-hue::-moz-range-track {
          background: linear-gradient(
            to right,
            #ff0000 0%,
            #ffff00 16.66%,
            #00ff00 33.33%,
            #00ffff 50%,
            #0000ff 66.66%,
            #ff00ff 83.33%,
            #ff0000 100%
          );
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface HSLValues {
  hue: number;
  saturation: number;
  lightness: number;
}

interface CreatureColorPickerProps {
  onColorChange?: (hslValues: HSLValues) => void;
  className?: string;
}

export default function CreatureColorPicker({
  onColorChange,
  className = "",
}: CreatureColorPickerProps) {
  const [hslValues, setHslValues] = useState<HSLValues>({
    hue: 0,
    saturation: 0,
    lightness: 0,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved color from localStorage on component mount
  useEffect(() => {
    const savedColor = localStorage.getItem("creatureColor");
    if (savedColor) {
      try {
        const parsedColor = JSON.parse(savedColor);
        setHslValues(parsedColor);
        onColorChange?.(parsedColor);
      } catch (error) {
        console.error("Error parsing saved color:", error);
      }
    }
    setIsInitialized(true);
  }, []); // Remove onColorChange dependency to prevent infinite loop

  // Save color to localStorage only after initialization and when user makes changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("creatureColor", JSON.stringify(hslValues));
      onColorChange?.(hslValues);
    }
  }, [hslValues, isInitialized]); // Remove onColorChange dependency to prevent infinite loop

  const updateHslValue = (key: keyof HSLValues, value: number) => {
    setHslValues((prev) => ({ ...prev, [key]: value }));
  };

  const resetColors = () => {
    setHslValues({ hue: 0, saturation: 0, lightness: 0 });
  };

  // Generate preview color based on current HSL values
  const getPreviewColor = () => {
    const { hue, saturation, lightness } = hslValues;
    return `hsl(${hue + 280}, ${Math.max(
      0,
      Math.min(100, 70 + saturation)
    )}%, ${Math.max(0, Math.min(100, 50 + lightness))}%)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative p-4 bg-gradient-to-br from-slate-800/60 via-purple-900/20 to-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden ${className}`}
    >
      {/* Header with animated icon */}
      <div className="relative z-10 mb-4">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-2xl"
          >
            🎨
          </motion.div>
          <h3 className="text-xl font-bold text-white">Customize</h3>
        </div>
      </div>

      {/* Hue Slider */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-4 relative z-10"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <span>🌈</span>
            <span>Hue</span>
          </label>
          <motion.span
            className="text-xs font-mono text-purple-300 px-2 py-1 bg-purple-900/30 rounded-full"
            key={hslValues.hue}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {hslValues.hue}°
          </motion.span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="-180"
            max="180"
            value={hslValues.hue}
            onChange={(e) => updateHslValue("hue", parseInt(e.target.value))}
            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-hue relative z-10"
          />
          <motion.div
            className="absolute top-0 left-0 h-3 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-lg pointer-events-none"
            style={{
              width: `${((hslValues.hue + 180) / 360) * 100}%`,
            }}
          />
        </div>
      </motion.div>

      {/* Saturation Slider */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-4 relative z-10"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <span>💧</span>
            <span>Saturation</span>
          </label>
          <motion.span
            className="text-xs font-mono text-cyan-300 px-2 py-1 bg-cyan-900/30 rounded-full"
            key={hslValues.saturation}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {hslValues.saturation}%
          </motion.span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="-100"
            max="100"
            value={hslValues.saturation}
            onChange={(e) =>
              updateHslValue("saturation", parseInt(e.target.value))
            }
            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-saturation relative z-10"
          />
          <motion.div
            className="absolute top-0 left-0 h-3 bg-gradient-to-r from-slate-500/30 to-cyan-500/30 rounded-lg pointer-events-none"
            style={{
              width: `${((hslValues.saturation + 100) / 200) * 100}%`,
            }}
          />
        </div>
      </motion.div>

      {/* Lightness Slider */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mb-4 relative z-10"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
            <span>💡</span>
            <span>Lightness</span>
          </label>
          <motion.span
            className="text-xs font-mono text-yellow-300 px-2 py-1 bg-yellow-900/30 rounded-full"
            key={hslValues.lightness}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {hslValues.lightness}%
          </motion.span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="-50"
            max="50"
            value={hslValues.lightness}
            onChange={(e) =>
              updateHslValue("lightness", parseInt(e.target.value))
            }
            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-lightness relative z-10"
          />
          <motion.div
            className="absolute top-0 left-0 h-3 bg-gradient-to-r from-slate-900/30 to-yellow-400/30 rounded-lg pointer-events-none"
            style={{
              width: `${((hslValues.lightness + 50) / 100) * 100}%`,
            }}
          />
        </div>
      </motion.div>

      <style jsx>{`
        /* Custom slider styling */
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-track {
          background: #475569;
          height: 12px;
          border-radius: 6px;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        input[type="range"]::-moz-range-track {
          background: #475569;
          height: 12px;
          border-radius: 6px;
        }

        input[type="range"]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
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
    </motion.div>
  );
}

// Export the HSL values type for reuse
export type { HSLValues };

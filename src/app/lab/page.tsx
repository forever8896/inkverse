"use client";

import Link from "next/link";
import { getAllLessons } from "@/lib/lessons";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import CreatureColorPicker, {
  HSLValues,
} from "@/components/CreatureColorPicker";
import Image from "next/image";

// Bio-hacking lab loading screen component
function LabLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [loadingStage, setLoadingStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const loadingStages = [
    "🔬 Initializing Bio-Lab Systems...",
    "🧬 Scanning DNA Sequences...",
    "⚡ Charging Incubation Chambers...",
    "🤖 Calibrating Neural Networks...",
    "🌟 Awakening Creatures...",
    "✨ Lab Ready!",
  ];

  const floatingEmojis = [
    "🧪",
    "🔬",
    "🧬",
    "⚗️",
    "🦠",
    "🧫",
    "💉",
    "🔬",
    "⚡",
    "🌟",
    "✨",
    "💫",
    "🌈",
    "🔮",
    "🧪",
    "🔬",
  ];

  // Set client-side flag to prevent SSR hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 8; // Much faster progress (was 2)
      });
    }, 80); // Faster interval (was 100)

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const stageInterval = setInterval(() => {
      setLoadingStage((prev) => (prev + 1) % loadingStages.length);
    }, 800); // Faster stage changes (was 1200)

    return () => clearInterval(stageInterval);
  }, [loadingStages.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900/50 to-cyan-900/50 flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-400/30 to-transparent"
            style={{ left: `${i * 5}%` }}
            animate={{
              opacity: [0.1, 0.5, 0.1],
              scaleY: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      {/* Floating Emoji Icons - Client-only to prevent SSR hydration mismatch */}
      {isClient &&
        floatingEmojis.map((emoji, index) => {
          const initialX = Math.random() * 100; // 0-100%
          const initialY = Math.random() * 100; // 0-100%
          const animateX = Math.random() * 100; // 0-100%
          const animateY = Math.random() * 100; // 0-100%

          return (
            <motion.div
              key={index}
              className="absolute text-2xl"
              initial={{
                left: `${initialX}%`,
                top: `${initialY}%`,
                opacity: 0.3,
              }}
              animate={{
                left: `${animateX}%`,
                top: `${animateY}%`,
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
              style={{
                filter: "drop-shadow(0 0 10px rgba(147, 51, 234, 0.5))",
              }}
            >
              {emoji}
            </motion.div>
          );
        })}

      {/* Central Loading Interface */}
      <div className="relative z-10 text-center">
        {/* Pulsing Lab Icon */}
        <motion.div
          className="mb-8 mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-400/30 flex items-center justify-center text-6xl"
          animate={{
            scale: [1, 1.1, 1],
            boxShadow: [
              "0 0 20px rgba(147, 51, 234, 0.3)",
              "0 0 40px rgba(147, 51, 234, 0.8)",
              "0 0 20px rgba(147, 51, 234, 0.3)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          🔬
        </motion.div>

        {/* Loading Title */}
        <motion.h1
          className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Entering the lab...
        </motion.h1>

        {/* Loading Stage Text */}
        <motion.div
          key={loadingStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-8 text-xl text-slate-300"
        >
          {loadingStages[loadingStage]}
        </motion.div>

        {/* Progress Bar */}
        <div className="w-80 h-2 bg-slate-800 rounded-full mx-auto mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            style={{
              boxShadow: "0 0 20px rgba(147, 51, 234, 0.5)",
            }}
          />
        </div>

        {/* Progress Percentage */}
        <motion.div
          className="text-2xl font-bold text-purple-400"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {Math.round(progress)}%
        </motion.div>

        {/* Scanning Lines Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent"
            style={{
              height: "2px",
              animation: "scan 3s linear infinite",
            }}
          />
        </motion.div>
      </div>

      {/* CSS Animation for Scanning Effect */}
      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100vh);
          }
          100% {
            transform: translateY(100vh);
          }
        }

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
      `}</style>
    </motion.div>
  );
}

// Animated Background Grid Component (to be reused)
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 opacity-20">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-400/30 to-transparent"
          style={{ left: `${i * 5}%` }}
          animate={{
            opacity: [0.1, 0.5, 0.1],
            scaleY: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

export default function LabPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [creatureColor, setCreatureColor] = useState<HSLValues>({
    hue: 0,
    saturation: 0,
    lightness: 0,
  });

  const chapters = getAllLessons();

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setTimeout(() => setShowContent(true), 300);
  };

  const handleColorChange = useCallback((hslValues: HSLValues) => {
    setCreatureColor(hslValues);
  }, []);

  // Generate CSS filter string from HSL values
  const getImageFilter = () => {
    const { hue, saturation, lightness } = creatureColor;
    return `hue-rotate(${hue}deg) saturate(${100 + saturation}%) brightness(${
      100 + lightness
    }%)`;
  };

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {isLoading && <LabLoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-cyan-900/20"
          >
            {/* Animated Background Grid for Main Content */}
            <AnimatedBackground />

            {/* Main Content */}
            <div className="relative z-10">
              {/* Navigation */}

              <div className="max-w-7xl mx-auto px-6 py-24  ">
                {/* Lab Header */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center mb-12"
                >
                  <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Customize your Creature
                  </h1>
                </motion.div>

                {/* Creature Display & Color Customization */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mb-16"
                >
                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                      {/* Creature Display */}
                      <div className="relative">
                        <div className="p-8 h-96 flex items-center justify-center">
                          <div className="relative">
                            <div className="animate-bounce-gentle">
                              <Image
                                src="/creatures/first_awake.png"
                                alt="Your Bio-Engineered Creature"
                                width={240}
                                height={240}
                                className="object-contain"
                                style={{
                                  filter: `${getImageFilter()} drop-shadow(0 0 20px rgba(147, 51, 234, 0.5))`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Color Customization */}
                      <div>
                        <CreatureColorPicker
                          onColorChange={handleColorChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Chapter Selection */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {chapters.map((chapter, index) => {
                    const creatureEmojis = ["👁️", "🦵", "🧪", "🌍"];
                    const creature = creatureEmojis[chapter.id - 1] || "🧬";

                    return (
                      <motion.div
                        key={chapter.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 * index }}
                        className={`relative bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 ${
                          chapter.id > 1 && !chapters[index - 1]?.completed
                            ? "border-slate-700 opacity-50"
                            : chapter.completed
                            ? "border-green-500/50 bg-green-900/10"
                            : "border-slate-700 hover:border-purple-400/50 hover:transform hover:scale-[1.02] cursor-pointer"
                        }`}
                      >
                        {/* Lock/Completion Status */}
                        <div className="absolute top-6 right-6">
                          {chapter.id > 1 && !chapters[index - 1]?.completed ? (
                            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                              <span className="text-sm">🔒</span>
                            </div>
                          ) : chapter.completed ? (
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-sm">✅</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Chapter Content */}
                        <div className="mb-6">
                          {/* Chapter Icon & Title */}
                          <div className="flex items-center space-x-4 mb-4">
                            <div
                              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl ${
                                chapter.completed
                                  ? "bg-green-600/20 border-2 border-green-500/50"
                                  : chapter.id === 1 ||
                                    chapters[index - 1]?.completed
                                  ? "bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-400/30"
                                  : "bg-slate-700/50 border-2 border-slate-600"
                              }`}
                            >
                              {creature}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-purple-400 text-sm font-semibold">
                                  Chapter {chapter.id}
                                </span>
                                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs">
                                  Ready to Build
                                </span>
                              </div>
                              <h3 className="text-2xl font-bold mb-2">
                                {chapter.title}
                              </h3>
                              <p className="text-slate-400 text-sm mb-2">
                                {chapter.description}
                              </p>
                            </div>
                          </div>

                          {/* Chapter Story */}
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-purple-400 mb-2">
                              📖 Learning Goals:
                            </h4>
                            <div className="text-slate-300 text-sm">
                              {chapter.objectives.join(" • ")}
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        {chapter.id === 1 || chapters[index - 1]?.completed ? (
                          <Link
                            href={`/lab/chapter/${chapter.id}`}
                            className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 text-center block ${
                              chapter.completed
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white transform hover:scale-105"
                            }`}
                          >
                            {chapter.completed
                              ? "🔄 Review Chapter"
                              : "🚀 Get Started"}
                          </Link>
                        ) : (
                          <div className="w-full bg-slate-700 text-slate-400 font-semibold py-4 px-6 rounded-xl text-center">
                            Complete Chapter {chapter.id - 1} to unlock
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>

                {/* Ready to Start */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="text-center mt-16"
                >
                  <h2 className="text-3xl font-bold mb-4">Ready to Begin?</h2>
                  <p className="text-xl text-slate-300 mb-8">
                    Start with Chapter 1 and begin your journey into
                    bio-engineering a digital creature!
                  </p>
                  <Link
                    href="/lab/chapter/1"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 rounded-xl text-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    🧪 Awaken Your First Creature →
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

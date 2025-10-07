'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type MonsterStyle = 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic';
type MonsterStage = 'egg' | 'young' | 'adult';
type GenerationType = 'full' | 'image_only';

interface GenerateMonsterRequest {
  // Physical Features
  eyes: number;
  bodyType: 'skeletal' | 'muscular' | 'fluffy' | 'serpentine' | 'rocky';
  size: 'tiny' | 'small' | 'medium' | 'large' | 'massive';
  
  // Personality & Style
  attitude: 'sassy' | 'crypto-degen' | 'rainbow' | 'wise' | 'mischievous' | 'regal' | 'robotic' | 'kawaii';
  
  // Magical Abilities
  canFly: 'wings' | 'floating' | 'no';
  specialPower: 'fire' | 'ice' | 'lightning' | 'nature' | 'psychic' | 'star' | 'crystal' | 'wind';
  magicalAura: 'sparkly' | 'fiery' | 'cosmic' | 'watery' | 'floral';
  
  // Appearance
  colorScheme: 'red' | 'blue' | 'green' | 'purple' | 'rainbow' | 'dark' | 'light' | 'metallic';
  texture: 'scales' | 'fur' | 'metal' | 'crystal' | 'plant' | 'ethereal';
  
  // Environment
  habitat: 'mountains' | 'ocean' | 'forest' | 'space' | 'desert' | 'ruins' | 'city' | 'clouds';
  
  // Keep existing for backward compatibility
  style?: MonsterStyle; // Legacy - defaults to 'cute'
  stage: MonsterStage;
  generationType: GenerationType;
}

// Physical Features Options
const eyeOptions = [
  { value: 1, emoji: '👁️', label: 'One Eye', description: 'Cyclops style' },
  { value: 2, emoji: '👀', label: 'Two Eyes', description: 'Classic look' },
  { value: 3, emoji: '👁️👁️👁️', label: 'Three Eyes', description: 'Mystical sight' },
  { value: 8, emoji: '🕷️', label: 'Many Eyes', description: 'Spider-like' },
];

const bodyTypeOptions = [
  { value: 'skeletal', emoji: '🦴', label: 'Skeletal', description: 'Thin and bony' },
  { value: 'muscular', emoji: '💪', label: 'Muscular', description: 'Strong and powerful' },
  { value: 'fluffy', emoji: '🫧', label: 'Fluffy', description: 'Soft and round' },
  { value: 'serpentine', emoji: '🐍', label: 'Serpentine', description: 'Long and snake-like' },
  { value: 'rocky', emoji: '🗿', label: 'Rocky', description: 'Stone-like texture' },
];

const sizeOptions = [
  { value: 'tiny', emoji: '🐭', label: 'Tiny', description: 'Mouse-sized' },
  { value: 'small', emoji: '🐱', label: 'Small', description: 'Cat-sized' },
  { value: 'medium', emoji: '🐕', label: 'Medium', description: 'Dog-sized' },
  { value: 'large', emoji: '🐎', label: 'Large', description: 'Horse-sized' },
  { value: 'massive', emoji: '🐘', label: 'Massive', description: 'Elephant-sized' },
];

// Personality Options
const attitudeOptions = [
  { value: 'sassy', emoji: '😎', label: 'Sassy', description: 'Confident and cheeky' },
  { value: 'crypto-degen', emoji: '🤓', label: 'Crypto Degen', description: 'Tech-savvy trader vibes' },
  { value: 'rainbow', emoji: '🌈', label: 'Rainbow', description: 'Colorful and joyful' },
  { value: 'wise', emoji: '🧙‍♂️', label: 'Wise', description: 'Ancient and knowing' },
  { value: 'mischievous', emoji: '😈', label: 'Mischievous', description: 'Playful troublemaker' },
  { value: 'regal', emoji: '👑', label: 'Regal', description: 'Royal and dignified' },
  { value: 'robotic', emoji: '🤖', label: 'Robotic', description: 'Mechanical and precise' },
  { value: 'kawaii', emoji: '🌸', label: 'Kawaii', description: 'Ultra-cute anime style' },
];

// Magical Abilities Options
const flyingOptions = [
  { value: 'wings', emoji: '✈️', label: 'Wings', description: 'Traditional flying' },
  { value: 'floating', emoji: '🎈', label: 'Floating', description: 'Magical levitation' },
  { value: 'no', emoji: '🚫', label: 'Ground-bound', description: 'Cannot fly' },
];

const specialPowerOptions = [
  { value: 'fire', emoji: '🔥', label: 'Fire', description: 'Breathing flames' },
  { value: 'ice', emoji: '❄️', label: 'Ice', description: 'Freezing powers' },
  { value: 'lightning', emoji: '⚡', label: 'Lightning', description: 'Electric control' },
  { value: 'nature', emoji: '🌿', label: 'Nature', description: 'Plant magic' },
  { value: 'psychic', emoji: '🔮', label: 'Psychic', description: 'Mind powers' },
  { value: 'star', emoji: '🌟', label: 'Star', description: 'Cosmic magic' },
  { value: 'crystal', emoji: '💎', label: 'Crystal', description: 'Gem powers' },
  { value: 'wind', emoji: '🌀', label: 'Wind', description: 'Air control' },
];

const magicalAuraOptions = [
  { value: 'sparkly', emoji: '✨', label: 'Sparkly', description: 'Glittering effects' },
  { value: 'fiery', emoji: '🔥', label: 'Fiery', description: 'Flame-like aura' },
  { value: 'cosmic', emoji: '💫', label: 'Cosmic', description: 'Space-themed glow' },
  { value: 'watery', emoji: '🌊', label: 'Watery', description: 'Liquid-like shimmer' },
  { value: 'floral', emoji: '🌸', label: 'Floral', description: 'Flower petal effects' },
];

// Appearance Options
const colorSchemeOptions = [
  { value: 'red', emoji: '🔴', label: 'Red Tones', description: 'Warm and fiery' },
  { value: 'blue', emoji: '🔵', label: 'Blue Tones', description: 'Cool and calm' },
  { value: 'green', emoji: '💚', label: 'Green Tones', description: 'Natural and earthy' },
  { value: 'purple', emoji: '💜', label: 'Purple Tones', description: 'Mystical and royal' },
  { value: 'rainbow', emoji: '🌈', label: 'Rainbow', description: 'All colors' },
  { value: 'dark', emoji: '⚫', label: 'Dark/Gothic', description: 'Black and shadows' },
  { value: 'light', emoji: '⚪', label: 'Light/Pastel', description: 'Bright and soft' },
  { value: 'metallic', emoji: '🌟', label: 'Metallic', description: 'Shimmery metals' },
];

const textureOptions = [
  { value: 'scales', emoji: '🐉', label: 'Scales', description: 'Dragon-like' },
  { value: 'fur', emoji: '🧸', label: 'Fur', description: 'Soft and fluffy' },
  { value: 'metal', emoji: '🤖', label: 'Metal', description: 'Robotic appearance' },
  { value: 'crystal', emoji: '💎', label: 'Crystal', description: 'Gem-like surface' },
  { value: 'plant', emoji: '🌿', label: 'Plant-like', description: 'Leafy/woody' },
  { value: 'ethereal', emoji: '👻', label: 'Ethereal', description: 'Ghostly/transparent' },
];

// Environment Options
const habitatOptions = [
  { value: 'mountains', emoji: '🏔️', label: 'Mountains', description: 'Rocky peaks' },
  { value: 'ocean', emoji: '🌊', label: 'Ocean', description: 'Deep sea' },
  { value: 'forest', emoji: '🌳', label: 'Forest', description: 'Dense woods' },
  { value: 'space', emoji: '🌌', label: 'Space', description: 'Cosmic void' },
  { value: 'desert', emoji: '🏜️', label: 'Desert', description: 'Sandy dunes' },
  { value: 'ruins', emoji: '🏛️', label: 'Ancient Ruins', description: 'Mystical temples' },
  { value: 'city', emoji: '🌆', label: 'City', description: 'Urban landscape' },
  { value: 'clouds', emoji: '☁️', label: 'Clouds', description: 'Sky dwelling' },
];

const stageOptions: { value: MonsterStage; label: string; emoji: string; description: string }[] = [
  { value: 'egg', label: 'Egg', emoji: '🥚', description: 'Mysterious potential waiting to hatch' },
  { value: 'young', label: 'Young', emoji: '🐣', description: 'Energetic and curious juvenile' },
  { value: 'adult', label: 'Adult', emoji: '🐲', description: 'Fully grown and majestic creature' },
];

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 opacity-20">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-full bg-gradient-to-b from-transparent via-purple-400/30 to-transparent"
          style={{ left: `${i * 5}%` }}
          animate={{ opacity: [0.1, 0.5, 0.1], scaleY: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

function FloatingElements() {
  const floatingEmojis = ['🧪', '⚗️', '🔬', '🧬', '✨', '🌟', '💫', '🔮'];
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fixed positions to avoid hydration mismatch
  const fixedPositions = [
    { left: 15, top: 20 },
    { left: 80, top: 10 },
    { left: 10, top: 70 },
    { left: 85, top: 60 },
    { left: 50, top: 30 },
    { left: 25, top: 80 },
    { left: 70, top: 85 },
    { left: 60, top: 15 },
  ];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {isClient && floatingEmojis.map((emoji, index) => {
        const position = fixedPositions[index];
        return (
          <motion.div
            key={index}
            className="absolute text-2xl"
            initial={{
              left: `${position.left}%`,
              top: `${position.top}%`,
              opacity: 0.3,
            }}
            animate={{
              left: `${position.left + (index % 2 === 0 ? 10 : -10)}%`,
              top: `${position.top + (index % 3 === 0 ? 15 : -15)}%`,
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 8 + (index * 0.5),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.3,
            }}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(147, 51, 234, 0.5))',
            }}
          >
            {emoji}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<GenerateMonsterRequest>({
    // Physical Features
    eyes: 2,
    bodyType: 'muscular',
    size: 'medium',

    // Personality & Style
    attitude: 'sassy',

    // Magical Abilities
    canFly: 'wings',
    specialPower: 'fire',
    magicalAura: 'sparkly',

    // Appearance
    colorScheme: 'purple',
    texture: 'scales',

    // Environment
    habitat: 'mountains',

    // Keep existing for backward compatibility
    // style is omitted - defaults to 'cute' on server
    stage: 'adult',
    generationType: 'full',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate preview text for display (client-side only, not sent to server)
  const generatePreviewText = (data: GenerateMonsterRequest): string => {
    const eyeText = data.eyes === 1 ? 'one eye' : data.eyes === 2 ? 'two eyes' : data.eyes === 3 ? 'three eyes' : 'many eyes';
    const flyText = data.canFly === 'wings' ? 'with wings for flying' : data.canFly === 'floating' ? 'that floats magically' : 'that stays on the ground';
    
    return `A ${data.size} ${data.attitude} monster with ${eyeText}, ${data.bodyType} body type, ${data.texture} texture, ${data.colorScheme} colors, ${data.specialPower} powers, ${data.magicalAura} magical aura, ${flyText}, living in ${data.habitat}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setIsGenerating(true);

    try {
      // Send structured data to server - AI prompt will be generated server-side
      const response = await fetch('/api/generate-monster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create monster generation job');
      }

      if (!data.success || !data.jobId) {
        throw new Error('Invalid response from server');
      }

      // Redirect to progress page immediately to prevent duplicate requests
      router.push(`/generate/${data.jobId}`);
      
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsGenerating(false);
    }
  };

  // Helper functions for selections
  const updateFormField = <K extends keyof GenerateMonsterRequest>(
    field: K,
    value: GenerateMonsterRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const selectedStageOption = stageOptions.find(option => option.value === formData.stage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-cyan-900/20 relative overflow-hidden">
      <AnimatedBackground />
      <FloatingElements />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-8">
            <motion.div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-2 border-purple-400/30 flex items-center justify-center text-6xl"
              animate={{
                scale: [1, 1.1, 1],
                boxShadow: [
                  '0 0 20px rgba(147, 51, 234, 0.3)',
                  '0 0 40px rgba(147, 51, 234, 0.8)',
                  '0 0 20px rgba(147, 51, 234, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🧪
            </motion.div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Create Your Monster
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Describe your dream creature and watch AI bring it to life in stunning 3D!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Physical Features Section */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                👁️ Physical Features
              </h3>
              
              {/* Number of Eyes */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Eyes
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {eyeOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('eyes', option.value as number)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.eyes === option.value
                          ? 'border-purple-400 bg-purple-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.eyes !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Body Type */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Body Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {bodyTypeOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('bodyType', option.value as GenerateMonsterRequest['bodyType'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.bodyType === option.value
                          ? 'border-cyan-400 bg-cyan-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.bodyType !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Size
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {sizeOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('size', option.value as GenerateMonsterRequest['size'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.size === option.value
                          ? 'border-green-400 bg-green-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.size !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Personality & Magical Abilities */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                🎭 Personality & Magic
              </h3>
              
              {/* Attitude */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Attitude
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {attitudeOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('attitude', option.value as GenerateMonsterRequest['attitude'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.attitude === option.value
                          ? 'border-purple-400 bg-purple-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.attitude !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Flying Ability */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Can Fly?
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {flyingOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('canFly', option.value as GenerateMonsterRequest['canFly'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.canFly === option.value
                          ? 'border-cyan-400 bg-cyan-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.canFly !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Special Powers */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Special Power
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {specialPowerOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('specialPower', option.value as GenerateMonsterRequest['specialPower'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.specialPower === option.value
                          ? 'border-orange-400 bg-orange-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.specialPower !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Magical Aura */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Magical Aura
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {magicalAuraOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('magicalAura', option.value as GenerateMonsterRequest['magicalAura'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.magicalAura === option.value
                          ? 'border-pink-400 bg-pink-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.magicalAura !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Appearance & Environment */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                🎨 Appearance & Environment
              </h3>
              
              {/* Stage Selection */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  🌱 Evolution Stage
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {stageOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('stage', option.value as GenerateMonsterRequest['stage'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.stage === option.value
                          ? 'border-cyan-400 bg-cyan-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.stage !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-3xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Color Scheme */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Color Scheme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {colorSchemeOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('colorScheme', option.value as GenerateMonsterRequest['colorScheme'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.colorScheme === option.value
                          ? 'border-pink-400 bg-pink-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.colorScheme !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Texture */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Surface Texture
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {textureOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('texture', option.value as GenerateMonsterRequest['texture'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.texture === option.value
                          ? 'border-yellow-400 bg-yellow-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.texture !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Habitat */}
              <div className="mb-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  Home Environment
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {habitatOptions.map((option) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormField('habitat', option.value as GenerateMonsterRequest['habitat'])}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        formData.habitat === option.value
                          ? 'border-green-400 bg-green-500/20 scale-105'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:scale-102'
                      }`}
                      disabled={isGenerating}
                      whileHover={{ scale: formData.habitat !== option.value ? 1.02 : 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-2xl mb-2">{option.emoji}</div>
                      <div className="font-semibold text-white text-sm">{option.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{option.description}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generation Mode */}
            <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                🧪 Generation Mode
              </h3>
              <p className="text-slate-300 text-sm mb-4">
                Choose whether to create the full 3D experience or just the 2D concept art.
              </p>
              <label className="flex items-start gap-3 text-left">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-slate-500 bg-slate-800 text-purple-500 focus:ring-2 focus:ring-purple-500"
                  checked={formData.generationType === 'image_only'}
                  onChange={(event) =>
                    updateFormField(
                      'generationType',
                      event.target.checked ? 'image_only' : 'full'
                    )
                  }
                  disabled={isGenerating}
                />
                <div>
                  <span className="text-white font-semibold">Image only</span>
                  <p className="text-sm text-slate-400 mt-1">
                    Generates the illustrated monster but skips the fal.ai 3D conversion to save credits.
                  </p>
                </div>
              </label>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200"
                >
                  <div className="flex items-center">
                    <span className="text-xl mr-3">⚠️</span>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isGenerating}
              className="w-full py-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed rounded-xl text-xl font-semibold text-white transition-all duration-200 flex items-center justify-center"
              whileHover={{ scale: isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: isGenerating ? 1 : 0.98 }}
            >
              {isGenerating ? (
                <>
                  <motion.div
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Creating Your Monster...
                </>
              ) : (
                <>
                  <span className="text-2xl mr-3">🎭</span>
                  Generate My Monster
                </>
              )}
            </motion.button>

            {/* Preview of selections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 border border-slate-600 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">🔮 Your Monster Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Physical Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-purple-300">Physical Features</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Eyes:</span>
                      <span className="text-white">{formData.eyes === 1 ? '👁️ One' : formData.eyes === 2 ? '👀 Two' : formData.eyes === 3 ? '👁️👁️👁️ Three' : '🕷️ Many'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Body:</span>
                      <span className="text-white capitalize">{bodyTypeOptions.find(o => o.value === formData.bodyType)?.emoji} {formData.bodyType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Size:</span>
                      <span className="text-white capitalize">{sizeOptions.find(o => o.value === formData.size)?.emoji} {formData.size}</span>
                    </div>
                  </div>
                </div>

                {/* Personality & Powers */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-cyan-300">Personality & Powers</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Attitude:</span>
                      <span className="text-white capitalize">{attitudeOptions.find(o => o.value === formData.attitude)?.emoji} {formData.attitude.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Flying:</span>
                      <span className="text-white capitalize">{flyingOptions.find(o => o.value === formData.canFly)?.emoji} {formData.canFly === 'no' ? 'Ground-bound' : formData.canFly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Power:</span>
                      <span className="text-white capitalize">{specialPowerOptions.find(o => o.value === formData.specialPower)?.emoji} {formData.specialPower}</span>
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-green-300">Appearance</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Stage:</span>
                      <span className="text-white capitalize">{selectedStageOption?.emoji} {selectedStageOption?.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Colors:</span>
                      <span className="text-white capitalize">{colorSchemeOptions.find(o => o.value === formData.colorScheme)?.emoji} {formData.colorScheme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Texture:</span>
                      <span className="text-white capitalize">{textureOptions.find(o => o.value === formData.texture)?.emoji} {formData.texture}</span>
                    </div>
                  </div>
                </div>

                {/* Environment & Magic */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-pink-300">Environment & Magic</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Home:</span>
                      <span className="text-white capitalize">{habitatOptions.find(o => o.value === formData.habitat)?.emoji} {formData.habitat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Aura:</span>
                      <span className="text-white capitalize">{magicalAuraOptions.find(o => o.value === formData.magicalAura)?.emoji} {formData.magicalAura}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Prompt Preview */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h4 className="text-sm font-semibold text-yellow-300 mb-2">Preview (AI prompt will be generated server-side):</h4>
                <p className="text-slate-300 text-sm italic">"{generatePreviewText(formData)}"</p>
              </div>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

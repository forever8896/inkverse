'use client';

import { motion } from 'motion/react';
import {
  STAGE_DISPLAY,
  STYLE_DISPLAY,
  type MonsterStage,
  type MonsterStyle,
  type NFTAttribute,
} from '@/lib/ipfs-utils';

interface MonsterMetadataCardProps {
  name?: string;
  itemId?: number;
  stage: MonsterStage;
  style: MonsterStyle;
  attributes?: NFTAttribute[];
  className?: string;
}

/**
 * Card displaying monster metadata and attributes.
 * Shows name, stage badge, style badge, and attribute grid.
 */
export default function MonsterMetadataCard({
  name,
  itemId,
  stage,
  style,
  attributes = [],
  className = '',
}: MonsterMetadataCardProps) {
  // Generate display name
  const displayName = name || (itemId ? `Monster #${itemId}` : 'Unnamed Monster');

  // Get stage and style display info
  const stageInfo = STAGE_DISPLAY[stage] || STAGE_DISPLAY.egg;
  const styleInfo = STYLE_DISPLAY[style] || { color: '#888', label: style };

  // Filter out internal/duplicate attributes
  const displayAttributes = attributes.filter(
    (attr) =>
      !['Style', 'Stage', 'Has 3D Model'].includes(attr.trait_type) &&
      attr.value !== null &&
      attr.value !== undefined
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`rounded-xl p-5 ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Monster Name */}
      <h2 className="font-pixel text-lg text-white mb-4 uppercase tracking-wider">
        {displayName}
      </h2>

      {/* Badges Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Stage Badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(79, 255, 176, 0.15)',
            border: '1px solid rgba(79, 255, 176, 0.3)',
            color: 'var(--mi-mint)',
          }}
        >
          <span>{stageInfo.emoji}</span>
          <span>{stageInfo.label}</span>
        </span>

        {/* Style Badge */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: `${styleInfo.color}20`,
            border: `1px solid ${styleInfo.color}50`,
            color: styleInfo.color,
          }}
        >
          {styleInfo.label}
        </span>
      </div>

      {/* Attributes Grid */}
      {displayAttributes.length > 0 && (
        <>
          <div className="border-t border-white/10 my-4" />
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Attributes
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {displayAttributes.map((attr, index) => (
              <div
                key={`${attr.trait_type}-${index}`}
                className="p-2 rounded-lg"
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                }}
              >
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                  {attr.trait_type}
                </p>
                <p className="text-sm text-white truncate">
                  {String(attr.value)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

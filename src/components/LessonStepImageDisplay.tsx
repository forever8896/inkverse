import Image from 'next/image';
import { motion } from 'motion/react';

interface LessonStepImageDisplayProps {
  imageUrl: string;
  title: string;
}

/**
 * Displays lesson step images with proper styling and animations
 */
export function LessonStepImageDisplay({
  imageUrl,
  title,
}: LessonStepImageDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full h-full flex items-center justify-center p-6"
    >
      <div className="relative w-full h-full max-w-md">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-contain rounded-lg"
          priority
        />
      </div>
    </motion.div>
  );
}

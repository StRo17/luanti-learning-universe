'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface XpProgressBarProps {
  xp_total: number;
  previousXp?: number;
  maxXp?: number;
  className?: string;
}

export function XpProgressBar({ 
  xp_total, 
  previousXp,
  maxXp = 1000, 
  className = '' 
}: XpProgressBarProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Berechne Fortschritt in Prozent
  const progress = Math.min((xp_total / maxXp) * 100, 100);
  const previousProgress = previousXp ? Math.min((previousXp / maxXp) * 100, 100) : progress;

  // Effekt für XP Erhöhung
  useEffect(() => {
    if (previousXp && xp_total > previousXp) {
      setShowAnimation(true);
      
      // Konfetti Animation
      if (progressBarRef.current) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = (rect.left + rect.right) / 2 / window.innerWidth; // Relative Position
        
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { x, y: 0.7 }, // Starte etwas über der Bar
          colors: ['#fbbf24', '#f59e0b', '#d97706'], // Gold/XP Farben
        });
      }

      // Animation nach 2s zurücksetzen
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [xp_total, previousXp]);

  return (
    <div className={`relative w-full ${className}`} ref={progressBarRef}>
      {/* XP Anzeige */}
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium">XP Total</span>
        <span>{xp_total} / {maxXp}</span>
      </div>

      {/* Progress Bar Container */}
      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
        {/* Animierter Fortschritt */}
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
          initial={{ width: `${previousProgress}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* XP Gewinn Animation */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2"
          >
            <span className="text-yellow-500 font-bold">
              +{xp_total - (previousXp || 0)} XP!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
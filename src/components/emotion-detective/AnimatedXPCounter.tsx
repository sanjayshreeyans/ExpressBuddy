import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Badge } from '../ui/badge';

interface AnimatedXPCounterProps {
  value: number;
  previousValue?: number;
  duration?: number;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AnimatedXPCounter: React.FC<AnimatedXPCounterProps> = ({
  value,
  previousValue = 0,
  duration = 1.5,
  showBadge = true,
  size = 'md',
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(previousValue);
  
  // Spring animation for smooth counting
  const spring = useSpring(previousValue, {
    stiffness: 100,
    damping: 30,
    mass: 1
  });

  const animatedValue = useTransform(spring, (latest) => Math.floor(latest));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = animatedValue.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [animatedValue]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg font-semibold',
    lg: 'text-2xl font-bold'
  };

  const badgeSize = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  if (showBadge) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        <Badge 
          variant="default" 
          className={`${badgeSize[size]} bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold shadow-lg`}
        >
          <motion.span
            key={value}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-1"
          >
            ⭐ {displayValue} XP
          </motion.span>
        </Badge>
      </motion.div>
    );
  }

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`${sizeClasses[size]} ${className} text-yellow-600 font-bold`}
    >
      {displayValue}
    </motion.span>
  );
};

export default AnimatedXPCounter;
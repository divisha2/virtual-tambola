import React from 'react';
import { motion } from 'framer-motion';

function NumberBoard({ calledNumbers, currentNumber }) {
  // Ensure calledNumbers is an array
  const calledArray = Array.isArray(calledNumbers) 
    ? calledNumbers 
    : (calledNumbers ? Object.values(calledNumbers) : []);
  
  const calledSet = new Set(calledArray);

  const getNumberStatus = (num) => {
    if (num === currentNumber) return 'current';
    if (calledSet.has(num)) return 'called';
    return 'not_called';
  };

  const getNumberStyle = (status) => {
    switch (status) {
      case 'current':
        return 'bg-primary text-background border-primary scale-110';
      case 'called':
        return 'bg-secondary text-background border-secondary'; // Keep called numbers highlighted
      case 'not_called':
        return 'bg-transparent text-text border-text-muted';
      default:
        return '';
    }
  };

  return (
    <div className="card">
      <h3 className="text-display text-xl mb-4 text-secondary">NUMBER BOARD</h3>
      <div className="grid grid-cols-9 gap-2">
        {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
          const status = getNumberStatus(num);
          return (
            <motion.div
              key={num}
              initial={false}
              animate={
                status === 'current'
                  ? { scale: [1, 1.1, 1], transition: { duration: 0.3 } }
                  : {}
              }
              className={`
                aspect-square flex items-center justify-center
                border-2 text-sm font-bold
                ${getNumberStyle(status)}
                transition-all duration-200
              `}
            >
              {num}
            </motion.div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-text-muted">
        Called: {calledArray.length} / 90
      </div>
    </div>
  );
}

export default NumberBoard;

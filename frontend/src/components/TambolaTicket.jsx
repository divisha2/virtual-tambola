import React from 'react';
import { motion } from 'framer-motion';

function TambolaTicket({ ticket, markedNumbers = [] }) {
  const markedSet = new Set(markedNumbers);

  // Ensure grid is properly formatted as arrays
  const grid = ticket?.grid?.map(row => {
    if (Array.isArray(row)) return row;
    return Object.values(row);
  }) || [];

  if (!ticket || !grid.length) {
    return (
      <div className="card text-center">
        <p className="text-text-muted">No ticket available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-display text-xl mb-4 text-center text-secondary">
        YOUR TICKET
      </h3>
      
      <div className="grid grid-cols-9 gap-2 max-w-2xl mx-auto">
        {grid.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((cell, colIndex) => {
              const isMarked = cell !== null && markedSet.has(cell);
              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  initial={false}
                  animate={
                    isMarked
                      ? { scale: [1, 1.2, 1], transition: { duration: 0.3 } }
                      : {}
                  }
                  className={`
                    aspect-square flex items-center justify-center
                    text-lg font-bold border-2
                    ${
                      cell === null
                        ? 'border-transparent bg-transparent'
                        : isMarked
                        ? 'border-primary bg-primary text-background'
                        : 'border-text-muted bg-surface text-text'
                    }
                    transition-all duration-200
                  `}
                >
                  {cell || ''}
                </motion.div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-4 text-center text-xs text-text-muted">
        Marked: {markedNumbers.length} / 15
      </div>
    </div>
  );
}

export default TambolaTicket;
